const jwt = require("jsonwebtoken")
// to use env vars
const process = require("process")
const dotenv = require("dotenv");
dotenv.config()

const authMiddlware = async (req,res,next) => {
    const authHeader = req.headers.authorization
    req.authenticated = {}
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.authenticated.status = false;
    }  
    else {
        const token = authHeader.split(" ")[1];
        
        try {
            const tokenData = jwt.verify(token, process.env.JWT_SECRET)
            req.authenticated.status = true; 
            req.authenticated.user = {}
            req.authenticated.user.id = tokenData.id;
            req.authenticated.user.name = tokenData.name; 
        } catch (error) {
           
            req.authenticated.status = false
        }

    }
    next()
}

module.exports = authMiddlware;