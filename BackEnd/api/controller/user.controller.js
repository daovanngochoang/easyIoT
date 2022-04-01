
const nodemailer = require('nodemailer');

module.exports = new class userController {

    constructor (){
        this.userModel = require('../models');

    }

    // Forget password 
    async recreatePassword (req, res){

        try{
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
                }
            });

            let token = jwt.sign({ username: req.body.email }, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'RS256'});

            let recreatePasswordLink = `https://${process.env.DOMAIN_NAME}/user/recoverPassword/`+token

            const mailOptions = {
                from: process.env.EMAIL,
                to: req.body.email,
                subject: 'forget password',
                text: recreatePasswordLink
            };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                console.log(error);
                } else {
                console.log('Email sent: ' + info.response);
                }
            });

            res.status(200).send(
                {
                    success: true,
                    message: 'check you email, please!'
                }
            )
        }catch(err){
            res.status(500).send(
                {
                    success : false,
                    message: "EROR, please try again"
                }
            )
        }

    }
    // Delete user

    

    // Update user's password
}