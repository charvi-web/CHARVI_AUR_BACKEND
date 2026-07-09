import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            default: null,
        },

        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },

        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet",
            default: null,
        },

        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// A like must belong to exactly one entity
likeSchema.pre("validate", function (next) {
    const targets = [this.video, this.comment, this.tweet].filter(Boolean);

    if (targets.length !== 1) {
        return next(
            new Error("Like must belong to exactly one target (video, comment, or tweet).")
        );
    }

    next();
});

// Prevent duplicate likes
likeSchema.index(
    { likedBy: 1, video: 1 },
    {
        unique: true,
        partialFilterExpression: {
            video: { $exists: true },
        },
    }
);

likeSchema.index(
    { likedBy: 1, comment: 1 },
    {
        unique: true,
        partialFilterExpression: {
            comment: { $exists: true },
        },
    }
);

likeSchema.index(
    { likedBy: 1, tweet: 1 },
    {
        unique: true,
        partialFilterExpression: {
            tweet: { $exists: true },
        },
    }
);

export const Like = mongoose.model("Like", likeSchema);