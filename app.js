import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'
import hpp from 'hpp'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import * as url from 'url'
import * as dotenv from 'dotenv'
dotenv.config({ path: './config.env' })

import tourRouter from './routes/tourRoutes.js'
import userRouter from './routes/userRoutes.js'
import reviewRouter from './routes/reviewRoutes.js'
import bookingRouter from './routes/bookingRoutes.js '
import viewRouter from './routes/viewRoutes.js'
import AppError from './utils/appError.js'
import GlobalErrorHandler from './controllers/errorController.js'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const app = express()

//SECTION - Trust proxy(An extension of the solution of testing if our app is secure when deployed. as seen in the createAndSendToken func in authController)
app.enable('trust proxy')

//SECTION - Setting the template engine to be used by express
app.set('view engine', 'pug')

//SECTION - Setting the path to the views folder
app.set('views', path.join(__dirname, 'views'))

//NOTE - Serving static files from the public directory
app.use(express.static(path.join(__dirname, 'public')))

//SECTION - Built-in middleware
// console.log('process env in app.js =>', process.env.NODE_ENV)
// console.log('In app.js')
// console.log('----------------------')
// console.log(process.env.NODE_ENV)

//NOTE - Set HTTP headers to secure the application
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
)

// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: ["'self'"],
//             scriptSrc: ["'self'", 'https://api.mapbox.com', 'blob:', "'self'"],
//             connectSrc: [
//                 "'self'",
//                 'https://api.mapbox.com',
//                 'https://events.mapbox.com',
//             ],
//         },
//     })
// )

//NOTE - Apply morgan to log the requests in development mode
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

//NOTE - limiter function to limit the number of requests per IP
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // This means that we want to allow 100 limit like we specified below in 60 minutes converted to milliseconds
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 60 minutes as specified above)
    message: 'Too many requests from this IP, please try again after an hour', // This is the error message that will be shown if the limit is exceeded
})

//NOTE - Apply the rate limiting middleware to all routes that starts with /api
app.use('/api', limiter)

//NOTE - Body parser that allows reading data from req.body and the limit option controls the maximum request body size. If this is a number, then the value specifies the number of bytes; if it is a string, the value is passed to the bytes library for parsing. Defaults to '100kb'.
app.use(express.json({ limit: '10kb' }))

//NOTE - Form data parser. This allows the data POST request to the server to be available in req.body object
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

//NOTE - Cookie parser allows the express server to parse the cookie data at every incoming request
app.use(cookieParser())

//NOTE - Data sanitization against NoSQL injection attacks. What it does behind scenes is to look at the req.body , req query string and req params. it would then filter out all of the dollar signs and dots because that's how mongoDB operators are written
app.use(mongoSanitize())

//NOTE - Data sanitization against XSS attacks. This will sanitize any data in req.body, req.query, and req.params.
app.use(xss())

//NOTE - Prevent HTTP parameter pollution.This will prevent the req.query object from having multiple fields of the same name
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
)

//NOTE - Compression middleware to compress our responses, so basically, whenever we send a text response to a client no matter if that's JSON or HTML code with compression package that text will be dramatically compressed. NB:- Doesn't compresses images and files generally
app.use(compression())

//SECTION - APPLICATION MIDDLEWARE

//NOTE - This middleware will be executed every time a request is made to the server because we did not specify any route
// app.use((req, res, next) => {
//     console.log('Hello from the middleware...')
//     next()
// })

//NOTE - Useful middleware to manipulate the request object
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    // console.log(req.cookies) // We gain access to these now in the req object because of the cookie-parser middleware
    next()
})

//SECTION - ROUTER MIDDLEWARE

//NOTE - In order to keep the router in a separate file, we have to use the router() function from express to create a new instance of the router

//NOTE - This process of using express.Router() to create a router Middleware and making use of it in the app.use() as the second parameter is known as mounting
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

//SECTION - Unhandled route middleware
//NOTE - This middleware is added as the last of the middleware stack because it is meant to be executed only when no other middleware or route handler matches the request.
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'Fail',
    //     message: `Can't find ${req.originalUrl} on the server`,
    // })
    // const err = new Error(`Can't find ${req.originalUrl} on this server`)
    // err.statusCode = 404
    // err.status = 'fail'
    // next(err)
    const err = new AppError(
        `Can't find ${req.originalUrl} on this server`,
        404
    )
    next(err)
})

//NOTE - Error handling middleware which would catch errors coming from all over the node application
app.use(GlobalErrorHandler)
// const PORT = process.env.PORT || 3000

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}...`)
// })

export default app
