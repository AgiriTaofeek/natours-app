import dotenv from 'dotenv'
dotenv.config({ path: '../../config.env' })
console.log(process.env)
import fs from 'fs'
import * as url from 'url'
import mongoose from 'mongoose'
import Tour from '../../models/tourModel.js'
import User from '../../models/userModel.js'
import Review from '../../models/reviewModel.js'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
)

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('DB connection success'))

//NOTE - READ JSON FILE
const tours = JSON.parse(
    // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
    fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
)
const users = JSON.parse(
    // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
    fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
)
const reviews = JSON.parse(
    // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
)

//NOTE - IMPORT JSON TO DB
const importData = async () => {
    try {
        await Tour.create(tours)
        await User.create(users, { validateBeforeSave: false })
        await Review.create(reviews)

        console.log('Data successfully loaded')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

//NOTE - DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('Data successfully deleted')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

// console.log(process.argv)
if (process.argv[2] === '--import') {
    importData()
} else if (process.argv[2] === '--delete') {
    deleteData()
}
