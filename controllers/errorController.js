import AppError from '../utils/appError.js'

const sendErrorDev = (err, req, res) => {
    //NOTE - Apart from sending different error messages in the Dev and Prod environment we also want different error format to the raw API in JSON format and a rendered webpage error format
    if (req.originalUrl.startsWith('/api')) {
        //req.originalUrl returns the url from slash hostname
        //Check for the API
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack,
        })
    } else {
        console.error('ERROR 💥', err)

        res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        })
    }
}

const sendErrorProd = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        //NOTE - Sending operational error to client in production mode
        // console.log('api')
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            })
            //NOTE - Generic response to Programming or other errors
        }
        console.error('ERROR 💥', err) // logged  Error would be visible on the hosting platform for the server
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        })
    }
    //RENDER WEBPAGE
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        })
    }
    console.error('ERROR 💥', err)
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: 'Please try again later',
    })
}

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`

    return new AppError(message, 400)
}

const handleDuplicateKeyErrorDB = (err) => {
    const value = err.keyValue.name
    const message = `Duplicate field value: ${value}. Please use another value!`
    return new AppError(message, 400)
}

const handleValidationErrorsDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message) //Object.values will return an array of objects (i.e values of the err.errors Object). map() method will return an array of the message property of each object in the array

    const message = `Invalid input data. ${errors.join('. ')}` //join() method will join the array elements with a specified separator
    return new AppError(message, 400)
}
const handleJsonWebTokenError = () =>
    new AppError(`Invalid token. Please log in again`, 401)

const handleTokenExpiredError = () =>
    new AppError('Your token has expired. Please log in again', 401)

const GlobalErrorhandler = (err, req, res, next) => {
    // console.log('globalError')
    err.statusCode = err.statusCode || 500 // using the statusCode on the err object or default 500(internal server error)
    err.status = err.status || 'error'
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') {
        // let error = { ...err } //this won't work because it's a shallow copy and it won't have access to the name property in the err object prototype
        let error = Object.create(err) // This worked because the name property is in the prototype of the err object as Object.create(err) duplicate the err object with it's prototypal properties
        // console.log(error.__proto__)

        if (error.name === 'CastError') {
            error = handleCastErrorDB(error)
        }

        if (error.code === 11000) {
            error = handleDuplicateKeyErrorDB(error)
        }

        if (error.name === 'ValidationError') {
            error = handleValidationErrorsDB(error)
        }

        if (error.name === 'JsonWebTokenError') {
            error = handleJsonWebTokenError()
        }
        if (error.name === 'TokenExpiredError') {
            error = handleTokenExpiredError()
        }
        sendErrorProd(error, req, res)
    }
}

export default GlobalErrorhandler
