const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema(
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
        sponsorid: {
            type: String,
            required: true,
        },
        sponsormessage: {
            type: String,
        },
        winnersamount: {
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
        infodisplay: {
            type: String,
        },
        typeurl: {
            type: String,
            required: true,
        },
        requirements: {
            type: Array,
        },
        blacklist: {
            type: Array,
        },
        bypass: {
            type: Array,
        },
        entries: {
            type: Array,
            default: [],
        },
        winnersresults: {
            type: Array,
            default: [],
        },
        rerollexpire: {
            type: Number,
        },
        entriescount: {
            type: Number,
            default: 0,
        },
    },
    { minimize: false }
);

const model = mongoose.model("GiveawayModels", giveawaySchema);

module.exports = model;
