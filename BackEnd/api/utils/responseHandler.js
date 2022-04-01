
fs = require('fs');


module.exports = new class responseHandler {

    access(req)  {

        const {
            method,
            url,
            body,
            query,
            headers,
        } = req;


        const date = new Date();
        const _date = date.getDate()
        const _month = date.getMonth() + 1;
        const _year = date.getFullYear();
        const _hour = Number(date.getHours());
        const _GMT7_hour = _hour >= 24 ? `${_hour - 24}` : _hour;
        const _minute = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
        const _dateTime = `${_date}/${_month}/${_year} ${_GMT7_hour}:${_minute} GTM-7`;


        const log = {
            method,
            url,
            body,
            query,
            headers,
            _dateTime,
        };
        return 'method: ' + log.method + '-- url:  ' + req.protocol + "://" + req.get('host') + req.originalUrl + '  --date: ' + log._dateTime + '  -- use-agent: ' + headers['user-agent'];

    }



    log(des, msg) {

        if (msg !== null && msg !== undefined) {

            // check whether the file and folder exists
            if (fs.existsSync(des)) {
                // if the file exists, write the message to the file
                fs.appendFile(des, '\n' + msg, (err) => {
                    if (err) throw err;
                });
            } else {
                // if the file doesn't exist, create the file and write the message to the file
                fs.writeFile(des, msg, (err) => {
                    if (err) throw err;
                });
            }
        }
    }



    sendFailure(req, res, sttCode, err) {
        let newToken = this.checkNewToken(req);
        // get date time now
        let date = new Date();
        let dateTime = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + (date.getHours() + 7) + ':' + date.getMinutes() + ':' + date.getSeconds();

        this.log('./logs/access.log', this.access(req));
        this.log('./logs/error.log', (typeof err !== 'string' ? err.message : err) + '  at: ' + dateTime);

        res.status(sttCode).send({
            newToken: ((newToken !== null || newToken !== undefined) ? newToken : null),
            success: false,
            message: (typeof err !== 'string' ? err.message : err)
        })
    }



    sendSuccess(req, res, sttCode, data) {
        let newToken = this.checkNewToken(req)

        this.log('./logs/access.log', this.access(req));
        res.status(sttCode).send({
            newToken: ((newToken !== null || newToken !== undefined) ? newToken : null),
            success: true,
            data: data
        })

    }

    checkNewToken(req) {

        if (req.newAuthorization !== null || req.newAuthorization !==  undefined ||req.newAuthorization !==  '') {
            return req.newAuthorization;
        }
        return null;
    }


}