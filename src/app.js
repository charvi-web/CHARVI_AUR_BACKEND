import express from "express"
import  cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
))
//data alag alag aayega -- json url
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import --- niche hi krte h 
import userRouter from "./routes/user.routes.js"



// routes declaration
//since routes is not directly given so we need to use middleware\
app.use("/api/v1/users", userRouter)
export {app}