import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Tweet } from "../models/tweet.model.js";
import mongoose, { isValidObjectId } from "mongoose";

/**
 * CREATE TWEET
 */
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
    });

    if (!tweet) {
        throw new ApiError(500, "failed to create tweet, please try again");
    }

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    );
});

/**
 * UPDATE TWEET
 */
const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content?.trim()) {
        throw new ApiError(400, "content is required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user?._id,
        },
        {
            $set: { content:content.trim() },
        },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiError(
            404,
            "Tweet not found or you are not the owner"
        );
    }

    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    );
});

/**
 * DELETE TWEET
 */
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user?._id,
    });

    if (!deletedTweet) {
        throw new ApiError(
            404,
            "Tweet not found or you are not the owner"
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { tweetId }, "Tweet deleted successfully")
    );
});

/**
 * GET USER TWEETS
 */
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
            },
        },

        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails",
                },

                ownerDetails: {
                    $first: "$ownerDetails",
                },

                isLiked: {
                    $in: [
                        req.user?._id,
                        {
                            $map: {
                                input: "$likeDetails",
                                as: "like",
                                in: "$$like.likedBy",
                            },
                        },
                    ],
                },
            },
        },

        {
            $sort: {
                createdAt: -1,
            },
        },

        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    );
});

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets,
};