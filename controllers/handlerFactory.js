import catchAsync from '../utils/catchAsync.js'
import AppError from '../utils/appError.js'
import APIFeatures from '../utils/apiFeatures.js'

const deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id)
        if (!doc) {
            return next(new AppError('No document found with that Id', 404)) // This error is sent to the global error handling middleware
        }

        res.status(204).json({
            status: 'success',
            data: null,
        })
    })

const updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
        if (!doc) {
            return next(new AppError('No document found with that Id', 404)) // This error is sent to the global error handling middleware
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        })
    })

const createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body)
        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        })
    })

const getOne = (Model, populateOption) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id)
        if (populateOption) {
            query = query.populate(populateOption)
        }
        const doc = await query

        if (!doc) {
            return next(new AppError('No document found with that Id', 404)) // This error is sent to the global error handling middleware
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        })
    })

const getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        //NOTE - We have added this filter line of code so that our nested route can work and luckily for us, if we are not working with nested routes, the filter object would be empty which is the same as before without the nested route constraint
        let filter = {}
        if (req.params.tourId) filter = { tour: req.params.tourId }

        // const features =  new APIFeatures(Model.find(filter), req.query)
        //     .filter()
        //     .sort()
        //     .limitFields()
        //     .paginate()
        // const doc = await features.query //NOTE - awaiting the query will return the documents

        //NOTE - It is important to await the features object below because when we chained the methods it houses, the paginate method is an async function that needs to be awaited
        const features = await new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate()
        const doc = await features.query //NOTE - awaiting the query will return the documents

        res.status(200).json({
            status: 'success',
            requestedAt: req.requestTime,
            results: doc.length,
            data: {
                data: doc,
            },
        })
    })

export { deleteOne, updateOne, createOne, getOne, getAll }
