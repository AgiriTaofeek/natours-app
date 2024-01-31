import Stripe from 'stripe'
import Tour from '../models/tourModel.js'
import User from '../models/userModel.js'
import Booking from '../models/bookingModel.js'
import catchAsync from '../utils/catchAsync.js'
import {
    createOne,
    getOne,
    getAll,
    updateOne,
    deleteOne,
} from '../controllers/handlerFactory.js'
import dotenv from 'dotenv'
dotenv.config({ path: './config.env' })
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

const getCheckoutSession = catchAsync(async (req, res, next) => {
    //(1)Get the currently booked tour
    const tour = await Tour.findById(req.params.tourID)
    //(2)Create the checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        /* 
        Immediately after the checkout is successful we want to create a new booking that will be persisted in our database since the success_url is that url our request will be redirected to after a successful checkout session.To create the booking, we have to create a new route but then we would have to create a whole new web page which is not really worth it in this case. Hence, we are going to use a temporary and insecure solution as the best solution is the use of stripe webhooks. so whenever we have deployed our server we will get access to the session object once the purchase is completed using stripe webhooks and this webhooks are going to be perfect for us to create a new booking. The temporary workaround is below. which is simply to put the data that we need to create a new booking right into this url as a querystring. we need to create a querystring because stripe will just make a get request to this 'host' as specified below. so we can't really send a body or any data with it except for the querystring. we will query for the tour,user and price */
        // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
        //     req.params.tourID
        // }&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get(
            'host'
        )}/my-tours?alert=booking`,
        // success_url: `${req.protocol}://${req.get('host')}/`, //For test
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tour.name} Tour`,
                        images: [
                            // `https://www.natours.dev/img/tours/${tour.imageCover}`,
                            `${req.protocol}://${req.get('host')}/img/tours/${
                                tour.imageCover
                            }`,
                        ],
                        description: tour.summary,
                    },
                    unit_amount: tour.price * 100, //This was done to get cents from 'usd' we specified as currency
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
    })

    //(3)Send the session to the client
    res.status(200).json({
        status: 'success',
        session,
    })
})

//NOTE - webhook controller function for stripe. Executed after a successful payment

//The secure approach to createBookingCheckout
const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id
    const user = (await User.findOne({ email: session.customer_email })).id
    const price = session.amount_total / 100 //We divided by 100 for 'usd' to be purely in dollars

    await Booking.create({ tour, user, price })
}
const webhookCheckout = (req, res, next) => {
    //(1)Read stripe signature from req.headers
    const signature = req.headers['stripe-signature']

    //(2)Construct stripe event
    let event
    try {
        event = Stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SIGNATURE
        )
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    //(3) Handle the event
    if (event.type === 'checkout.session.completed') {
        //Event we specified on stripe website
        createBookingCheckout(event.data.object)
    }

    //(4) Send response to stripe
    res.status(200).json({ received: true })
}

// const createBookingCheckout = catchAsync(async (req, res, next) => {
//     //NOTE - This is only temporary because it's insecure as everyone can make bookings without paying by just adding querystring to /my-tours route
//     const { user, tour, price } = req.query
//     if (!user && !tour && !price) return next()

//     await Booking.create({ tour, user, price })

//     //* For a little more security from the data we leaked to the querystring as our success_url from the controller above,  we want to redirect the url so that the data leaked in the query string will be a little pending the time we use the better solution of stripe webhooks. Also note that redirecting and removing the querystring is the really important because in our middleware stack to the '/my-tours' route we still need to load the overview web page which wouldn't make sense. after the redirect without the querystring, the if(!user && !tour && !price) will now call the getOverview controller without causing any issues
//     res.redirect(req.originalUrl.split('?')[0])
// })

const createBooking = createOne(Booking)
const getBooking = getOne(Booking)
const getAllBooking = getAll(Booking)
const updateBooking = updateOne(Booking)
const deleteBooking = deleteOne(Booking)

export {
    getCheckoutSession,
    // createBookingCheckout,
    createBooking,
    getBooking,
    getAllBooking,
    updateBooking,
    deleteBooking,
    webhookCheckout,
}
