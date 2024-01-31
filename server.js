// import dotenv from 'dotenv'
// dotenv.config({ path: './config.env' })
// console.log('server process', dotenv.config({ path: './config.env' }))
// console.log('in the server.js')
// //NOTE - We need to do this before importing the app.js file because we want the process.env object to have the env data we specified in the config.env file before the proper app code starts to run

import mongoose from 'mongoose'

import app from './app.js'

//NOTE - The ‘uncaughtException’ is an event of class Process within the processing module which is emitted when an uncaught JavaScript exception bubbles all the way back to the event loop.This event does not accept any argument as a parameter. This event returns nothing but a callback function for further operation.
process.on('uncaughtException', (err) => {
    console.log(err.name, err.message)
    console.log('UNCAUGHT EXCEPTION 💥! Shutting down')
    process.exit(1)
})

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
)
// mongoose
//     .connect(DB, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     })
//     .then(() => {
//         // console.log(con.connection.name)
//         console.log('DB connection successful')
//         console.log('------------------------------')
//     })

async function connectMongoose() {
    await mongoose.connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    console.log('DB connection successful')
    console.log('------------------------------')
}

connectMongoose()

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    // console.log(`Server is running on port ${PORT}...`)
})

//NOTE - The process is the global object in Node.js that maintains track of and includes all of the information about the specific Node.js process that is running on the computer at the time. When a promise rejection is not handled, the unhandled rejection event is emitted. Node.js issues an UnhandledPromiseRejectionWarning to the terminal and promptly ends the process. The global Node.js process has an unhandled rejection event. This event is triggered when an unhandled rejection happens and there is no handler in the promise chain to handle it.
process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message)
    console.log('UNHANDLED REJECTION 💥! Shutting Down')
    server.close(() => {
        process.exit(1)
    })
})
