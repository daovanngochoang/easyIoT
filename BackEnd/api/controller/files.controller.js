const { default: mongoose } = require("mongoose");


module.exports = new (class fileController {
    constructor() {
        this.db = require("../models");
        this.files = this.db.files;
        this.users = this.db.users;
        this.content = this.db.contents
        this.optionalFunction = require("../utils/optionalFunction");
    }



    async writeFile(id, rawData) {


        // get the file content in the body of the request and 
        // if the file content in the body is not empty then check the file content in the request file
        let fileContent = rawData
        let contentType = typeof rawData;


        if (contentType === "object") {
            fileContent = JSON.stringify(fileContent);
        }


        if (contentType !== "string" && contentType !== "object") {
            return this.optionalFunction.messageObject(500, false, "file content must be string or json ");
        }


        if (fileContent !== undefined && fileContent !== "") {

            // get the file and calculate the new size
            let size = Buffer.byteLength(fileContent, 'utf8');
            let file = await this.files.findOne({ _id: id }, { size: 1, _id: 0 });

            if (file === null) {
                return this.optionalFunction.messageObject(
                    404,
                    false,
                    "file not found"
                );
            }

            // create new content object
            let newContent = await new this.content({
                _id: new mongoose.Types.ObjectId(),
                date: new Date(Date.now()).getTime(),
                body: fileContent,
                type: contentType === "object" ? "json" : "string"
            });

            await newContent.save();

            // update the file size, content
            await this.files.updateOne(
                { _id: id },
                {
                    $push: {
                        contents: newContent
                    },
                    size: size + file.size
                });

        }
        return this.optionalFunction.messageObject(200, true, rawData);



    }


    // create file
    async createFile(generatedID, fileName, userId) {

        // create a new file
        let newFile = new this.files({
            _id: generatedID,
            name: fileName,
            owner: userId === null ? [] : [userId],
            createdAt: new Date(Date.now()).getTime(),
        });

        // save file to database
        newFile.save();

        return this.optionalFunction.messageObject(200, true, { ID: generatedID });

    }



    // get file content by date
    async searchContent(id, timeFrom, timeTo) {


        let fileData = await this.files.findOne({ _id: id }, { content: 1, name: 1, size: 1, createdAt: 1 }).populate("contents");
        if (fileData === null) {
            return undefined;
        }

        let contentFiltered = [], remainContent = [];

        for (let content of fileData.contents) {
            if (this.optionalFunction.isBetween(content.date, timeFrom, timeTo)) {
                contentFiltered.push(content);
            } else {
                remainContent.push(content);
            }
        }

        fileData.contents = contentFiltered;
        fileData.remainContent = remainContent;

        return fileData;

    }



    async getFileContent(id, timeFrom, timeTo) {

        // get file content by date
        let fileData = await this.searchContent(id, timeFrom, timeTo);

        // if file not exist 
        if (fileData === undefined || fileData === null) {
            return this.optionalFunction.messageObject(404, false, "file not found");
        }

        // convert to the original type
        const content = []


        for (let i = 0; i < fileData.contents.length; i++) {
            content.push(this.optionalFunction.timeFormatter(fileData.contents[i].date));

            if (["object", 'json'].includes(fileData.contents[i].type)) {
                content.push(JSON.parse(fileData.contents[i].body));
            }
            else {
                content.push(fileData.contents[i].body);
            }
        }


        return this.optionalFunction.messageObject(200, true, content);


    }



    // donwload file
    async download(id, timeFrom, timeTo) {


        // get file content by date
        let fileData = await this.searchContent(id, timeFrom, timeTo);


        // if file not exist
        if (fileData === undefined || fileData === null) {
            return this.optionalFunction.messageObject(404, false, "file not found");
        }

        // get file content
        let fileContent = fileData.contents;
        let contents = "";

        for (let i = 0; i < fileContent.length; i++) {
            contents += fileContent[i].body + "\n\n";
        }

        let result = this.optionalFunction.messageObject(200, true, {
            contents: contents,
            name: fileData.name,
            size: fileData.size,
            createdAt: fileData.createdAt,
        });

        return result;

    }






    async delete(id, timeFrom, timeTo) {

        if (timeFrom === undefined && timeTo === undefined) {
            // delete file
            let file = await this.files.findOne({ _id: id }).populate("contents");
            file.contents.forEach(content => {
                content.remove();
            });

            await file.remove();

            return this.optionalFunction.messageObject(200, true, 'success!')
        } else {


            // get all content by date to calculate the size
            let fileData = await this.searchContent(id, timeFrom, timeTo, false);

            // get and remove content
            let reduceContent = "";
            for (let i = 0; i < fileData.contents.length; i++) {
                reduceContent += fileData.contents[i].body;
                await fileData.contents[i].remove();
            }

            // calculate the new size
            let newSize = fileData.size - Buffer.byteLength(reduceContent, 'utf8')
            fileData.size = newSize > 0 ? newSize : 0;
            fileData.contents = fileData.remainContent;
            fileData.remainContent = undefined

            // update the file size
            await fileData.save();

            return this.optionalFunction.messageObject(200, true, 'success!')

        }

    }





})();
