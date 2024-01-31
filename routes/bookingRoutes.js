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

router.route('/checkout-session/:tourID').get(getCheckoutSession)

router.use(restrictTo('admin', 'lead-guide')) //All controller below are restricted to only admin and lead-guide users

router.route('/').get(getAllBooking).post(createBooking)
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking)
export default router
