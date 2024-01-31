import axios from 'axios'
import { showAlert } from './alerts'

// TO reuse this function for also updating the password let's make it receive two parameters i.e data and type. the type can be 'data' and 'password'
const updateSettings = async (data, type) => {
    try {
        const url =
            type === 'password'
                ? 'http://localhost:3000/api/v1/users/updateMyPassword'
                : 'http://localhost:3000/api/v1/users/updateMe'
        const res = await axios({
            method: 'PATCH',
            url,
            data,
        })

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

export { updateSettings }
