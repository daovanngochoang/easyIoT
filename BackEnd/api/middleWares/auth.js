'use strict';


const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../models');
const responseHandler = require('../utils/responseHandler');
require('dotenv').config()



const Users = db.users;



const auth = {};



/*----------------------------------REGISTRATION---------------------------------------------*/


auth.registerUser = async (req, res) => {
    
    try {
       

        // encrypt password
        const salt =  await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        let isExist = await Users.exists({username: req.body.username});

        // if user is not exist 
        if (!isExist) {

            // add user to database
            await Users.create({
                username: req.body.username,
                password: hashedPassword
            });

            // send success message
            responseHandler.sendSuccess(req, res, 200,'user has been created');
        }else{
            // send error message
            responseHandler.sendFailure(req, res, 400, 'user is already exist');
        }
        
    }catch(e){
        // send error message
        responseHandler.sendFailure(req, res, 500, e.message);
    }

};





/*-------------------------------LOGIN------------------------------------------------*/

auth.Login = async function(req, res, next) {

    try {

        // get user by the user_name 
        const user = await Users.findOne({username: req.body.username});

        
        if (user === null) { // send error if user is not a valid/ exists
            responseHandler.sendFailure(req, res, 400, 'user is not exist');
        }else {

            const now = new Date().getTime()


            // get id and username to create tokens
            const UserInfo = {id: user._id, last_time : now}

            // compare the authentication token
            const isAuth = await bcrypt.compare( req.body.password, user.password)

            // if auth
            if (isAuth) {


                // combine user info in the token and send to user
                const token = jwt.sign(UserInfo, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'});

                res.status(200).send({
                    success: true,
                    accessToken : token
                });

            }else {

                // not auth => send error
                res.status(403).send({
                    success:false ,
                    message:"invalid password"
                })
            }
        }
        next();
    }catch(e){
        res.status(500).send({
            success:false ,
            message: e.message
        })
    }
};




/*------------------------------------AUTHENTICATION TOKEN-------------------------------------------*/

auth.AuthenticateToken = async function(req, res, next) {

    
    // get token from request header
    const authHeader = req.headers.authorization;
    const isAuthHeaderNull = (authHeader === null || authHeader === undefined)
    const isPrivate  = (req.body.isPrivate === true ||((req.params.id !== undefined && req.params.id.substr(3, 3)) === process.env.PRIVATE_SIGN))


    // check if there is a header with authorization token
    if ((isPrivate && !isAuthHeaderNull) || (req.params.id === undefined  && !isAuthHeaderNull)) {

        // get the token from the splitting token from (token: uaieo0q9840....)
        const token = await authHeader.split(' ')[1]; // get the second part which is the token

        // if token part is empty then send status error
        if (token === (null || undefined)) {

            return res.status(403).send({
                status : false,
                message: 'authentication failed, no token provided. Please login again'
            })
        }

        // verify token 
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, info) => {

            // if any thing wrong then raise error and asking for credentials again.
            if (err) {
                return res.status(403).send({
                    status : false,
                    message: 'invalid token, authentication failed'
                });
            };

            const last_time = info.last_time;
            const now = new Date().getTime()   
            const now_last_request = (now-last_time)/1000

            // if that user is using the token and that token will be expired then we refresh it for that use else
            // if that user not use that token in 5 min  before it expired then it will not be refresh
            if ((now_last_request < 300 && (info.exp * 1000 - now)/1000 < 300)){
                
                // get only the user info to create new token
                const user = {
                    id : info.id
                };

                // 
                const newToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'});
                req.newAuthorization = newToken;

                info = jwt.verify(newToken, process.env.ACCESS_TOKEN_SECRET)

            }
            
            // add time to info
            info.last_time = now;
            // put the user information to the request
            req.user = info;
            console.log(req.user)
            // 
            next();
        })


    }else if (isPrivate && isAuthHeaderNull) {

        

        // if there is no token then send error
        return res.status(403).send({
            status : false,
            message: 'authentication failed, no token provided. please login again'
        })

    }else{
        next();
    }
    



};
    












module.exports = auth