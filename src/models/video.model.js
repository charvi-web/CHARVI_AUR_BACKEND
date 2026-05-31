import mongoose  from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String, //cloudinary se url aayega
        required:true,},
    thumbnail:{
        type:String, //cloudinary se url aayega
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    duration:{
        type:Number, //cloudinary time bhejta h itni der ka h 
        required:true,
    }
    , view:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    }
},{timestamps:true})
videoSchema.plugin(mongooseAggregatePageinate)
export const Video = mongoose.model("Video", videoSchema);