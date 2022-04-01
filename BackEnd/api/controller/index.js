// require the uuid module
const { throws } = require('assert');
const { Error } = require('mongoose');

const responseHandler = require('../utils/responseHandler');
const optionalFunction = require('../utils/optionalFunction');



module.exports = new (class controller {

    // control files, folder, user
    constructor() {


        this.send = this.send.bind(this)

        this.create = this.create.bind(this)
        this.upload = this.upload.bind(this)
        this.get = this.get.bind(this)
        this.delete = this.delete.bind(this)
        this.download = this.download.bind(this)
        this.addCollaborator = this.addCollaborator.bind(this)
        this.getUserProperties = this.getUserProperties.bind(this)
        this.removeCollaborator = this.removeCollaborator.bind(this)

        this.fileController = require('./files.controller');
        this.folderController = require('./folders.controller');
        this.optionalFunction = optionalFunction;

        this.db = require('../models');
        this.folderModel = this.db.folders;
        this.fileModel = this.db.files
        this.users = this.db.users


    }




    // check n send respone to client
    send(req, res, result) {
        if (result.success === false) {
            responseHandler.sendFailure(req, res, result.code, result.message)
        } else {
            responseHandler.sendSuccess(req, res, 200, result.message)
        }
    }


    async upload(req, res) {

        try {


            let idInfo = this.optionalFunction.IdChecker(req.params.id);
            let result = null

            // check id of the folder
            if (idInfo.isPrivate === true && await this.optionalFunction.isOwner(req.params.id, idInfo, req.user.id) === false) {
                return this.send(req, res, this.optionalFunction.messageObject(
                    401,
                    false,
                    "you are not the owner"
                ));
            }

            // if text|file => create file using file model
            if (idInfo.type === 'file') {
                result = await this.fileController.writeFile(req.params.id, req.body)
            } else {
                console.log(idInfo)
                result = await this.folderController.uploadFileToFolder(req.params.id, req.files.files, idInfo)
            }

            this.send(req, res, result)

        } catch (error) {

            this.send(req, res, {
                success: false,
                message: error.message,
                code: 500
            })

        }
    }



    // add collaborator
    async addCollaborator(req, res) {
        try {
            let idInfo = this.optionalFunction.IdChecker(req.params.id);
            let result = null

            // incase the file is private but the user is not the owner
            if (idInfo.isPrivate === true && await this.optionalFunction.isOwner(req.params.id, idInfo, req.user.id) === false) {
                result = this.optionalFunction.messageObject(
                    401,
                    false,
                    "you are not the owner"

                );
            } else {
                if (idInfo.isPrivate !== true) {
                    result = this.optionalFunction.messageObject(
                        401,
                        false,
                        "you can't add collaborator to a public file"
                    );
                } else {
                    // get user by id
                    let user = await this.users.findOne({ username: req.body.username });

                    // if user not exist
                    if (user === null || user === undefined) {
                        result = this.optionalFunction.messageObject(404, false, "user not found");
                    } else if (user._id.toString() === req.user.id) {
                        result = this.optionalFunction.messageObject(401, false, "you can't add yourself, you already are the owner");

                    } else {
                        if (idInfo.type === 'file') {
                            await this.fileModel.updateOne(
                                { _id: req.params.id },
                                {
                                    $push: {
                                        owner: user._id.toString()
                                    }
                                });
                        } else {
                            await this.folderModel.updateOne(
                                { _id: req.params.id },
                                {
                                    $push: {
                                        owner: user._id.toString()
                                    }
                                });
                        }
                        result = this.optionalFunction.messageObject(200, true, "success!");
                    }

                }

            }
            this.send(req, res, result)

        } catch (error) {

            this.send(req, res, {
                success: false,
                message: error.message,
                code: 500
            })
        }
    }


    async removeCollaborator(req, res) {
        try {
            let idInfo = this.optionalFunction.IdChecker(req.params.id);
            let result = null

            // incase the file is private but the user is not the owner
            if (idInfo.isPrivate === true && await this.optionalFunction.isOwner(req.params.id, idInfo, req.user.id) === false) {
                result = this.optionalFunction.messageObject(
                    401,
                    false,
                    "you are not the owner"

                );
            } else {
                if (idInfo.isPrivate !== true) {
                    result = this.optionalFunction.messageObject(
                        401,
                        false,
                        "you can't add collaborator to a public file"
                    );
                } else {
                    // get user by id
                    let user = await this.users.findOne({ username: req.body.username });

                    // if user not exist
                    if (user === null || user === undefined) {
                        result = this.optionalFunction.messageObject(404, false, "user not found");
                    } else if (user._id.toString() === req.user.id) {
                        result = this.optionalFunction.messageObject(401, false, `you can't remove yourself, try remove this ${idInfo.type} instead`);

                    } else {
                        if (idInfo.type === 'file') {
                            await this.fileModel.updateOne(
                                { _id: req.params.id },
                                {
                                    $pull: {
                                        owner: user._id.toString()
                                    }
                                });
                        } else {
                            await this.folderModel.updateOne(
                                { _id: req.params.id },
                                {
                                    $pull: {
                                        owner: user._id.toString()
                                    }
                                });
                        }
                        result = this.optionalFunction.messageObject(200, true, "success!");
                    }
                }
            }
            this.send(req, res, result)
        } catch (error) {
            this.send(req, res, {
                success: false,
                message: error.message,
                code: 500
            })
        }
    }



    async create(req, res) {
        try {

            let result = null

            // generate id 


            const generatedID = this.optionalFunction.IdGenerator(req.body)

            // private or public
            let userId = null;
            if (req.body.isPrivate === true) {
                // get user by id
                if ((req.user === null || req.user === undefined) || (req.user.id === null || req.user.id === undefined)) {
                    return this.send(this.optionalFunction.messageObject(401, false, "you are not login"));
                } else {
                    userId = req.user.id;
                }
            }

            // if text|file => create file using file model
            if (req.body.type === 'text' || req.body.type === 'file') {

                result = await this.fileController.createFile(generatedID, req.body.name, userId)

            } else {
                result = await this.folderController.createFolder(generatedID, req.body.name, userId)
            }

            this.send(req, res, result)




        } catch (error) {
            this.send(req, res, {
                success: false,
                message: error.message,
                code: 500
            })
        }
    }





    async get(req, res) {

        try {

            let timeInterval = this.getTimeInterval(req)
            if (timeInterval[0] === false) {
                return this.send(req, res, {
                    success: false,
                    message: "invalid time interval",
                    code: 400
                })
            }
            let timeFrom = timeInterval[1], timeTo = timeInterval[2]


            // generate id.
            let idInfo = this.optionalFunction.IdChecker(req.params.id);

            // check id of the folder
            if (idInfo.isPrivate === true && await this.optionalFunction.isOwner(req.params.id, idInfo, req.user.id) === false) {
                return this.send(req, res, this.optionalFunction.messageObject(
                    401,
                    false,
                    "you are not the owner"
                ));
            }


            let result = null
            // if text|file => create file using file model
            if (idInfo.type === 'file') {
                result = await this.fileController.getFileContent(req.params.id, timeFrom, timeTo)
            } else {
                result = await this.folderController.getFolderInformation(req.params.id, timeFrom, timeTo)
            }

            this.send(req, res, result)
        } catch (error) {
            this.send(req, res, {
                success: false,
                message: error.message,
                code: 500
            })
        }
    }



    async getUserProperties(req, res) {
        try {
            if (req.user === null || req.user === undefined) {
                return this.send(req, res, { code: 401, success: false, message: "you are not login" })
            }
            // get files
            // get user files
            let files = await this.fileModel.find({ owner: req.user.id }, { name: 1, _id: 1, size: 1, createdAt: 1 });
            files = files.map(file => {
                return {
                    name: file.name,
                    id: file._id,
                    size: file.size,
                    createdAt: this.optionalFunction.timeFormatter(file.createdAt)
                };
            });

            // console.log(files)

            // get folders
            let folders = await this.folderModel.find({ owner: { $in: [req.user.id] } }).populate('files');
            folders = folders.map(folder => {
                return {
                    _id: folder._id,
                    name: folder.name,
                    quantity: folder.quantity,
                    files: folder.files.length > 0 ? folder.files.map(
                        file => file._id) : undefined,
                    size: this.optionalFunction.sizeFormatter(folder.totalSize),
                    createdAt: this.optionalFunction.timeFormatter(folder.createdAt)
                }
            })
            // console.log(folders)

            files = files.filter(file => !folders.some(folder => folder.files === undefined ? false : folder.files.includes(file.id)))
            console.log(files)





            let finalResult = { files: files, folders: folders }

            this.send(req, res, { message: finalResult })

        } catch (error) {
            this.send(req, res, {

                success: false,
                message: error.message,
                code: 500
            })
        }
    }



    async download(req, res) {
        try {

            let timeInterval = this.getTimeInterval(req)
            if (timeInterval[0] === false) {
                return this.send(req, res, {
                    success: false,
                    message: "invalid time interval",
                    code: 400
                })
            }
            let timeFrom = timeInterval[1], timeTo = timeInterval[2]

            // generate id.
            let idInfo = this.optionalFunction.IdChecker(req.params.id);

            let result = null

            // check id of the folder
            if (idInfo.isPrivate === true && await this.optionalFunction.isOwner(req.params.id, idInfo, req.user.id) === false) {
                return this.send(req, res, this.optionalFunction.messageObject(
                    401,
                    false,
                    "you are not the owner"
                ));
            }
            // if text|file => create file using file model
            if (idInfo.type === 'file') {
                result = await this.fileController.download(req.params.id, timeFrom, timeTo)
                console.log(result)
                res.attachment(result.message.name)
                res.type("txt")
                res.send(result.message.contents)
            } else {
                result = await this.folderController.download(req.params.id, timeFrom, timeTo)
                console.log(result)
                console.log(result)
                // send zip file to client
                res.attachment(result.message.name)
                res.type("zip")
                res.send(result.message.data)


            }

        } catch (error) {
            this.send(req, res, {
                success: false,
                message: error.message,
                code: 500
            })
        }
    }



    getTimeInterval(req) {
        // get time interval
        const timeFrom = req.query.from !== undefined
            ? new Date(req.query.from).getTime()
            : undefined;

        const timeTo = req.query.to !== undefined
            ? new Date(req.query.to).getTime()
            : undefined;

        if ((timeFrom !== undefined && timeTo === undefined) || (timeTo === undefined && timeTo !== undefined) || timeFrom > timeTo) {
            return [false]
        } if (timeFrom === undefined && timeTo === undefined) {
            return [true, new Date(0), new Date(Date.now())]
        }

        return [true, timeFrom, timeTo]
    }



    async delete(req, res) {

        try {

            let timeInterval = this.getTimeInterval(req)
            if (timeInterval[0] === false) {
                return this.send(req, res, {
                    success: false,
                    message: "invalid time interval",
                    code: 400
                })
            }
            let timeFrom = timeInterval[1], timeTo = timeInterval[2]

            // generate id.
            let idInfo = this.optionalFunction.IdChecker(req.params.id);


            let result = null

            // check id of the folder
            if (idInfo.isPrivate === true && await this.optionalFunction.isOwner(req.params.id, idInfo, req.user.id) === false) {
                return this.send(req, res, this.optionalFunction.messageObject(
                    401,
                    false,
                    "you are not the owner"
                ));
            }

            if (idInfo.type === 'file') {
                result = await this.fileController.delete(req.params.id, timeFrom, timeTo)
            } else {
                result = await this.folderController.delete(req.params.id, timeFrom, timeTo)
            }
            this.send(req, res, result)


        } catch (error) {
            this.send(req, res, {
                success: false,
                message: error.message,
                code: 500
            })
        }


    }


})()

