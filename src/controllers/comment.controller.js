import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;


    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },


        {
            $addFields: {

                likesCount: {
                    $size: "$likes"
                },


                owner: {
                    $first: "$owner"
                },


                isLiked: {
                    $in: [
                        new mongoose.Types.ObjectId(req.user?._id),
                        "$likes.likedBy"
                    ]
                }
            }
        },


        {
            $sort: {
                createdAt: -1
            }
        },


        {
            $project: {

                content: 1,

                createdAt: 1,

                likesCount: 1,

                isLiked: 1,

                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ]);



    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        {
            page: Number(page),
            limit: Number(limit)
        }
    );


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comments,
                "Comments fetched successfully"
            )
        );

});





// Add comment
const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { content } = req.body;


    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }


    const video = await Video.findById(videoId);


    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    const comment = await Comment.create({

        content: content.trim(),

        video: videoId,

        owner: req.user._id
    });



    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                comment,
                "Comment added successfully"
            )
        );

});






// Update comment
const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;


    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }



    const comment = await Comment.findById(commentId);


    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }



    if (
        comment.owner.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Only comment owner can edit this comment"
        );
    }



    const updatedComment =
        await Comment.findByIdAndUpdate(
            commentId,
            {
                $set:{
                    content: content.trim()
                }
            },
            {
                new:true
            }
        );



    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment updated successfully"
            )
        );

});








// Delete comment
const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;



    const comment = await Comment.findById(commentId);



    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }



    if (
        comment.owner.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Only comment owner can delete this comment"
        );
    }



    await Comment.findByIdAndDelete(commentId);



    await Like.deleteMany({
        comment: commentId
    });



    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    commentId
                },
                "Comment deleted successfully"
            )
        );

});



export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};