import Review from '../models/reviewModel.js'
// import CatchAsync from '../utils/catchAsync.js'
import {
    createOne,
    deleteOne,
    getAll,
    getOne,
    updateOne,
} from './handlerFactory.js'

//NOTE - In order to use the createOne factory handler function, these two lines (1) if (!req.body.tour) req.body.tour = req.params.tourId (2) if (!req.body.user) req.body.user = req.user.id must be decoupled from the createReview function below. This is where another middleware comes in handy
const setUserAndTourIDs = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
    next()
}

//The new createView function without the setting of user and tour ids because we've extracted the logic into a separate middleware function and add it to our reviewRouter
const createReview = createOne(Review)

//NOTE - createReview function still with the setting User and Tour IDs logic
// const createReview = CatchAsync(async (req, res, next) => {
//     if (!req.body.tour) req.body.tour = req.params.tourId //If there is no tour field set on the req.body object, set the tour field to the Id passed as a params in the url
//     if (!req.body.user) req.body.user = req.user.id //If there is no user field set on the req.body object, set the user field to the id of the user that is logged in and recall that whenever the protect controller is executed, the user that is verified to be logged in would have his id set in the req.user object and the same req.user object is passed to the other controllers that is executed when we visit the /tour/:tourId/reviews route
//     const newReview = await Review.create(req.body)

//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview,
//         },
//     })
// })

// const getReview = CatchAsync(async (req, res, next) => {
//     const review = await Review.findById(req.params.id)

//     res.status(200).json({
//         status: 'success',
//         data: {
//             review,
//         },
//     })
// })

const getAllReviews = getAll(Review)
// const getAllReviews = CatchAsync(async (req, res, next) => {
//     let filter = {}
//     if (req.params.tourId) filter = { tour: req.params.tourId } //Earlier with the help of the mergeParams option, we were able to make the reviewRouter gain access to the tourId param that is passed in the nested route. We want this controller to return every review on a particular tour so we can filter the reviews by tourId and it there are no tourId params, we want to return every review on a particular tour
//     const reviews = await Review.find(filter)
//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: {
//             reviews,
//         },
//     })
// })

const getReview = getOne(Review)

const updateReview = updateOne(Review)

const deleteReview = deleteOne(Review)

export {
    getAllReviews,
    getReview,
    createReview,
    deleteReview,
    updateReview,
    setUserAndTourIDs,
}
