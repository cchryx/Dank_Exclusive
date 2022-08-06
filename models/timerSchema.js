const mongoose = require("mongoose");

const timerSchema = new mongoose.Schema(
    {
        guildid: {
            type: String,
            required: true,
        },
        channelid: {
            type: String,
            required: true,
        },
        messageid: {
            type: String,
            required: true,
        },
        hostid: {
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
        mentions: {
            type: Array,
            default: [],
        },
    },
    { minimize: false }
);

const model = mongoose.model("TimerModels", timerSchema);

module.exports = model;
