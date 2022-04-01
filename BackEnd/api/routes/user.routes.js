

const router = require('express').Router();
const auth = require('../middleWares/auth');


router.post('/authendication/login', auth.Login);


router.post('/authendication/register', auth.registerUser);


module.exports = router;

