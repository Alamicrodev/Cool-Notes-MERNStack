const express = require("express")
// to use env vars
const process = require("process")
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
dotenv.config()

// db connect
const connectDB = require("./db/connectDB.js")

// import routes 
const notesRoutes = require("./routes/notes.js")
const authRoutes = require("./routes/auth.js") 
const userRoutes = require("./routes/user.js")

// importmiddleware
const errorHandlerMiddleware = require("./middleware/errorhandler.js")
const notFoundMiddleware = require("./middleware/notfoundmiddlware.js")
// const {expressAsyncErrors} = require('express-async-errors')

//extra security middleware
const helmet = require("helmet")
const cors = require("cors")
const xss = require("xss-clean")
const rateLimiter = require("express-rate-limit")

//Swagger
const YAML = require("yamljs")
const swaggerUI = require("swagger-ui-express")
const swaggerDocument = YAML.load("./swaggerdoc.yaml")

const server = express()
const frontendBuildPath = path.join(__dirname, "..", "frontend", "build")
const frontendBuildExists = fs.existsSync(frontendBuildPath)

server.set('trust proxy', 1)
server.use(rateLimiter({windowMs: 15*60*1000,  //15 minutes
 max:100, }))  //max 100 requests allowed 
server.use(express.json())
server.use(helmet())
server.use(cors())
server.use(xss())


server.use("/api/v1/notes", notesRoutes)
server.use("/api/v1/users", userRoutes)
server.use("/api/v1/auth", authRoutes)

server.get("/api", (req,res) => {
    res.status(200).send("<h1>NoteTheMood Api</h1><a href='/api/v1/docs'>Documentation</a>")
})

server.get("/", (req, res) => {
    res.status(200).send("<h1>NoteTheMood Api</h1><a href='/api/v1/docs'>Documentation</a>")
})

server.get("/healthz", (req, res) => {
    res.status(200).json({status: "ok"})
})

server.use("/api/v1/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument))

if (frontendBuildExists) {
    server.use(express.static(frontendBuildPath))
    server.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
            return next()
        }

        res.sendFile(path.join(frontendBuildPath, "index.html"))
    })
}

server.use(errorHandlerMiddleware)
server.use(notFoundMiddleware)


 
// starting the server 
const port = process.env.PORT || 5000
const dbUrl = process.env.DB_URL 

const start = async () => { 
    try {
        await connectDB(dbUrl) 
        server.listen(port, "0.0.0.0", () => {
            console.log(`server live on port ${port}`)
        })
    }
    catch (err) {
        console.log("Failed to load database", err)
    }
}

start()
