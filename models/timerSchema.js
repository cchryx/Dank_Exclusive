const mongoose = require("mongoose");

const timerSchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true,
        },
        channelId: {
            type: String,
            required: true,
        },
        messageId: {
            type: String,
            required: true,
        },
        hostId: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        endsAt: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
        },
        users: {
            type: Array,
            default: [],
        },
    },
    { minimize: false }
);

const model = mongoose.model("TimerModels", timerSchema);

module.exports = model;
