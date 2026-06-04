import dotenv from "dotenv"
import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"
import connectDB from "./db/index.js"
import {app} from "./app.js"
dotenv.config({
    path:'./.env'
})

connectDB()  //async function returns a promise, so we can use .then and .catch to handle the connection result
.then(
    ()=>{
        try{
            app.on("error",(error)=>{
                console.error("Error starting the server:", error);
                throw error;
            })

            app.listen(process.env.PORT || 8000,
            ()=>{
                console.log(`Server is running on port ${process.env.PORT || 8000}`)
            }
        )
        }
        catch(error)
        {
            console.error("Error starting the server:", error);
        }
    }
)
.catch((err)=>{
    console.log("MONGO db connection failed !!!", err)
})







/*
import express from "express"
const app = express()
(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.error("Error starting the server:", error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    }
    catch(error)
    {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
})()
    */