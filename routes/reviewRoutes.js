import express from 'express'
import {
    getAllReviews,
    createReview,
    deleteReview,
    updateReview,
    setUserAndTourIDs,
    getReview,
} from '../controllers/reviewController.js'
import { protect, restrictTo } from '../controllers/authController.js'

const router = express.Router({ mergeParams: true }) //mergeParams option makes it possible to gain access to the tourId from the tourRouter

//NOTE - All review actions require a logged in user
router.use(protect)

router
    .route('/')
    .get(getAllReviews) //We modified the getAllReviews function to make use of the tourId as a parameter
    .post(restrictTo('user'), setUserAndTourIDs, createReview) //we also modified the createReview function to make use of the tourId as a parameter

router
    .route('/:id')
    .get(getReview)
    .delete(restrictTo('user', 'admin'), deleteReview)
    .patch(restrictTo('user', 'admin'), updateReview)

export default router
