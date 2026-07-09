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
            index :true, //searching field kisi cheez pr enable krni h toh index true krdo that makes it optimised
            minlength: 3,
    maxlength: 20,
    index: true,
        },
        email : {
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,
        },
        fullName : {
            type:String,
            required:true,
            trim:true,
            index :true  //searching field kisi cheez pr enable krni h toh index true krdo that makes it optimised
        },
        avatar: {
    url: {
        type: String,
        required: true,
        trim: true,
    },
    public_id: {
        type: String,
        required: true,
        trim: true,
    },
},

coverImage: {
    url: {
        type: String,
        default: null,
        trim: true,
    },
    public_id: {
        type: String,
        default: null,
        trim: true,
    },
},
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
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
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(
        this.password,
        Number(process.env.BCRYPT_SALT_ROUNDS) || 10
    );
});

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

//refresh long term, access token short term
//validate -- acess token but after some time login again adn again access token milega but refresh token se hi milega access token if db ka refresh token match krta h toh access token milega otherwise nahi milega, refresh token se hi access token milega but access token se refresh token nahi milega, access token me user ka data hoga but refresh token me sirf user id hoga, access token short term hoga but refresh token long term hoga, access token client side store krna chahiye but refresh token server side store krna chahiye, access token ko local storage me store krna chahiye but refresh token ko http only cookie me store krna chahiye, access token ko secure cookie me store krna chahiye but refresh token ko secure cookie me store krna chahiye, access token ko same site cookie me store krna chahiye but refresh token ko same site cookie me store krna chahiye