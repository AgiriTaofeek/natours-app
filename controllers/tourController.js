import multer from 'multer'
import sharp from 'sharp'
import Tour from '../models/tourModel.js'
import AppError from '../utils/appError.js'
// import APIFeatures from '../utils/apiFeatures.js'
import catchAsync from '../utils/catchAsync.js'
import {
    createOne,
    deleteOne,
    getAll,
    getOne,
    updateOne,
} from './handlerFactory.js'

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

const uploadTourImages = upload.fields([
    {
        name: 'imageCover',
        maxCount: 1,
    },
    {
        name: 'images',
        maxCount: 3,
    },
])

const resizeTourImages = catchAsync(async (req, res, next) => {
    // console.log(req.files)
    if (!req.files.imageCover || !req.files.images) return next()
    // req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`
    //(1) Cover image processing

    //Since we use the data gotten from req.body to update our DB data in the updateTour controller we need to explicitly set the new imageCover string also to the req.body
    req.body.imageCover = `tours-${req.params.id}-${Date.now()}-cover.jpeg`

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`)

    //(2) Images processing
    req.body.images = [] // Same process as above but we are dealing with an array of strings here like we specified in the tour Schema

    //So basically the req.files.images is an array of objects and we want to do some image processing on the buffer property in each object of the array, hence,  we have to loop through the array of object to process the buffer property of each object in the array. Also note that the image processing package sharp is an async process hence we need to use the Promise.all() function to await each promise of all the object that are going to be processed and we use map() method because it returns an array as Promise.all() expects an array of promises. Without awaiting all the promises in the loop, we might not get all the processed image before the next() function is called
    await Promise.all(
        req.files.images.map(async (file, index) => {
            const filename = `tours-${req.params.id}-${Date.now()}-${
                index + 1
            }.jpeg`

            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`)

            req.body.images.push(filename)
        })
    )
    next()
})
const aliasTopTours = (req, res, next) => {
    //NOTE - Prefilling the query object so we won't need to do that manual on the querystring via URL
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    //NOTE - As usual we need to call the next middleware since we do not return a response object
    next()
}

const getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },

        {
            $addFields: { month: '$_id' },
        },
        {
            $project: {
                _id: 0,
            },
        },
        {
            $sort: { numTourStarts: -1 },
        },
    ])
    res.status(200).json({
        status: 'success',
        results: plan.length,
        data: {
            plan,
        },
    })
})
// const getMonthlyPlan = async (req, res) => {
//     try {
//         const year = req.params.year * 1
//         const plan = await Tour.aggregate([
//             {
//                 $unwind: '$startDates',
//             },
//             {
//                 $match: {
//                     startDates: {
//                         $gte: new Date(`${year}-01-01`),
//                         $lte: new Date(`${year}-12-31`),
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: { $month: '$startDates' },
//                     numTourStarts: { $sum: 1 },
//                     tours: { $push: '$name' },
//                 },
//             },

//             {
//                 $addFields: { month: '$_id' },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                 },
//             },
//             {
//                 $sort: { numTourStarts: -1 },
//             },
//         ])
//         res.status(200).json({
//             status: 'success',
//             results: plan.length,
//             data: {
//                 plan,
//             },
//         })
//     } catch (err) {
//         res.status(404).json({
//             status: 'error',
//             message: err.message,
//         })
//     }
// }

const getAllStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
        {
            $match: { _id: { $ne: 'EASY' } },
        },
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    })
})

// const getAllStats = async (req, res) => {
//     try {
//         const stats = await Tour.aggregate([
//             {
//                 $match: { ratingsAverage: { $gte: 4.5 } },
//             },
//             {
//                 $group: {
//                     _id: { $toUpper: '$difficulty' },
//                     numTours: { $sum: 1 },
//                     numRatings: { $sum: '$ratingsQuantity' },
//                     avgRating: { $avg: '$ratingsAverage' },
//                     avgPrice: { $avg: '$price' },
//                     minPrice: { $min: '$price' },
//                     maxPrice: { $max: '$price' },
//                 },
//             },
//             {
//                 $sort: { avgPrice: 1 },
//             },
//             {
//                 $match: { _id: { $ne: 'EASY' } },
//             },
//         ])

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 stats,
//             },
//         })
//     } catch (err) {
//         res.status(404).json({
//             status: 'error',
//             message: err.message,
//         })
//     }
// }

//NOTE - Get all tours that are within a distance of the coordinates provided in the req.params object
const getToursWithin = catchAsync(async (req, res, next) => {
    // '/tours-within/:distance/center/:latlng/unit/:unit'
    const { distance, latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1 //convert distance/radius that the geoSpatial query uses to search for a Tour that is within a distance to radians
    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat,lng',
                400
            )
        )
    }

    // console.log({ lat, lng, distance, unit })
    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius],
            },
        },
    })

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    })
})

//Calculate all the distances from the coordinates provided in the request params object to all tours in the our Tours DB
const getDistances = catchAsync(async (req, res, next) => {
    // '/tours-within/:distance/center/:latlng/unit/:unit'
    const { latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat,lng',
                400
            )
        )
    }

    const distances = await Tour.aggregate([
        {
            //$geoNear must always be the first stage in the pipeline and it also requires that one of our fields contains geoSpatial index like we did with the startLocation field in the tourModel.js file. $geoNear will automatically use that field to perform it's calculations but we can also pass our own key
            $geoNear: {
                near: {
                    //geoJSON object
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1],
                },
                distanceField: 'distance', //name of field that will created
                distanceMultiplier: multiplier, //distance multiplier that will be applied to the distance field to return the distance in kilometer
            },
        },
        {
            //$project stage helps select the fields that we want to return in the response JSON data. In this case we are only returning the distance field and name
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ])

    res.status(200).json({
        status: 'success',
        data: {
            data: distances,
        },
    })
})

