import { promisify } from 'util'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/userModel.js'
import catchAsync from '../utils/catchAsync.js'
import AppError from '../utils/appError.js '
import Email from '../utils/email.js'

// console.log('in authcontroller')

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    })
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id) // The _id property is the _id of the user document object that was created automatically by mongoose

    const cookieOptions = {
        httpOnly: true,
        expires: new Date(
            //timestamp of now + 90days in ms
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
    }

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true
    res.cookie('jwt', token, cookieOptions)

    user.password = undefined // Omit the password property from being sent to the client
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    })
}

const signUp = catchAsync(async (req, res, next) => {
    //NOTE - Creating newly signed up user in the database by using all the data from the request body is a huge security risk.
    // const newUser = await User.create(req.body)
    //NOTE - Instead, we should be very specific about what data we are storing in the database from the request body.
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
    })

    // Programmatically get the full url
    const url = `${req.protocol}://${req.get('host')}/me`
    // console.log('URL', url);
    //Send the email to the user after signing up
    await new Email(newUser, url).sendWelcome()

    //Create a token
    // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    //     expiresIn: process.env.JWT_EXPIRES_IN,
    // })

    //NOTE - Replace all these with the createAndSendToken function since we keep reusing it in multiple functions
    // const token = signToken(newUser._id) // The _id property is the _id of the newUser object that was created automatically by mongoose

    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser,
    //     },
    // })

    createAndSendToken(newUser, 201, res)
})

// const sendWelcomeEmail = async (newUser, req) => {
//     try {
//         // Send welcome email to new user
//         const url = `${req.protocol}://${req.get('host')}/me`
//         await new Email(newUser, url).sendWelcome()
//     } catch (error) {
//         console.log('Error sending welcome email:', error)
//     }
// }

const logOut = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    })
    res.status(200).json({ status: 'success' })
}

const logIn = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    //(1) Check if password and email exists was provided by the user in the request body
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400))
    }

    //(2) Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password')
    //NOTE - As explained in the the userModel, the result of the awaiting the User.findOne() is a document(object) and that object has access to the comparePassword function we defined in the userModel.
    //NOTE - It is important to note that the reason we had to create the comparePassword function and use bcrypt is because the password that is saved in the database is hashed using bcrypt and the password that is sent in the request body is not hashed. we have to use bcrypt to compare the hashed and not hashed passwords.
    // const correct = await user.comparePassword(password, user.password) //await since comparePassword is an async function

    // I added the await user.comparePassword() func in the if statement because if we save it as the correct variable like we did earlier, it would not run if the user does not exist. so hence if there is no user, the comparePassword function will not run as the (||) operator will always return the first truthy value
    if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new AppError('Invalid email or password', 401)) // It is popular practice to add a vague error message in the AppError so that an attacker won't suspect if is is email or password that is invalid
    }

    //If everything is correct, create a token and send to the client
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token,
    // })

    createAndSendToken(user, 200, res)
})

const protect = catchAsync(async (req, res, next) => {
    //(1) Check if token exists and get it from the header
    let token // Declared out since let/const is block scoped
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ') // Recall we added the jwt to the req.header object in Postman manually during development just to test
    ) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        //Recall we sent a cookie jwt data to the client when we log in and if we want to visit a protected routes, we must make every new request to the protected route with the jwt cookie data like a passport to gain access to those routes. hence, why we check if the cookie is in the incoming request to visit a protected route
        token = req.cookies.jwt
    }
    // console.log('token=>', token)
    if (!token)
        return next(
            new AppError(
                `you're not logged in! Please log in to get access.`,
                401
            )
        )

    //(2) Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log('decoded=>', decoded)

    //(3) Check if user still exists
    const confirmUserStillExists = await User.findById(decoded.id)
    if (!confirmUserStillExists) {
        return next(
            new AppError(
                'The user belonging to this token no longer exists',
                401
            )
        )
    }

    //(4) Check if user changed password after the JWT was issued
    if (confirmUserStillExists.isPasswordChanged(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! Please log in again',
                401
            )
        )
    }
    //(5) passing the confirmUserStillExists data to the next middleware since the same req object travels through the entire middleware stack
    req.user = confirmUserStillExists
    res.locals.user = confirmUserStillExists // Sending the user data to the locals object so that we can consume the data on the PUG template
    // console.log('req.user=>', req.user)
    // IF ALL OF THE ABOVE DIDN'T PRODUCE ERROR, THEN THE USER IS ALLOWED TO ACCESS THE ROUTE
    next()
})

//NOTE - Similar to the protect middleware but this has a specific job of checking if a user is logged in so that it conditionally render different things based on that state
const isLoggedIn = async (req, res, next) => {
    try {
        //(1) Check if token exists and get it from the req.cookies object
        if (req.cookies.jwt) {
            //Recall we sent a cookie jwt data to the client when we log in and if we want to visit a protected routes, we must make every new request to the protected route with the jwt cookie data like a passport to gain access to those routes. hence, why we check if the cookie is in the incoming request to visit a protected route

            //(2) Verify the cookie jwt data(token)
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            )

            //(3) Check if user still exists
            const confirmUserStillExists = await User.findById(decoded.id)
            if (!confirmUserStillExists) {
                return next()
            }

            //(4) Check if user changed password after the JWT was issued
            if (confirmUserStillExists.isPasswordChanged(decoded.iat)) {
                return next()
            }

            // console.log(confirmUserStillExists)
            // THERE IS A  LOGGED IN USER
            res.locals.user = confirmUserStillExists // The locals is like an empty object that our pug template will gain access to. hence, we can save data on it

            return next()
        }
    } catch (err) {
        return next()
    }
    next()
}

