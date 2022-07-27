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
    },
    { minimize: false }
);

const model = mongoose.model("GuildModels", guildSchema);

module.exports = model;
