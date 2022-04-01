const router = require('express').Router();
const Controller = require('../controller');
const auth  = require('../middleWares/auth');





/*
    - if the file is private the user must be the owner of the file 
        and the accessToken must be valid and send along in to the header of the request which is in the form of:
        authorization: "token: xxxxx"
*/


// get file information by id and date
// the request body must containt 2 keys:
// - { startDate: '', endDate: '' }
router.get('/:id', auth.AuthenticateToken, Controller.get)



router.get("/api/download/:id", auth.AuthenticateToken, Controller.download)


router.get("/api/all/", auth.AuthenticateToken, Controller.getUserProperties)



/*
    - create or upload an existing file
    - the body must be an object that contains keys:
        body: {     
            type: ...
            isPrivate: ....
            filename: ...
            content: ....
        }
        => this structure is used when the user send a text

        or

        => this structure is used when the user send a file
        
        body:{
                type: ...
                isPrivate: ....
            }
        files: {
            file: {
                size : ...
                filename : ....
                data: ...
            }
        }
*/ 
// then this api will send the id of the file to the client
router.post('/api/create', auth.AuthenticateToken, Controller.create)

// append content to an existing file
// the request body must contains the new content 
// body : {content: 'new content'}
router.put('/:id', auth.AuthenticateToken,  Controller.upload)

// append the user to be a collaborator to an existing file
// the request body must contains the user id
// only private file can be collaborated
router.put('/api/addColaborator/:id', auth.AuthenticateToken, Controller.addCollaborator)
router.put('/api/removeColaborator/:id', auth.AuthenticateToken, Controller.removeCollaborator)
// delete a file by id
router.delete('/api/delete/:id', auth.AuthenticateToken, Controller.delete)




module.exports = router;