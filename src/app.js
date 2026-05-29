import express from "express"
import  cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
app.use(cors(
    {
        origin:proces.env.CORS_ORIGIN,
        credentials:true
    }
))
//data alag alag aayega -- json url
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
export {app}