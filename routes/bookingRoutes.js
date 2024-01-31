import express from 'express'
import { protect, restrictTo } from '../controllers/authController.js'
import {
    createBooking,
    deleteBooking,
    getAllBooking,
    getBooking,
    getCheckoutSession,
    updateBooking,
} from '../controllers/bookingController.js'

const router = express.Router()

router.use(protect) //All controller below are protected

router.route('/checkout-session/:tourID').get(getCheckoutSession) //This is called from the frontend i.e stripe.js file in public folder and then in turn calls the getCheckoutSession controller which creates a session and then sends it back to the frontend(client). After the processing of the payment is successfully done by stripe, it redirects the user on the frontend to the success_url in the getCheckoutSession controller. Once that success_url is called, it creates a new booking document that is persisted in the DB. The success_url looks like this (`${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`) which is basically the '/my-tours' route from viewRoutes.js file with some querystring. The redirecting to the success_url route will in turn call the createBookingCheckout controller function which basically saves the booking in the DB and see function for further clarification on what it does.

router.use(restrictTo('admin', 'lead-guide')) //All controller below are restricted to only admin and lead-guide users

router.route('/').get(getAllBooking).post(createBooking)
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking)
export default router
