import Tour from '../models/tourModel.js'
import User from '../models/userModel.js'
import Booking from '../models/bookingModel.js'
import AppError from '../utils/appError.js'
import catchAsync from '../utils/catchAsync.js'

const getOverview = catchAsync(async (req, res, next) => {
    //STEPS TO TAKE BEFORE SERVER SIDE RENDERING
    //(1) Get tour data from collection
    const tours = await Tour.find()

    //(2) Build template
    // This step done by pug

    //(3) Render that template using tour data from step(1)
    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    })
})

const getTour = catchAsync(async (req, res, next) => {
    //(1) Get the tour data which must include the reviews and tour guides data
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    })

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404))
    }
    //(2) Build template using pug

    //(3) Render template using the data from step(1)
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    })
})

const getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Log into your account ',
    })
})
const getSignupForm = catchAsync(async (req, res, next) => {
    // console.log('signup')
    res.status(200).render('signup', {
        title: 'Sign up an account ',
    })
})

const getAccount = catchAsync(async (req, res, next) => {
    res.status(200).render('account', {
        title: 'Your account',
    })
})

// We can also use the virtual populate on this
const getMyTours = catchAsync(async (req, res, next) => {
    //* (1) Find all bookings from the currently logged in user. It would probably return an array of bookings document if the currently logged user has more than one booking. Also remember the booking document only contains the tour IDs hence we have to use those IDs to get the tour data as shown below in step(2)
    const bookings = await Booking.find({ user: req.user.id })
    //* (2) Find tours with the returned IDs
    const tourIds = bookings.map((booking) => booking.tour) //Returns an array of tour IDs

    /* 
     This line of code below is querying the Tour model in MongoDB to find all tours where the _id field matches any id in the tourIds array.
      Here's a breakdown:
        - Tour.find(): This is a MongoDB operation that fetches documents from the Tour collection.
        - { _id: { $in: tourIds } }: This is the query object. _id is the field we're matching against, and $in is a MongoDB operator that matches any of the values specified in an array. So, { $in: tourIds } will match any document where the _id is in the tourIds array.

        In summary, this line is fetching all tour documents from the database where the tour's _id is in the tourIds array.
     */
    const tours = await Tour.find({ _id: { $in: tourIds } })

    //We finally send the tours and reuse the overview template to render the bookings by a particular user
    res.status(200).render('overview', {
        title: 'My tours',
        tours,
    })
})

const updateUserData = catchAsync(async (req, res, next) => {
    // console.log(req.body) //without the urlencoded middleware the req.body will be empty

    //Never use the findByIdAndUpdate() method to update a password because it is not going to run the safe middleware which will take care of encrypting our passwords. Hence there is always a special and separate route for updating passwords and even UI.
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        }
    )

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser, // This is the updated user not the one from res.locals in the protect middleware
    })
})
export {
    getOverview,
    getTour,
    getLoginForm,
    getSignupForm,
    getAccount,
    getMyTours,
    updateUserData,
}
