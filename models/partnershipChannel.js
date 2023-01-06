const mongoose = require("mongoose");

const pchannelSchema = new mongoose.Schema(
    {
        channelId: {
            type: String,
            required: true,
        },
        ownerId: {
            type: String,
            default: null,
        },
        expiresAt: {
            type: Number,
            default: null,
        },
        mentions: {
            type: String,
            default: null,
        },
        mentionUsed: {
            type: Boolean,
            default: false,
        },
    },
    { minimize: false }
);

const model = mongoose.model("pchannelModels", pchannelSchema);

module.exports = model;
