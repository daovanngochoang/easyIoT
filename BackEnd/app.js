const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()



const router = require('./api/routes')
const bodyParser = require('body-parser');


// use cors to allow cross origin resource sharing
app.use(cors({ origin: '*' }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())

//use file upload
const fileUpload = require('express-fileupload');
app.use(fileUpload());



app.use(router)



port = 5000;

app.listen(port, ()=>{console.log(`the server is listening on port ${port}`);});





