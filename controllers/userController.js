import multer from 'multer'
import sharp from 'sharp'
import User from '../models/userModel.js'
import catchAsync from '../utils/catchAsync.js'
import AppError from '../utils/appError.js'
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory.js'

//NOTE - disk storage of where we want to upload our images and how they should be saved in our filesystem
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users')
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1]
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     },
// })

//NOTE - Saving the to the computer memory as a (buffer) and it would available ar req.file.buffer
const multerStorage = multer.memoryStorage()

//NOTE - FIlter to test if the file we are uploading is an image or not
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false)
    }
}
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
})

const uploadUserPhoto = upload.single('photo')

const resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next()
    //We explicitly set the filename and add to to req.file object
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`)
    next()
})

//NOTE - This function filters out the strings that won't be passed as the 2nd parameter i.e the allowedFields rest parameters
const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) {
            // Recall that we always store data on whatever is on the LHS of the of a equals sign in Javascript
            newObj[el] = obj[el]
        }
    })
    return newObj
}

const getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

const getAllUsers = getAll(User)

const getUser = getOne(User)

const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! please use the /signup route',
    })
}
const updateUser = updateOne(User) //Do not update password with this controller

//NOTE - Only the admin should be allowed to delete a user from the actual DB
const deleteUser = deleteOne(User)

//NOTE - This controller function is for users that are already authenticated i.e logged in to be able to update their own profile information like email, name etc
const updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file)
    // console.log(req.body)

    //(1) Create error if user tries to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'Password cannot be updated on this route. please use /updateMyPassword',
                400
            )
        )
    }

    //(2) update user document

    const filteredBody = filterObj(req.body, 'email', 'name') //This function filters out fields we don't want to update. We did this because we don't want some of the fields to be updated like role. Imagine any user updating their role to that of an admin😁

    //NOTE - Saving the uploaded image name string to the DB as a link to the filesystem where the actual image is saved
    if (req.file) filteredBody.photo = req.file.filename // The uploaded image is always in the req.file object

    // In the updatePassword controller function, we updated the password manually and used the save() method because we had some document query middleware that is only executed before the 'save' event which is triggered by the save() method. In this case, we don't have to use the save() method as this action doesn't depend on some document query middleware. The findByIdAndUpdate() method is used to update a document by its ID and since this controller function is only meant for logged in users, we can simply use the user added in the protect controller to the req object to query for the user in the DB as the 1st parameter, the 2nd parameter is the object with fields we want to update and the 3rd parameter is the options object. the (new:true) ensures the newly updated fields returns and (runValidators:true) ensures the validation is run before the update is made.
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    )

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    })
})

//NOTE - This controller is for users that are already authenticated i.e logged in to be able to delete their account. Deleting behind in scenes in this context is actually not deleting a user data from the DB but toggling the active field in the user document to false. This is done because a user might come back later to signup.
const deleteMe = catchAsync(async (req, res, next) => {
    //(1) Set active field to false to signify that a user has deleted his data
    await User.findByIdAndUpdate(req.user.id, { active: false })

    //(2) This step is for the Query Middleware in the userModel to run before any event that starts with 'find' i.e findByIdAndUpdate, findOneAndUpdate, findOneAndDelete, findOneAndRemove, findAndRemove, etc. Basically whenever we make a query to the DB with a method that starts with 'find', we only want the user document object that has the field (active : true) to be returned.

    res.status(204).json({
        status: 'success',
        data: null,
    })
})

export {
    getAllUsers,
    getUser,
    getMe,
    createUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe,
    uploadUserPhoto,
    resizeUserPhoto,
}
