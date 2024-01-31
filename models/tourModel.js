import mongoose from 'mongoose'
import slugify from 'slugify'
// import User from './userModel.js'

//SECTION - Schema
const tourSchema = new mongoose.Schema(
    {
        // name: String, //NOTE - This the short form of name:{type: String}
        name: {
            type: String,
            required: [true, 'Name is required'],
            unique: true, //NOTE - This is the unique property of the name field hence adding another document with the same name will cause a duplicate key error
            trim: true, //NOTE - The trim validator is only used for schema type option String
            maxlength: [
                40,
                'A tour name must have less or equal to 40 characters',
            ],
            minlength: [
                10,
                'A tour name must have more or equal to 10 characters',
            ],
        },
        duration: {
            type: Number,
            required: [true, 'Duration is required'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'Max Group Size is required'],
        },
        difficulty: {
            type: String,
            required: [true, 'Difficulty is required'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty must be either easy, medium or difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above or equal to 1.0'],
            max: [5, 'Rating must be less than or equal 5.0'],
            set: (val) => Math.round(val * 10) / 10, //setter function always executed whenever we set the ratingsAverage field, the val is the actual value of this field and it rounds the value to 1 decimal place which is why we multiplied by 10 and later divided by 10 e.g Math.round(4.5555) = 5 but we want to the value to be 4.6. hence Math.round(4.5555 * 10) => Math.round(45.555) => 46 and then we divided by 10 => 4.6
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
        },
        priceDiscount: Number,
        summary: {
            type: String,
            trim: true,
            required: [true, 'Summary is required'],
        },
        description: {
            type: String,
            trim: true,
        },

        imageCover: {
            type: String, //NOTE - We only store a String reference to the image as the actual images would be saved in a file system
            required: [true, 'Image Cover is required'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(), //NOTE - This is converted to human readable today's date by mongoose automatically because Date.now() returns current time in ms usually called a timestamp
            select: false, //NOTE - This is used to select the value of the field when the document is created which true by default but when false it will not be selected in the res.json() in the client
        },
        startDates: [Date],
        slug: String,
        secretTour: {
            type: Boolean,
            default: false,
        },
        // We are supposed to embed the location document to this tour document as we concluded in the data modelling part but we are actually not embedding it with this. We are just storing the startLocation as a reference to the location document.
        startLocation: {
            //GeoJSON object
            type: {
                //It can also be (type:"Point")
                type: String,
                default: 'Point',
                enum: ['Point'], //Using the enum to validate the only type that it can be is a Point type
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        //This is where we would actually embed the location document to the tour
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number, //The date of the day the tour is held on.
            },
        ],
        //Early in the data modelling brain storming, we concluded that we would use child referencing in the relationship between tour guides(users) and the tours resource but we would show how embed works below for future reference and what we are basically going to add to the array are the IDs of the user and before we save the tour data to the actual DB, we can extract the user via the IDs we specified in the array of the guides field and save the user document embedded with the tour document.
        // guides: Array,
        //NOTE - The actual approach we are going to use in the relationship between the tour guides(users) and the tours document is child referencing and as we concluded in the data modelling part, we are going to use the mongoose.Schema.ObjectId type for the ID field of the user document and we will store the ID of the user document in the guides array of the tour document.
        guides: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

//SECTION - Indexes for better read performance
tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere' })

//SECTION - virtual
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})

//SECTION - Virtual populate - There are a few conditions for this to work
//(1) The resource we want to populate i.e 'reviews' in this case must have a reference to the 'tours' resource and it does by parent referencing
//(2) we must call the populate() method on the Query of the 'tours' Model i.e Tour.find().populate({path:'reviews'}) in the controller function
tourSchema.virtual('reviews', {
    ref: 'Review', // Review Model used to create 'reviews' resource
    localField: '_id', // id field of the localField i.e 'tours' resource
    foreignField: 'tour', // tour field in the 'reviews' resource must the id of localField
})

//SECTION - Document middleware (Pre save)
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})

//Embedding tour guides to the tour document but we won't be using this approach. this is just for future reference
// tourSchema.pre('save', async function (next) {
//     //This middleware is to extract the users whose IDs were specified in the guides array and save them to the tour document. To do this, we use the pre hook that is executed before a document is saved to the actual DB. Since the ID is in an array we can iterate through the array and using the findById method, we can find the user document by ID but recall that we need to await it as it is an async process which would require use to convert the cb of the map method to async function but all async function always return a promise too hence we used the Promise.all() method by awaiting all the promises to get the actual guides array
//     const guides = await Promise.all(
//         this.guides.map(async (id) => await User.findById(id))
//     )

//     this.guides = guides

//     next()
// })

// (Post save)
// tourSchema.post('save', function (doc, next) {
//     console.log(doc)
//     next()
// })

//SECTION - Query Middleware
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    this.start = Date.now()
    next()
})

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    })
    next()
})

tourSchema.post(/^find/, function (doc, next) {
    console.log(`Query took ${Date.now() - this.start}ms`)
    next()
})

//SECTION - Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//     // console.log(this.pipeline())
//     next()
// })

//SECTION - Model(collection)
const Tour = mongoose.model('Tour', tourSchema) //NOTE - This is the name of the collection in the database but mongoose will automatically convert it to lowercase and save as plural. hence, Tour becomes tours

export default Tour
