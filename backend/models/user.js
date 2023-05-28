const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
// to use env vars
const process = require("process")
const dotenv = require("dotenv");
dotenv.config()

const userSchema = new mongoose.Schema(
    {name: {type: String, required: [true, "Please provide your name."], trim: true, maxlength: [20, "Your name cannot be longer than 20 characters."]},
     email: {type: String, required: [true, "Please provide your email."], trim: true, maxlength: [35, "Your email cannot be longer than 35 characters."], match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "Please provide a valid email."], unique: [true, "Email is already in use."]},
     password: {type: String, required: [true, "Please choose a password."], maxlength: [16, "Password cannot be longer than 16 characters."], minlength: [8, "Password must be greater than 8 characters." ]  }
    }, 
    {timestamps: true}
    )

    userSchema.pre("save", async function(next) {                      //must not be arrow function otherwise the this keyword will not work and don't forget to pass in next because I forgot it first time
        const salt = await bcrypt.genSalt(10)                          //must await  also npm install bcryptjs --save                        
        this.password = await bcrypt.hash(this.password, salt)         //must await  also const bcrypt = require("bcryptjs") 
        next()
    })

    userSchema.methods.createJWT = function() {
       return jwt.sign({id: this._id, name: this.name},    //const jwt = require("jsonwebtoken")
            process.env.JWT_SECRET, {expiresIn: "30d"})    //npm install jsonwebtoken
    } 

    userSchema.methods.comparePasswords = async function(candidatePassword)   {   //function checks if the provided password is the same as saved hashed password.         
        const isMatch = await bcrypt.compare(candidatePassword, this.password)  
        return isMatch              
    }

module.exports = mongoose.model("User", userSchema)