import mongoose, {Schema} from "mongoose"
const subscriptionSchema = new Schema({
    subscriber :{
        //jisne kia
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        //jisko kiya kyuki channel is also a user
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})
export const Subscription = mongoose.model("Subscription",subscriptionSchema)