import express from 'express'

import {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe,
    getMe,
    uploadUserPhoto,
    resizeUserPhoto,
} from '../controllers/userController.js'
import {
    signUp,
    logIn,
    logOut,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect,
    restrictTo,
} from '../controllers/authController.js'

const router = express.Router()

//SECTION - Routes that don't need authentication
router.route('/signup').post(signUp)
router.route('/login').post(logIn)
router.route('/logout').get(logOut) // It's a get because we simply just want to get the server to overwrite the cookie
router.route('/forgotPassword').post(forgotPassword)
router.route('/resetPassword/:token').patch(resetPassword)

//SECTION - Routes that need authentication. hence, we can just run the protect middleware before all the routes below it
router.use(protect)

//NOTE - Instead of this
// router.route('/me').get(protect, getMe, getUser)
//NOTE - We can do this without the protect middleware and for all others below it
router.route('/me').get(getMe, getUser)
router.route('/updateMyPassword').patch(updatePassword)
router.route('/updateMe').patch(uploadUserPhoto, resizeUserPhoto, updateMe)
router.route('/deleteMe').delete(deleteMe)

//NOTE - Using the same approach to restrict access to the below routes to only admins
router.use(restrictTo('admin'))
//NOTE - The below routes is supposed to look like these
// router
//     .route('/')
//     .get(protect, restrictTo('admin'), getAllUsers)
//     .post(protect, restrictTo('admin'), createUser)

//NOTE - Instead it looks like the below using the power of middleware stack
router.route('/').get(getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)

export default router
