//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path:"./env"
})

connectDB().then( ()=>{
    app.listen(prcoess.env.PORT || 3000, ()=>{
    console.log(`Server is running at port ${process.env.PORT}`)});
}).catch((err)=>{
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