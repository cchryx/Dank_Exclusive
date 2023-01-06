const mongoose = require("mongoose");

const perkchannelSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        channelId: {
            type: String,
            required: true,
            unique: true,
        },
        createdAt: {
            type: Number,
            required: true,
            default: Date.now(),
        },
        users: {
            type: Array,
            default: [],
        },
    },
    { minimize: false }
);

const model = mongoose.model("PerkchannelModels", perkchannelSchema);

module.exports = model;
