/* eslint-disable */
export const showAlert = (type, msg) => {
    // type parameter is either success or error
    hideAlert() // Hide alert before showing just to be sure
    const markUp = `<div class='alert alert--${type}'>${msg}</div>`
    document.querySelector('body').insertAdjacentHTML('afterbegin', markUp) // the means that the markUp would be injected to as the 1st child element of the body element
    setTimeout(hideAlert, 5000) //Hide alert after 5 secs
}
export const hideAlert = () => {
    const el = document.querySelector('.alert')
    if (el) el.parentElement.removeChild(el) // To hide the alert we injected into the body we traverse the element parent which is the body element and remove the first child
}
