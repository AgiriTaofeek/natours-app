import crypto from 'crypto'
import mongoose from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true, // Converts email to lowercase before saving to the database
        validate: [validator.isEmail, 'Please provide a valid email'], // Custom validation function
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false, // This will prevent the password from being returned in the response when we fetch a user document but it would be in the actual DB
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],

        validate: {
            //This only works when you save a new document to the database using .save() or .create()
            validator: function (v) {
                return v === this.password
            },
            message: 'Passwords do not match',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true, // Set default value of active to true
        select: false, // This will prevent the active field from being returned in the response when we fetch a user document but it would be in the actual DB
    },
})

//NOTE - Encrypt the password before saving it to the database
userSchema.pre('save', async function (next) {
    //It only makes sense to encrypt the password if the user is creating a new document or updating the password field hence if we are not doing either of this the code below should be executed. Imagine encrypting the password when all we are doing is update the email field for example.
    if (!this.isModified('password')) {
        // Recall 'this' refers to the document object that is created before the save/create method is executed on the Model
        return next()
    }
    this.password = await bcrypt.hash(this.password, 12) // 12 is the number of iterations to hash the password. The higher the number the more secure the password.
    this.passwordConfirm = undefined // We don't want to save the passwordConfirm field to the database
    next()
})

//NOTE - Add the current timestamp to the passwordChangedAt field
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        //If the password field in the user document has not been modified (!this.isModified('password'))i.e updated or created newly OR the document as a whole is created newly which the (this.isNew) checks, exit this middleware and not modify the passwordChangedAt field in the user document.
        return next()
    }

    // This should work fine in Theory but actually in practice sometimes a small problem happens and that problem is that saving to the DB is a bit slower than issuing JWT, making it so that the passwordChangedAt field timestamp is sometimes set a bit after the JWT has been created. That will make it so that the user will not be able to log in using the new token as it would be assumed that the password has been changed after the JWT has been issued. Hence a great hack is to minus by 1ms
    this.passwordChangedAt = Date.now() - 1000 // Set the passwordChangedAt field to the current date and time
    next()
})

//NOTE - Query middleware would enforce that whenever we use the query method that starts with 'find', it would only return user document that have the active field set to true before the actually (await User.find()) query is executed in the controller function. hence, there is a chain of query when we use a method that starts with 'find'
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } })
    //this.find({ active: true }) // This would return all the user document that have the active field set to true
    next()
})

//NOTE - This method is like adding a method to the prototype of a constructor function when we work with OOP in javascript. In this context, the document that is returned when we await this userModel in the controller function we would get an Object(document) which would have access to this method e.g const user = await User.findOne({email}). this user constant would automatically have access to comparePassword method. we can use it like => user.comparePassword()
userSchema.methods.comparePassword = async function (
    candidatePassword,
    userPassword
) {
    // This would not work because we have added select field to false to the password in the schema hence we don't have access to the password
    // return bcrypt.compare(candidatePassword, this.password)
    return bcrypt.compare(candidatePassword, userPassword) // Return true if the passwords match otherwise false
}

//NOTE - Another instance method on the userModel to help check if the logged in user has changed his password because we do not want to allow a user that has changed his password access to our protected route with the token that was generated for him before he changed his password
userSchema.methods.isPasswordChanged = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        //if the passwordChangedAt field exists, we can then check if the JWTTimestamp is greater than the passwordChangedAt field value
        const passwordChangedAtToTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        ) // We had to divide by 1000 because the timestamp is in seconds and we want to convert it to milliseconds like the JWTTimestamp
        // console.log(passwordChangedAtToTimestamp, JWTTimestamp)
        return JWTTimestamp < passwordChangedAtToTimestamp // We are comparing the JWTTimestamp with the passwordChangedAt field value and we would expect that the password has been changed by the user if the passwordChangedAt field value is greater than the JWTTimestamp. It is common sense that the if the password is changed after the token has been generated then the passwordChangedAtToTimestamp would be greater than the JWTTimestamp
    }

    // By default we set to false to be safe i.e password has not been changed
    return false
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex') // 32 is the length of the token

    // Encrypt the resetToken using SHA256 algorithm from the built in crypto module and save it in the actual DB as passwordResetToken
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    // console.log({ resetToken }, this.passwordResetToken)

    //Set and add to the DB that the encrypted resetToken should expire after 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes in milliseconds

    //Finally return the resetToken because we would send it via email to the user
    return resetToken
}

const User = mongoose.model('User', userSchema)

export default User
