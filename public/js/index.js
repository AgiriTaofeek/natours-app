/*eslint-disable */
//NOTE - The core-js and regenerator-runtime/runtime packages are basically code that we need to be add to the final bundled js file to help polyfill the new JS features so that they would also work for older browsers
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { login, logout, signup } from './login'
import { updateSettings } from './updateSettings'
import { displayMap } from './mapBox'
import { bookTour } from './stripe'
import { showAlert } from './alerts'
// console.log('Hello from parceljs')

//NOTE - Select DOM elements
const mapBox = document.querySelector('#map')
const loginForm = document.querySelector('.form--login')
const signupForm = document.querySelector('.form--signup')
const logOutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const bookBtn = document.getElementById('book-tour')

//NOTE - If the mapBox has been rendered on the DOM, Display the map
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations)
    displayMap(locations)
}

//NOTE - Handle the Login functionality
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login(email, password)
    })
}

//NOTE - Handle signup functionality
if (signupForm) {
    // Getting name, email and password from "/signup" form
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault()

        const name = document.getElementById('name').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const passwordConfirm =
            document.getElementById('password-confirm').value

        signup(name, email, password, passwordConfirm)
    })
}
//NOTE - Handle logout functionality
if (logOutBtn) logOutBtn.addEventListener('click', logout)

//NOTE - Handle form data update
if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const form = new FormData() //The FormData object is used to construct a set of key/value pairs representing form fields and their values, which can then be easily sent using the XMLHttpRequest or fetch API. It uses the same format a form element would use if the encoding type were set to "multipart/form-data" but it does it programmatically.Note- The form is going to be an array of arrays.The arrays inside the parent array will consist of the name and value pair of each input field.

        //A new FormData object is being created and assigned to the variable form. This object can be used to append key/value pairs using the append method.  Here, the 'name' and 'email' keys are being associated with the values of the respective form fields. This FormData object can then be sent to a server using an HTTP request.
        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0]) //This is the main reason we have use the formData() because we want the enctype to be set programmatically to multipart/form-data
        // console.log([...form.entries()]) //We have to it this way to see the arrays of array
        updateSettings(form, 'data')
    })
}

//NOTE - Handle password data update
if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        document.querySelector('.btn--save-password').textContent =
            'Updating...'

        const passwordCurrent =
            document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm =
            document.getElementById('password-confirm').value
        await updateSettings(
            { passwordCurrent, password, passwordConfirm }, //variable names we used must match the name of the properties in the DB i.e passwordCurrent, password and passwordConfirm because we are passing them directly as object
            'password'
        )
        document.querySelector('.btn--save-password').textContent =
            'save password'
        document.getElementById('password-current').value = ''
        document.getElementById('password').value = ''
        document.getElementById('password-confirm').value = ''
    })
}

//NOTE - Handle booking with stripe
if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
        e.target.textContent = 'Processing ...'
        //Retrieve data from bookBtn HTML element
        const { tourId } = e.target.dataset
        bookTour(tourId)
    })
}

//NOTE - Alert message display on the body element
const alertMessage = document.querySelector('body').dataset.alert
if (alertMessage) showAlert('success', alertMessage, 20)
