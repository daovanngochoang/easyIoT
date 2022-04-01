
const {v4 : uuidv4} = require('uuid');
module.exports = new (class controller {

    constructor() {
        this.db = require('../models');
        this.files = this.db.files
        this.folders = this.db.folders
    }
    
    messageObject(code, status, message) {
        return {
            code: code,
            success: status,
            message: message,
        };
    }

    async isOwner(id, idInfo, userId) {
        let result = []
        
        if (idInfo.type === 'file'){

            // check if the user is the owner of the file
            result = await this.files.aggregate([
                {
                    $match: {
                        _id: id,
                    },
                },
                {
                    $project: {
                        owner: 1,
                    },
                },
            ]);
        }else if(idInfo.type === 'folder'){

            // check if the user is the owner of the folder
            result = await this.folders.aggregate([
                {
                    $match: {
                        _id: id,
                    },
                },
                {
                    $project: {
                        owner: 1,
                    },
                },
            ]);
        }
        return [true, result[0].owner.includes(userId)]
    }






    IdGenerator (dataInfo){

        // get random id with uuidv4
        let random_id = uuidv4();
        random_id = random_id.slice(4, random_id.length-4)


        // create an id with 3 first chars is represented to whether the data is create is file or folder
        //  3 next chars is represented to whether the data is private or public
        let header = ''

        if ((dataInfo.type && dataInfo.isPrivate) !== null || (dataInfo.type && dataInfo.isPrivate) !== undefined){

            // add the header for file or folder
            if (dataInfo.type == 'file'||dataInfo.type == 'text'){
                header += process.env.FILE_SIGN
            }else{
                header += process.env.FOLDER_SIGN
            }

            // add the sign for public and private
            if (dataInfo.isPrivate == true){
                header += process.env.PRIVATE_SIGN
            }else {
                header += process.env.PUBLIC_SIGN
            }

            //  return the id
            return header + "-" + random_id


        }else{
            throw new Error('dataInfo is missing/unknown')
        }

        

    }

    IdChecker (id){
        // get the sign chars in id
        let f3Char = id.substr(0, 3);
        let s3Char = id.substr(3, 3);

        console.log(f3Char, s3Char)

        if ((f3Char === process.env.FILE_SIGN || f3Char ===  process.env.FOLDER_SIGN) && (s3Char === process.env.PRIVATE_SIGN || s3Char ===  process.env.PUBLIC_SIGN)){


            const type = (f3Char === process.env.FILE_SIGN ? 'file' : 'folder')
            const isPrivate = (s3Char === process.env.PRIVATE_SIGN? true : false)
            
            // return an object 
            return {
                type,
                isPrivate
            }
        }else {
            throw new Error('unknown id')
        }


    }

    sizeFormatter(size){
        size = size / 1024;
        if (size < 1024) {
            return  size.toFixed(2) + " KB";
        } else if (size >= 1024 && size < Math.pow(1024, 2)) {
            return (size / 1024).toFixed(2) + " MB";
        } else if (size >= Math.pow(1024, 2) && size < Math.pow(1024, 3)) {
            return (size / Math.pow(1024, 2)).toFixed(2) + " GB";
        }
    }

    timeFormatter(time){
        console.log( new Date(time))
        let date = typeof time === 'object' ? time : new Date(time);
        return date.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"})
    }

    isBetween (date, start, end) {
        date = (typeof date === "string" || typeof date === "object" || date == 0) ? new Date(date).getTime() : date;
        start = (typeof start === "string" || typeof start === "object" || date == 0) ? new Date(start).getTime() : start;
        end = (typeof end === "string" || typeof end === "object" || date == 0) ? new Date(end).getTime() : end;
        console.log(date >= start && date <= end)
        return date >= start && date <= end;
    }

    
})();