import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async (userId)=>{
    try{
        
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found with given userId");
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        //validateBeforeSave false isliye ki agar user ke paas koi required field nhi hai toh bhi refresh token save ho jaye bina error throw kiye
        await user.save()
        return {accessToken,refreshToken}
    }
    catch(error)
    {
        throw new ApiError(500,"Error while generating access and refresh token")
    }
}
const registerUser = asyncHandler(async (req, res)=>{

    //big problem ko small problems mei break krna 
    //register user 
    //get user details from frontend -- postman api
    //validation ki kuch empty na bhej dia ho
    //check if user already exists in database : check both username and email
    //check for images, check for avatar
    //upload them to cloudinary and get public url
    //user object create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response to frontend


    const {fullName, email, username,password } = req.body;
    

    if (
    [fullName, email, username, password].some(
        (field) => !field || field.trim() === ""
    )
) {
    throw new ApiError(400, "All fields are required");
}
    
    const existedUser = await User.findOne({
            //$or checks on all objects passed in array and if any one of them is true then it returns true
            $or:[{username},{email}]})

            if (existedUser)
            {
                throw new ApiError(409,"User already exists with given username or email")
            }
    
            const avatarLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
            if (!avatarLocalPath)
            {
                throw new ApiError(400,"Avatar image is required")
            }

            //jaan bhujkr time lgana padega
            const avatar = await uploadOnCloudinary(avatarLocalPath)

const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
            if (!avatar)
            {
                throw new ApiError(400,"Avatar image is required")
            }

            const user = await User.create({
    fullName,

    avatar: {
        url: avatar.url,
        public_id: avatar.public_id,
    },

    coverImage: coverImage
        ? {
              url: coverImage.url,
              public_id: coverImage.public_id,
          }
        : {
              url: null,
              public_id: null,
          },

    email,
    password,
    username: username.toLowerCase(),
});

            const createdUser = await User.findById(user._id).select("-password -refreshToken")

            if (!createdUser)
            {
                throw new ApiError(500,"Something went wrong while registering the user")
            }

            return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
);
});

const loginUser = asyncHandler(async(req,res)=>{
    
    //get email and password from req body
    //username or email se login karna chahte h toh dono check karna padega
    //find the user
    //if user matches check password
    //generate access and refresh token
    //send cookies and response

    const {email,username,password}=req.body;
    //only with email if (!email)
    if (!(username || email) || !password) {
    throw new ApiError(
        400,
        "Username/email and password are required"
    );
}
    //pehla jo record milega usko le lega chahe email se mile ya username se mile, dono check karne ke liye $or operator use karna padega
    const user = await User.findOne({
    $or: [
        { username: username?.toLowerCase() },
        { email: email?.toLowerCase() }
    ]
});
    if (!user)
    {
        throw new ApiError(404,"User not found with given username or email")
    }
    //check password 
    //jo hum password save krte h voh this.password se milega and password se hume jo abhi hum daal rhe h milega
    //User mongoose wala and humne jo bnaya h voh user h 
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid)
    {
        throw new ApiError(401,"Invalid user credentials")
    }
    //generate access and refresh token

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    //cookies mei bhejna/ select mei -minus krke voh fields daal do jo nhi bhejni
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

     const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
}
    return res.status(200).cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,
            refreshToken
        },"User logged In successfully")
    )
})
const logoutUser = asyncHandler(async(req,res)=>{
//cookies se access token aur refresh token dono delete karna hoga
//like login krte time we were using email username but logout ke time thodi na ye sb lenge
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
    refreshToken: 1
}
    },{
        new:true
    })
    const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"User logged out successfully")
    )



})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    //access from cookies ya phir phone se data aa rha h 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized request")
    }
    try{
    const decodedToken = await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)
    if (!user )
    {
        throw new ApiError(401,"Invalid refresh token")
    }

    if (user.refreshToken !== incomingRefreshToken)
    {
        throw new ApiError(401,"Refresh token is expired or used, Login again")
    }

    const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

    const {accessToken,refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res.status(200)
    .cookie("accessToken",
    accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
        new ApiResponse(200,{accessToken,refreshToken : newRefreshToken}
        ,"Access token refreshed successfully"
    )
    )
}
catch(error)
{
    throw new ApiError(401,error?.message || "Invalid refresh Token")
}
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const { oldPassword, newPassword } = req.body;

