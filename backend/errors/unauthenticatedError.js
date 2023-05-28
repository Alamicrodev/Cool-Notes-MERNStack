const customApiError = require("./customApiError.js")
const statusCodes = require("http-status-codes").StatusCodes

class unauthenticatedError extends customApiError {
    constructor(msg) {
        super(msg, statusCodes.UNAUTHORIZED)
    }
}


module.exports = unauthenticatedError
