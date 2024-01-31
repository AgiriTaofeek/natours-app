/* eslint-disable */
import axios from 'axios'
import { showAlert } from './alerts'

// Stripe() function is exposed by the script tag
const stripe = Stripe(
    'pk_test_51LsRpBJddqQBmSsEy6d7Xnx2x96O79KQf5BA7agqOfoVZY0ReCpqkTLuof8WSQGo7WHw73BEKNlZFsxPf1LGBIXc00RNouRXCe'
)

export const bookTour = async (tourId) => {
    try {
        //(1) Get checkout session  from API
        const session = await axios(
            // `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
            `/api/v1/bookings/checkout-session/${tourId}` //Production
        )

        // console.log(session);
        //   console.log('stripe object',stripe);

        //(2)  Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        })
    } catch (err) {
        console.log(err)
        showAlert('error', err)
    }
}
