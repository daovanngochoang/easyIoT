const mongoose = require('mongoose');


// const URI = `mongodb://${process.env.USERNAME}:${process.env.PASSWORD}@localhost:27017/ProjectDB?`;
// const URL = `mongodb://${process.env.dbDocker}:27017/ProjectDB?`;
const URL = `mongodb://localhost:27017/ProjectDB?`;



console.log("URL", URL)

const options = {
    autoIndex: false, // Don't build indexes
    connectTimeoutMS: 1000,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 5000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  };

// connect to mongodb and set connection timeout to 5 seconds
mongoose.connect(URL, options, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('connected to mongodb');
        // console.log(mongoose);

    }
});




const files = require('./file.model')(mongoose);
const folders = require('./folder.model')(mongoose);
const users = require('./user.model')(mongoose);
const contents = require('./content.model')(mongoose);


// console.log(mongoose.models)

// const schemas = [];
// mongoose.modelNames().forEach(function(modelName){
//     schemas.push(mongoose.model(modelName).schema);
// })

// console.log(schemas);




module.exports = {
    files,
    folders,
    users,
    contents
};



