const customApiError = require("./customApiError");
const StatusCodes = require("http-status-codes").StatusCodes; 

class notFoundError extends customApiError {
    constructor(msg) {
        super(msg, StatusCodes.NOT_FOUND)
    }
}


module.exports = notFoundError

