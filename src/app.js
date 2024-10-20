import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// app.use() is use for middleware configuration purposes
// here it is used for middleware configuration purposes
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) // Parses incoming JSON requests and limits the request body size to 16kb.
app.use(express.urlencoded({extended:true,limit:"16kb"})) // Parses URL-encoded data with extended option for rich objects and arrays, and limits the request body size to 16kb.
app.use(express.static("public")) // Serves static files(images,css,js) from the "public" directory.
app.use(cookieParser())  // Parses cookies attached to the client request object.


export {app}