const {StatusCodes} = require('http-status-codes')
const {
      customApiError, 
      notFoundError,
      unauthenticatedError
  } = require('../errors')

const errorHandler = (err, req, res, next) => {
      
      const customError = {
            msg: err.message || "Something went wrong! please try again later.",
            statusCode: err.statusCode || 500
      }

      if (err.name === "ValidationError") {
            customError.msg = Object.values(err.errors).map((error) => error.message).join(",") 
            customError.statusCode = StatusCodes.BAD_REQUEST;
      }

      if (err.code && err.code === 11000) {
            customError.msg = `The property ${Object.keys(err.keyValue)} must be unique, It is already in use.`
            customError.statusCode = StatusCodes.BAD_REQUEST
      }
      
      if (err.name === "CastError") {
            customError.msg = `Unable to find object with id ${err.value}`
            customError.statusCode = StatusCodes.BAD_REQUEST
      }

      //  res.status(500).json({err: err})
       res.status(customError.statusCode).json({ status: "failed", msg:customError.msg})

     }

module.exports = errorHandler;