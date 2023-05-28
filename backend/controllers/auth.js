const {StatusCodes} = require("http-status-codes")
const User = require("../models/user")
const asyncWrapper = require("../middleware/asyncwrapper.js")
const {validationError, unauthenticatedError} = require("../errors")

// creates a user
const register = asyncWrapper(async (req, res, next) => {
         
        const user = await User.create(req.body) 

        const token = user.createJWT()
    
        res.status(200).json({status: "success", msg: "User created successfully.", token: token, userId: user._id}) 
})

// creates and serves a JWT token. 
const login = asyncWrapper(async (req,res) => {
    let {email, password} = req.body
    if (!email) {
       throw new validationError("Please provide an email.")
    }
    if (!password) {
        throw new validationError("Please provide a password.")
    }
    
    const user = await User.findOne({email})
    
    if (!user) {
        throw new unauthenticatedError(`Cannot find a user with email ${email}.`)
    }
    
    console.log(password)
    const isMatch = await user.comparePasswords(password)
    console.log(isMatch)
    
    if (!isMatch) {
        throw new unauthenticatedError(`Your email or password is incorrect.`)
    }
    else {
        const token = user.createJWT()

    return res.status(StatusCodes.OK).json({status: "success", msg: `Succesfully logged in as ${user.name}`, token: token, userId: user._id})
     
    }

})

module.exports = {register, login}