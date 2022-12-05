const mongoose = require("mongoose");

const partnershipChannel = new mongoose.Schema(
    {
        channelid: {
            type: String,
            required: true,
        },
        pmanid: {
            type: String,
            default: null,
        },
        expire: {
            type: Number,
            default: null,
        },
        mentions: {
            type: String,
            default: null,
        },
        mentionused: {
            type: Boolean,
            default: false,
        },
    },
    { minimize: false }
);

const model = mongoose.model("PartnershipChannelModels", partnershipChannel);

module.exports = model;
