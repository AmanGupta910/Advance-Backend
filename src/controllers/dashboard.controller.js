import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    const totalVideosPromise = Video.countDocuments({ owner: channelId });

    const totalSubscribersPromise = Subscription.countDocuments({
        channel: channelId
    });

    const videos = await Video.find({ owner: channelId }).select("_id views");

    const totalViews = videos.reduce((acc, video) => acc + (video.views || 0), 0);

    const videoIds = videos.map(video => video._id);

    const totalLikesPromise = Like.countDocuments({
        video: { $in: videoIds }
    });

    const [totalVideos, totalSubscribers, totalLikes] = await Promise.all([
        totalVideosPromise,
        totalSubscribersPromise,
        totalLikesPromise
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalSubscribers,
                totalViews,
                totalLikes
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    if (!videos.length) {
        throw new ApiError(404, "No videos found for this channel");
    }

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
});

export {
    getChannelStats,
    getChannelVideos
};
