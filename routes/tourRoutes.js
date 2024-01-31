import express from 'express'
import {
    aliasTopTours,
    getMonthlyPlan,
    getAllStats,
    getAllTours,
    createTour,
    getTour,
    updateTour,
    deleteTour,
    getToursWithin,
    getDistances,
    uploadTourImages,
    resizeTourImages,
} from '../controllers/tourController.js'
import { protect, restrictTo } from '../controllers/authController.js'
import reviewRouter from './reviewRoutes.js'
// import { createReview } from '../controllers/reviewController.js'
const router = express.Router()

//NOTE - Param middleware (we can get access to the parameter value)
// router.param('id', checkID);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours)
router.route('/tour-stats').get(getAllStats)
router
    .route('/monthly-plan/:year')
    .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan)

router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(getToursWithin)

router.route('/distances/:latlng/unit/:unit').get(getDistances)

router
    .route('/')
    .get(getAllTours)
    .post(protect, restrictTo('admin', 'lead-guide'), createTour) //Any route that has the protect function means that a user must be logged in to access it and the restrictTo function means that the users that are specified in the function would access it
router
    .route('/:id')
    .get(getTour)
    .patch(
        protect,
        restrictTo('admin', 'lead-guide'),
        uploadTourImages,
        resizeTourImages,
        updateTour
    )
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour) // The protect run 1st, then the restrictTo and finally the deleteTour

//NOTE - Nested Route
//POST /tour/2345/reviews - create a review for a tour
//GET /tour/2345/reviews - get all reviews for a tour
//GET /tour/2345/reviews/6789 - get a specific review

router.use('/:tourId/reviews', reviewRouter) //The right approach to implement nested route

// router.route('/:tourId/reviews').post(protect, restrictTo('user'), createReview) //FIXME - Bad approach to implementing nested route

export default router
