
const fs = require('fs');
const { v4: uuidv4 } = require('uuid')
const AdmZip = require("adm-zip");
const { default: mongoose } = require('mongoose');

module.exports = new class folderController {

    constructor() {
        this.db = require("../models")
        this.folderModel = this.db.folders;
        this.fileModel = this.db.files;
        this.contentModel = this.db.contents
        this.optionalFunction = require('../utils/optionalFunction');
        this.getAllFileInFolderByDate = this.getAllFileInFolderByDate.bind(this);
        this.fileController = require('./files.controller');
    }



    // Create folder
    async createFolder(generatedID, folderName, userId) {



        let dateTime = new Date();

        let folder = new this.folderModel({
            _id: generatedID,
            name: folderName,
            owner: userId === null ? [] : [userId],
            createdAt: dateTime
        });

        folder.save()
        return this.optionalFunction.messageObject(200, true, { ID: generatedID });



    }




    // append file to folder
    async uploadFileToFolder(id, Files, idInfo) {


        if (!Array.isArray(Files)) {
            Files = [Files]
        }
        // check type of the files, alow only json and txt
        for (let file of Files) {

            if (file.mimetype !== "text/plain" && file.mimetype !== "application/json") {
                return this.optionalFunction.messageObject(
                    400,
                    false,
                    `file type ${file.mimetype} is not supported, text and json only, please try again`
                );
            }
        }

        //  get the exist folder and allfiles in it
        let existFolder = await this.folderModel.findOne({ _id: id }).populate('files');

        // if the folder is not exist then return error not found
        if (existFolder === null || existFolder === undefined) {
            return this.optionalFunction.messageObject(
                404,
                false,
                "folder not found"
            );
        }



        let existFiles = Files.filter(file => {
            //  filter out item that is already exist in the folder
            return existFolder.files.some(existingFile => {
                return existingFile.name === file.name
            })
        })


        // send back to cli the files that already exist in the folder
        if (existFiles.length > 0) {
            return this.optionalFunction.messageObject(
                400,
                false,
                `file ${existFiles.map(file => file.name)} already exist in this folder`
            );
        }

        let newFiles = []
        let newSize = 0

        
        for (let file of Files) {
            let id = this.optionalFunction.IdGenerator({
                type: "file",
                isPrivate: idInfo.isPrivate,

            })

            //  create new file object 
            let newFile = new this.fileModel({
                _id: id,
                name: file.name,
                size: file.size,
                owner: existFolder.owner,
                contents: [
                    await new this.contentModel({ // create new content object and save it
                        _id: new mongoose.Types.ObjectId(),
                        date: new Date(Date.now()).getTime(),
                        body: file.data,
                        type: (file.mimetype === "text/plain" ? "text" : "json"),
                    }).save()],
                createdAt: new Date(Date.now()).getTime(),

            })
            newSize += file.size // get the new of the new files
            await newFile.save() // save the new file
            newFiles.push(newFile) // get the list of new files object to update to the folder 
        }

        newSize += existFolder.size // update the new size of the folder by adding to the new files size

        if (newFiles.length !== 0) {
            // add file information to database
            await this.folderModel.updateOne({ _id: id },
                {
                    $inc: {
                        quantity: newFiles.length
                    },
                    $set: {
                        size: newSize
                    }
                    ,
                    $push: {
                        files: {
                            $each: newFiles
                        }
                    }

                });

        }

        return this.optionalFunction.messageObject(200, true, "success !");
    }





    // get all file in folder
    async getAllFileInFolderByDate(id, from, to) {
        // check id of the folder
        // check id of the folder



        let folder = await this.folderModel.findOne(
            {
                _id: id,
            }
        ).populate('files')


        let filesFiltered = [], remainFiles = []

        for (let file of folder.files) {
            let createdAt = new Date(file.createdAt).getTime()
            if (this.optionalFunction.isBetween(createdAt, from, to)) {
                filesFiltered.push(await file.populate('contents'))
            }else{
                remainFiles.push(await file.populate('contents'))
            }
        }
        folder.files = filesFiltered
        folder.remainFiles = remainFiles

        return folder
    }




    // get folder information by id
    async getFolderInformation(id, from, to) {

        let folderInformation = await this.getAllFileInFolderByDate(id, from, to);
        folderInformation = folderInformation.files.map(file => {
            return {
                _id: file._id,
                name: file.name,
                size: this.optionalFunction.sizeFormatter(file.size),
                createdAt: this.optionalFunction.timeFormatter(file.createdAt),
            }
        })

        if (folderInformation === null || folderInformation === undefined) {
            return this.optionalFunction.messageObject(
                404,
                false,
                "folder not found"
            );
        } else {
            return this.optionalFunction.messageObject(200, true, folderInformation);
        }


    }




    async download(id, timeFrom, timeTo) {


        let data = null


        const Folder = await this.getAllFileInFolderByDate(id, timeFrom, timeTo);
        // create a folder with the name of the folder + random uuid
        const folderName = uuidv4();
        const folderPath = "../data/" + folderName;

        // create a folder with folder path 
        fs.mkdirSync(folderPath);

        // write file to folder
        for (let file of Folder.files) {
            for (let content of file.contents) {
                fs.writeFileSync(folderPath + "/" + file.name, content.body);
            }
        }

        // zip folder
        const zipPath = "../data/" + folderName + ".zip";
        const zip = new AdmZip();
        zip.addLocalFolder(folderPath);
        zip.writeZip(zipPath);

        // remove folder
        fs.rmdirSync(folderPath, { recursive: true });
        data = {
            name: folderName + ".zip",
            size: fs.statSync(zipPath).size,
            data: fs.readFileSync(zipPath),
            type: "application/zip",
        }
        fs.unlinkSync(zipPath)


        // return zip file
        return this.optionalFunction.messageObject(200, true, data);
    }




    // delete file in folder
    async delete(id, timeFrom, timeTo) {



        if (timeFrom === undefined && timeTo === undefined) {
            // delete folder
            const folder = await this.getAllFileInFolderByDate(id);
            if (folder === null || folder === undefined) {
                return this.optionalFunction.messageObject(
                    404,
                    false,
                    "folder not found"
                );
            } else {
                // delete all files in folder
                for (let file of folder.files) {
                    await this.fileController.delete(file._id);
                }
                // remove the folder
                await folder.remove()
            }

        } else {
            // delete file in folder
            const folder = await this.getAllFileInFolderByDate(id, timeFrom, timeTo);

            let removeSize = 0
            // delete all files in folder
            for (let file of folder.files) {
                removeSize += file.size
                await this.fileController.delete(file._id);
            }

            // update size 
            let newSize = folder.size - removeSize
            folder.size = newSize > 0 ? newSize : 0

            folder.files = folder.remainFiles
            folder.remainFiles = undefined

            // save the folder after remove files
            await folder.save()

        }
        return this.optionalFunction.messageObject(200, true, "success !");

    }




}


