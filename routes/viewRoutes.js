import express from 'express'
import {
    getOverview,
    getTour,
    getLoginForm,
    getAccount,
    updateUserData,
    getMyTours,
    getSignupForm,
} from '../controllers/viewController.js'
import { isLoggedIn, protect } from '../controllers/authController.js'
// import { createBookingCheckout } from '../controllers/bookingController.js'
const router = express.Router()

// router.use(isLoggedIn) // We can use this before every other middleware in the stack because the isLoggedIn middleware does not send any error to the globalError middleware which would normally terminate the req-res cycle but we won't because of the protect controller for the /me route that needs to query the DB just like the loggedIn controller does
router.route('/').get(isLoggedIn, getOverview)
router.route('/tour/:slug').get(isLoggedIn, getTour)
router.route('/login').get(isLoggedIn, getLoginForm)
router.route('/signup').get(isLoggedIn, getSignupForm)
router.route('/me').get(protect, getAccount)
router.route('/my-tours').get(protect, getMyTours)
// router.route('/my-tours').get(createBookingCheckout, protect, getMyTours) //We added the createBookingCheckout because we used the '/my-tour' route to send some data via querystring for our stripe success_url (temporary solution)

// For the traditional method of sending data to the server using the form element we have to create a new route
router.route('/submit-user-data').post(protect, updateUserData)

export default router
