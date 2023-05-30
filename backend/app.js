const express = require("express")
// to use env vars
const process = require("process")
const dotenv = require("dotenv");
dotenv.config()

// db connect
const connectDB = require("./db/connectDB.js")

// import routes 
const notesRoutes = require("./routes/notes.js")
const authRoutes = require("./routes/auth.js") 

// importmiddleware
const errorHandlerMiddleware = require("./middleware/errorhandler.js")
const notFoundMiddleware = require("./middleware/notfoundmiddlware.js")
// const {expressAsyncErrors} = require('express-async-errors')

//extra security middleware
const helmet = require("helmet")
const cors = require("cors")
const xss = require("xss-clean")
const rateLimiter = require("express-rate-limit")

const server = express()

server.set('trust proxy', 1)
server.use(rateLimiter({windowMs: 15*60*1000,  //15 minutes
 max:100, }))  //max 100 requests allowed 
server.use(express.json())
server.use(helmet())
server.use(cors())
server.use(xss())


server.use("/api/v1/notes", notesRoutes)
server.use("/api/v1/auth", authRoutes)


server.use(errorHandlerMiddleware)
server.use(notFoundMiddleware)

server.get("/", (req, res) => {
     res.status(200).send("the server is working!!")
})
 

 
// starting the server 
const port = process.env.PORT || 5000
const dbUrl = process.env.DB_URL 

const start = async () => { 
    try {
        await connectDB(dbUrl) 
        server.listen(port, () => {
            console.log(`server live on port ${port}`)
        })
    }
    catch (err) {
        console.log("Failed to load database", err)
    }
}

start()