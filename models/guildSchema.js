const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema(
    {
        guildid: {
            type: String,
            required: true,
        },
        moderation_roles: {
            type: Array,
            default: [],
        },
        moderation_userids: {
            type: Array,
            default: [],
        },
        boostroles: {
            type: Array,
            default: [],
        },
        perkar_roles: {
            type: Object,
            default: {},
        },
        perkchannel_roles: {
            type: Object,
            default: {},
        },
        perkrole_roles: {
            type: Object,
            default: {},
        },
        perkrole_head: {
            type: String,
            default: "",
        },
    },
    { minimize: false }
);

const model = mongoose.model("GuildModels", guildSchema);

module.exports = model;