if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
}
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect)
    {
        throw new ApiError (400,"Invalid old password")
    }
    user.password=newPassword; //assign
    await user.save()
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})


const getCurrentUser = asyncHandler(
    async(req,res)=>{
        return res.status(200).
        json (new ApiResponse(200,req.user,
            "Current user fetched successfully"))
    }
)

const updateAccountDetails = asyncHandler(
    async(req,res)=>{
        const {fullName,email}=req.body;
        if (
    [fullName,email].some(
        field=>!field || field.trim()===""
    )
){
    throw new ApiError(400,"All fields are required");
}
        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set:{
                    fullName,
                    email,
                }
            },
            {new:true})  //update hone ke baad jo info h voh return hoti h
            .select("-password -refreshToken") 
            return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
    }
)

const updateUserAvatar = asyncHandler(
    async(req,res)=>{
        const avatarLocalPath = req.file?.path
        if (!avatarLocalPath)
        {
            throw new ApiError(400,"Avatar file is missing")
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar?.url)
        {
            throw new ApiError(400,"Error while uploading on avatar")
        }
        const user = await User.findByIdAndUpdate
        (
            req.user?._id,
            {
                $set: {
    avatar: {
        url: avatar.url,
        public_id: avatar.public_id,
    },
}
            },
            {
                new:true
            }
        ).select ("-password -refreshToken")
        return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
    }
)

const updateUserCoverImage = asyncHandler(
    async(req,res)=>{
        const coverImageLocalPath = req.file?.path
        if (!coverImageLocalPath)
        {
            throw new ApiError(400,"cover image file is missing")
        }
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if (!coverImage?.url)
        {
            throw new ApiError(400,"Error while uploading on cover Image")
        }
        const user = await User.findByIdAndUpdate
        (
            req.user?._id,
            {
                $set: {
    coverImage: {
        url: coverImage.url,
        public_id: coverImage.public_id,
    },
}
            },
            {
                new:true
            }
        ).select ("-password -refreshToken")
        return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
    }
)

const getUserChannelProfile = asyncHandler(
    async(req,res)=>{
        const {username} = req.params
        if (!username?.trim())
        {
            throw new ApiError(400,"Username is missing")
        }
//datatype that aggregates return --- array with multiple values
        const channel = await User.aggregate(
            [
            {
                $match:{
                    username : username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from : "subscriptions",
                    localField : "_id",
                    foreignField :"channel",
                    as : "subscribers"
                }
            },
            {
                $lookup:{
                    from : "subscriptions",
                    localField : "_id",
                    foreignField :"subscriber",
                    as : "subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size: "$subscribers",

                    },
                    channelsSubscribedToCount :{
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{
    $in:[
        req.user?._id,
        {
            $map:{
                input:"$subscribers",
                as:"sub",
                in:"$$sub.subscriber"
            }
        }
    ]
}
                            ,then:true,
                            else:false
                        }
                    }

                }
            },
            {//jo jo dikhana h 
                $project:{
                    fullName:1,
                    username:1,
                    subscribersCount:1,
                    channelsSubscribedToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1
                }
            }
        ]
        )
        if (!channel?.length)
    {
        throw new ApiError(404,"Channel does not exist")
    }
    return res.status(200).json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
    })

const getWatchHistory = asyncHandler(
    async(req,res)=>{
        const user = await User.aggregate(
            [
                {
                    $match:{
                        _id: new mongoose.Types.ObjectId(req.user._id)
                    }
                },
                {
                    $lookup:{
                        from:"videos",
                        localField:"watchHistory",
                        foreignField:"_id",
                        as : "watchHistory",
                        pipeline:[
                            {
                                $lookup:{
                                    from :"users",
                                    localField:"owner",
                                    foreignField:"_id",
                                    as:"owner",
                                    pipeline:[
                                        {
                                            $project:{
                                                fullName :1,
                                                username:1,
                                                avatar:1
                                            }
                                        }
                                    ]

                                }
                            },
                            {
                                $addFields:{
                                    owner:{
                                        $first:"$owner"
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        )
        return res.status(200).json(
            new ApiResponse(200,user[0]?.watchHistory || [],"Watch history fetched successfully"
            )
        )
    }
)


export {registerUser,
loginUser,
    logoutUser,
    refreshAccessToken,
   changeCurrentPassword,    getCurrentUser,
    updateAccountDetails,
updateUserAvatar,updateUserCoverImage,
getUserChannelProfile,getWatchHistory}