const getAllTours = getAll(Tour)
// const getAllTours = catchAsync(async (req, res, next) => {
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate()
//     const tours = await features.query //NOTE - awaiting the query will return the documents

//     res.status(200).json({
//         status: 'success',
//         requestedAt: req.requestTime,
//         results: tours.length,
//         data: {
//             tours,
//         },
//     })
// })
// const getAllTours = async (req, res) => {
//     try {
//         // const queryObj = { ...req.query }
//         // const excludedFields = ['page', 'sort', 'limit', 'fields']
//         // excludedFields.forEach((field) => delete queryObj[field])
//         // // console.log(req.query, queryObj)

//         // //SECTION - Advanced querying
//         // let queryStr = JSON.stringify(queryObj)
//         // queryStr = queryStr.replace(
//         //     /\b(gte|gt|lte|lt)\b/g,
//         //     (match) => `$${match}`
//         // )

//         // let query = Tour.find(JSON.parse(queryStr)) //NOTE - without await, the Tour model returns a Query

//         //SECTION - Sorting
//         // if (req.query.sort) {
//         //     const sortBy = req.query.sort.split(',').join(' ')
//         //     // console.log(sortBy)
//         //     query = query.sort(sortBy)
//         // } else {
//         //     query = query.sort('-createdAt') //NOTE - default sort
//         // }

//         //SECTION - Field limiting
//         // if (req.query.fields) {
//         //     const fields = req.query.fields.split(',').join(' ')
//         //     query = query.select(fields)
//         // } else {
//         //     query = query.select('-__v') //NOTE - default select
//         // }

//         //SECTION - Pagination
//         // const page = req.query.page * 1 || 1
//         // const limit = req.query.limit * 1 || 100
//         // const skip = (page - 1) * limit
//         // query = query.skip(skip).limit(limit)

//         // if (req.query.page) {
//         //     const numTours = await Tour.countDocuments()

//         //     if (skip >= numTours) throw new Error('Page does not exist')
//         // }

//         const features = new APIFeatures(Tour.find(), req.query)
//             .filter()
//             .sort()
//             .limitFields()
//             .paginate()
//         const tours = await features.query //NOTE - awaiting the query will return the documents

//         res.status(200).json({
//             status: 'success',
//             requestedAt: req.requestTime,
//             results: tours.length,
//             data: {
//                 tours,
//             },
//         })
//     } catch (err) {
//         res.status(404).json({
//             status: 'error',
//             message: err.message,
//         })
//     }
// }

const getTour = getOne(Tour, { path: 'reviews' })
// const getTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews')
//     // const tour = await Tour.findById(req.params.id).populate({
//     //     path: 'guides',
//     //     select: '-__v -passwordChangedAt',
//     // }) //The populate method is used to include related document i.e tour guide from the users collection in the response JSON data not the actual database. I commented this because i used a Query middleware to populate and if we use the Query middleware to populate, we still have to call populate() in the controller function
//     if (!tour) {
//         return next(new AppError('No tour found with that Id', 404)) // This error is sent to the global error handling middleware
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour,
//         },
//     })
// })

// const getTour = async (req, res) => {
//     try {
//         const tour = await Tour.findById(req.params.id)
//         res.status(200).json({
//             status: 'success',
//             data: {
//                 tour,
//             },
//         })
//     } catch (err) {
//         res.status(404).json({
//             status: 'error',
//             message: err.message,
//         })
//     }
// }

const updateTour = updateOne(Tour)
// const updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true,
//     })
//     if (!tour) {
//         return next(new AppError('No tour found with that Id', 404)) // This error is sent to the global error handling middleware
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour,
//         },
//     })
// })

// const updateTour = async (req, res) => {
//     try {
//         const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//             new: true,
//             runValidators: true,
//         })
//         res.status(200).json({
//             status: 'success',
//             data: {
//                 tour,
//             },
//         })
//     } catch (err) {
//         res.status(404).json({
//             status: 'error',
//             message: err.message,
//         })
//     }
// }

const deleteTour = deleteOne(Tour)
// const deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id)
//     if (!tour) {
//         return next(new AppError('No tour found with that Id', 404)) // This error is sent to the global error handling middleware
//     }
//     res.status(204).json({
//         status: 'success',
//         data: null,
//     })
// })

// const deleteTour = async (req, res) => {
//     try {
//         await Tour.findByIdAndDelete(req.params.id)
//         res.status(204).json({
//             status: 'success',
//             data: null,
//         })
//     } catch (err) {
//         res.status(404).json({
//             status: 'error',
//             message: err.message,
//         })
//     }
// }

const createTour = createOne(Tour)
// const createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body)
//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour,
//         },
//     })
// })

// const createTour = async (req, res) => {
//     //NOTE - Every error that can arise probably due to the validator in schema or network will be caught in catch block
//     try {
//         const newTour = await Tour.create(req.body)
//         res.status(201).json({
//             status: 'success',
//             data: {
//                 tour: newTour,
//             },
//         })
//     } catch (err) {
//         res.status(400).json({
//             status: 'error',
//             message: err.message,
//         })
//     }
// }

export {
    aliasTopTours,
    getMonthlyPlan,
    getAllStats,
    getToursWithin,
    getDistances,
    getAllTours,
    getTour,
    createTour,
    updateTour,
    deleteTour,
    uploadTourImages,
    resizeTourImages,
}
