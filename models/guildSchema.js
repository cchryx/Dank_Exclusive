const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema(
    {
        guildid: {
            type: String,
            required: true,
        },
        giveaway_roles: {
            type: Array,
            default: [],
        },
        giveaway_userids: {
            type: Array,
            default: [],
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
        perkrole_head: {
            type: String,
            default: "",
        },
        perkchannel_head: {
            type: String,
            default: "",
        },
        giveaway: {
            type: Object,
            default: {
                mentions: {},
                blacklist: [],
                bypass: [],
            },
        },
        roles: {
            type: Object,
            default: {},
        },
        theme: {
            type: Object,
            default: {
                color: "#f7cb8d",
                emoji_join: "<:smoothie:1003726574094397560>",
                emoji_mainpoint: "<:mainpoint_summer:1004211052612944014>",
                emoji_subpoint: "<a:subpoint_summer:1003716658277392484>",
                dividerurl:
                    "https://media.discordapp.net/attachments/1003715669059178626/1003729430897770506/ezgif.com-gif-maker_14.gif",
                button_style: 4,
            },
        },
        data: {
            type: Object,
            default: {},
        },
        speventtokens: {
            type: Object,
            default: {},
        },
    },
    { minimize: false }
);

const model = mongoose.model("GuildModels", guildSchema);

module.exports = model;
