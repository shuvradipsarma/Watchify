//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import app from "./app.js";
import connectDB from "./db/index.js"

// configuring environment variables so that it becomes available
// during start of the project, Eg need of this for MongoDB_URI value must be 
// initialized before the connection step
dotenv.config({
    path:"./env"
})

// Initialize an Express app
// const app = express();

// Step to connect to MongoDB and then start the server
connectDB().then( ()=>{
    // Start the Express server after the MongoDB connection is successful
    app.listen(process.env.PORT || 3000, ()=>{
    console.log(`Server is running at port ${process.env.PORT}`)});
}).catch((err)=>{
    // Log an error if MongoDB connection fails
    console.log("MongoDB connection fail!")
})













/*

Approach- IIFE to connect DB
import express from "express";

const app = express()

;(async ()=> {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("application cannot connect to database", error);
            throw error
        }) // listener
        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.log("ERROR",error)
        throw err
    }
})()
*/