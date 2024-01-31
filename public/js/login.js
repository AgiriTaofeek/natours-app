/* eslint-disable */
//NOTE - We had to install axios in the way we did below because on the client-side js, we can't use the typical import from node_modules folder and we also had to specify type='module to the script tag of this file in the HTML
// import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.5/+esm'
//NOTE - With the help of parcel, we can hence, use the import from node_modules folder as below
import axios from 'axios'
import { showAlert } from './alerts'
console.log('login js')

//NOTE -  we are able to use these login.js file as a module because of bundling with Parcel.js
export const login = async (email, password) => {
    console.log(email, password)
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/login', // For development
            data: {
                email,
                password,
            },
        })

        console.log(res)
        if (res.data.status === 'success') {
            showAlert('success', 'logged in successfully')
            setTimeout(() => {
                location.assign('/') //This reloads the webpage to the '/' path after 1.5s automatically
            }, 1500)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm,
            },
        })

        if (response.data.status === 'success') {
            showAlert('success', 'Account created successfully!')
            window.setTimeout(() => {
                location.assign('/')
            }, 1500)
        }
    } catch (error) {
        showAlert('error', error.response.data.message)
    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:3000/api/v1/users/logout', // For development
        })

        // if (res.data.status === 'success') location.reload(true) // This would force a reload from the server not from the browser cache which might not be ideal but it's best to assign the route back to the /login route
        if (res.data.status === 'success') location.assign('/login')
    } catch (err) {
        showAlert('error', 'Error logging out! try again')
    }
}
