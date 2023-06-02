const {StatusCodes} = require("http-status-codes")
const User = require("../models/user")
const asyncWrapper = require("../middleware/asyncwrapper")
const {notFoundError} = require("../errors/index")

const getUserName = asyncWrapper(async (req, res) => {
        let {userID} = req.params
      
        const user = await User.findById(userID).select("name")

        if (!user) {
            throw new notFoundError("The user does not exist.")
        }

        return res.status(StatusCodes.OK).json({status:"success", user: user})
})


module.exports = getUserName
