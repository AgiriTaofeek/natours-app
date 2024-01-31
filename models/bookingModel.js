import mongoose from 'mongoose'
const bookingSchema = new mongoose.Schema({
    //Child referencing
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must belong to a tour!'],
    },
    //Child referencing
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a User!'],
    },
    price: {
        type: Number,
        required: [true, 'Booking must have a price'],
    },
    createAt: {
        type: Date,
        default: Date.now(),
    },
    paid: {
        type: Boolean,
        default: true,
    },
})

//Populate the booking document with the child reference of the user and tour document whenever we make a query to the booking model. This is okay for performance because there won't be many calls to the bookings as only guides and admins will be allowed to query this booking document
bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate({
        path: 'tour',
        select: 'name',
    })
    next()
})

//We are basically saving every bookings made by users into our own database
const Booking = mongoose.model('Booking', bookingSchema)
export default Booking
