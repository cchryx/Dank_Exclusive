const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema(
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
        sponsorId: {
            type: String,
            required: true,
        },
        sponsorMessage: {
            type: String,
        },
        winnersAmount: {
            type: Number,
            required: true,
        },
        prize: {
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
        hasEnded: {
            type: Boolean,
            default: false,
        },
        informationDisplay: {
            type: String,
        },
        requirements: {
            type: Object,
        },
        chatRequirements: {
            type: Object,
        },
        blacklist: {
            type: Array,
        },
        bypass: {
            type: Array,
        },
        globalBypass: {
            type: String,
        },
        entries: {
            type: Array,
            default: [],
        },
        winnersResults: {
            type: Array,
            default: [],
        },
        rerollExpire: {
            type: Number,
        },
    },
    { minimize: false }
);

const model = mongoose.model("GiveawayModels", giveawaySchema);

module.exports = model;
