const mongoose = require("mongoose");

const stickySchema = new mongoose.Schema(
    {
        channelId: {
            type: String,
            required: true,
            unique: true,
        },
        messageId: {
            type: String,
            required: true,
            unique: true,
        },
        content: {
            type: String,
            default: null,
        },
        embeds: {
            type: Array,
            default: null,
        },
        components: {
            type: Array,
            default: null,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    { minimize: false }
);

const model = mongoose.model("StickyModels", stickySchema);

module.exports = model;
