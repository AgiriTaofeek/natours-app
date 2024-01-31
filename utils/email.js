import nodemailer from 'nodemailer' //Nodemailer is a module for Node.js applications to allow easy email sending. The Nodemailer module can be used to send emails from a computer or a server
import pug from 'pug'
import { convert } from 'html-to-text'
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

/* The Email class in the provided JavaScript code is designed to handle the creation and sending of emails. Here's a detailed breakdown of its functionality:

- Constructor: The constructor takes two parameters: user and url. The user is expected to be an object with at least two properties: email and name. The url is a string representing a URL. The constructor initializes the Email instance with these values.

- newTransport(): This method creates a new instance of nodemailer's transport object, which is used to send emails. If the application is running in a production environment (determined by checking process.env.NODE_ENV), it simply returns a string 'In production'. Otherwise, it creates a transport using SMTP server details (host, port, and authentication details) from the environment variables.

- send(template, subject): This is an asynchronous method that sends an email. It takes two parameters: template and subject. The template is the name of a Pug template file used to generate the HTML content of the email. The subject is a string that becomes the subject line of the email. The method first renders the HTML content from the Pug template, then defines the email options (sender, recipient, subject, HTML content, and plain text content), and finally sends the email using the transport created by newTransport().

- sendWelcome(): This is an asynchronous method that sends a welcome email. It calls the send method with a predefined template ('welcome') and subject ('Welcome to the Natours family!').

In summary, this class is a utility for sending different types of emails, with the content generated from Pug templates.
*/
class Email {
    constructor(user, url) {
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = `Tolani <${process.env.EMAIL_FROM}>`
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // SENDGRID
            return nodemailer.createTransport({
                // service: 'Brevo',
                host: process.env.BREVO_HOST,
                port: process.env.BREVO_PORT,
                secure: false,
                auth: {
                    user: process.env.BREVO_USERNAME,
                    pass: process.env.BREVO_PASSWORD,
                },
            })
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        })
    }

    //Send the actual email
    async send(template, subject) {
        //(1)Render HTML based on the PUG template
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`,
            {
                //All these would be available to be used in the template
                firstName: this.firstName,
                url: this.url,
                subject,
            }
        )

        //(2)Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: convert(html, {
                wordwrap: false,
            }),
        }

        //(3)Create a transport and send Email
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours family!')
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token is valid for only 10 mins'
        )
    }
}

// const sendEmail = async (options) => {
//     //(1) Create a transporter
//     // We won't use Gmail in this project but the sample code for Gmail is below. The reasons we won't use Gmail is because there are restrictions and one of which is that we can only send 500 emails per day and also you would probably be marked as a spammer which is not cool in for an app we would run so many tests in development
//     //   const transporter = nodemailer.createTransport({
//     //     service: 'Gmail',
//     //     auth: {
//     //       user: process.env.EMAIL_USERNAME,
//     //       pass: process.env.EMAIL_PASSWORD,
//     //     },
//     // Activate in Gmail "less secure app" option
//     //   });

//     //We instead going to use a special development service which fakes to send emails to real address but in reality, these emails end up trapped in a development inbox so that we can take look at how they would look later in production. The service is called mailtrap
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD,
//         },
//     })

//     //(2) Define the email options

//     const mailOptions = {
//         from: 'Tolani <hello@tolani.io>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//         // html
//     }

//     //(3) Send the email using the transporter
//     await transporter.sendMail(mailOptions)
// }

export default Email