const forgotPassword = catchAsync(async (req, res, next) => {
    //(1)Get user based on posted email
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new AppError('No user found with that email', 404))
    }

    //(2) Generate random reset token
    const resetToken = user.createPasswordResetToken() // Calling the instance method barely just modified the new fields
    await user.save({ validateBeforeSave: false }) //Save passwordResetToken and passwordResetExpires that we modified in the instances method of createPasswordResetToken in the userModel to the database. the {validateBeforeSave} means that when we save the document to the DB we want to ignore all validation errors

    //(3) Send email to user with reset link
    //NOTE - We are using the nodemailer module to send emails.
    const resetUrl = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`

    // const message = `Forgot your password? submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`

    try {
        //NOTE - Simply sending the error to the Global error middleware doesn't make much sense in this scenario, so if there is an error, we just want to reset the passwordResetToken and passwordResetExpires field in the DB. This is why we used the try/catch block here
        // await sendEmail({
        //     email: user.email,
        //     subject: `Your password reset token (valid for 10 mins)`,
        //     message,
        // })

        await new Email(user, resetUrl).sendPasswordReset()

        res.status(200).json({
            status: 'success',
            message:
                'An email has been sent to you with a link to reset your password',
        })
    } catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })

        return next(
            new AppError('Email could not be sent. Try again later', 500)
        )
    }
})

const resetPassword = catchAsync(async (req, res, next) => {
    //(1) Get user based on the passwordResetToken added to the DB from the forgotPassword controller we implemented earlier and also the passwordResetExpires timestamp. Surely, the passwordResetExpires timestamp must be greater than the present occurring timestamp to indicate it has not expired, otherwise it has expired.

    // Before getting the user based on the encrypted passwordResetToken in the DB, we need to extract the unencrypted token that we sent to the email as a link and we do that by using the req.params object from the link and then hash it with the same crypto algorithm to get the user because encrypting the extracted token with the same algorithm will give us the same hash as the one we used to encrypt the token saved to the DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    })

    //(2) If the resetTokenExpired timestamp we also added in the forgotPassword controller has not expired and the user still has passwordResetToken and resetTokenExpired field added to their DB from the last forgotPassword controller then we can reset the password to a new one.
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save() //we need validation this time since we are updating the password NB;- only the save() executes validation in our DB .update() and others don't
    //(3) Update changedPasswordAt field in the user DB
    //This process is done using the document middleware in the userModel file.

    //(4) Log the user in i.e send JWT to the client
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token,
    // })

    createAndSendToken(user, 200, res)
})

const updatePassword = catchAsync(async (req, res, next) => {
    //This controller function is for allowing an already logged in user to update their password but as a security measure, we have to ask the user to input their current password before they allowed to update their password to a new one

    //(1) Get user from collection
    //On the updatePassword route,we would execute the protect controller function before this updatePassword controller and from the protect function we passed the user document object to req.user. So we can access it here and use to query the collection of users in the DB and we also used the select method to query for password alongside the user id
    const user = await User.findById(req.user.id).select('+password')
    //(2) Check if Posted current password is correct
    //Using the same instance method, we can check if the current password is the same as that of the encrypted password in the DB. If not, we will return an error message and the user will not be allowed to update their password. This is a security feature to prevent just anyone from updating a user's password even after the user is logged in.
    if (
        !(await user.comparePassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Current password is incorrect', 401))
    }

    //(3) If so, update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    //NB;- The Reasons we did not use User.findByIdAndUpdate() are: (1) The validators in the userSchema don't work when we use other methods that are not save() and create() , (2) The document middleware that we used earlier in the userModel to perform some actions before a document is saved won't work with findByIdAndUpdate()

    //(4) Log user in, send JWT
    createAndSendToken(user, 200, res)
})

const restrictTo = (...roles) => {
    // we had to create this wrapper function because we want to pass in parameters to restrict users that can perform certain actions since the middleware doesn't accept any parameter other than req, res, next. the (...roles) parameter is a rest parameter and it is a special syntax in javascript that allows us to pass in multiple parameters to a function. the parameter is an array of strings e.g ('admin','user') because ['admin','user'] in the function
    return (req, res, next) => {
        //If role is not in the array of roles, then it will throw an error. NB- we are able to gain access to the req.user because the protect middleware is executed before this restrictTo middleware and we set the req.user to the user passed the protect authentication middleware before it gets to this middleware
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You are not authorized to perform this action',
                    403
                )
            )
        }
        next()
    }
}

export {
    signUp,
    logIn,
    logOut,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect,
    isLoggedIn,
    restrictTo,
}
