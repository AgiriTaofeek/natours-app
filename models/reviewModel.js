import mongoose from 'mongoose'
import Tour from './tourModel.js'

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty'],
        },

        rating: {
            type: Number,
            min: [1, 'Rating must be between 1 and 5'],
            max: [5, 'Rating must be between 1 and 5'],
        },
        createdAt: {
            type: Date,
            default: Date.now, //mongoose will automatically set the date when the document is created by calling Date.now()
        },
        //We are implementing a one-to-many relationship and parent referencing between (User and Review) and (Tour and Review) so we need to specify the type of the relationship in the schema. Recall that parent referencing requires that the child (review) would have the parent (user) ID in it's own document and also the child (review) would have the parent (tour) ID in it's own document.
        tour: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
    },
    {
        toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals

        toObject: { virtuals: true }, // So `console.log()` and other functions that use `toObject()` include virtuals
    }
)
//NOTE - Index the user and tour fields to make their combo unique and prevent a user from making so many reviews on a tour
reviewSchema.index({ user: 1, tour: 1 }, { unique: true })
//NOTE - populate the user path in the review document with query middleware
reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name',
    // }).populate({
    //     path: 'user',
    //     select: 'name photo',
    // }) //Populating the reviews document in the tour document results in a chain of populations. Hence for better performance we can just populate the user path alone and since we would populate this in the tour document

    this.populate({
        path: 'user',
        select: 'name photo',
    })
    next()
})

//Static method to calculate average Rating
reviewSchema.statics.calcAverageRating = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                numRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ])

    // console.log(stats)
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].numRatings,
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0,
        })
    }
}

//NOTE - calculate average rating on save
reviewSchema.post('save', function () {
    this.constructor.calcAverageRating(this.tour)
})

//NOTE - calculate average rating on update and delete
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne()
    next()
})

reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calcAverageRating(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema)

export default Review
