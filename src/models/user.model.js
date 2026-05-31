import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username : {
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index :true  //searching field kisi cheez pr enable krni h toh index true krdo that makes it optimised
        },
        email : {
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName : {
            type:String,
            required:true,
            trim:true,
            index :true  //searching field kisi cheez pr enable krni h toh index true krdo that makes it optimised
        },
        avatar : {
            type:String, //cloudinary se url aayega
            required:true,
        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:Schema.types.objectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"],
        },

        refreshToken :{
            type:String,
        }
},{timestamps:true})

//in callback this ka reference nhi hota h toh use normal function
userSchema.pre("save",async function (next){
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordCorrect=async function(password)
{
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function()
{
    return jwt.sign(
        {//payload jo data bhejna h token me
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },process.env.ACCESS_TOKEN_SECRET,
        {
           expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function()
{
    return jwt.sign(
        {
            _id:this._id,
    },process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model("User", userSchema);