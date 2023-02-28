const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
        },
        perk: {
            type: Object,
            default: {
                placement: { channelCategory: null, rolePlacer: null },
                channel: {},
                autoReaction: {},
                role: {},
            },
        },
        giveaway: {
            type: Object,
            default: {
                globalBlacklist_roles: [],
                globalBypass_roles: [],
            },
        },
        donation: {
            type: Object,
            default: {
                roles: {},
            },
        },
        level: {
            type: Object,
            default: {
                channel: null,
                roles: {},
                multipliers: {
                    channel: {},
                    role: {},
                },
            },
        },
        temporaryExp: {
            type: Object,
            default: {},
        },
        theme: {
            type: Object,
            default: {
                color: "#c2c6f0",
                emoji_join: "<:xmasGift:1043675437743743016>",
                emoji_mainpoint: "<:xmasSanta:1043675777859862589> ",
                emoji_subpoint: "<:xmasCandy:1043675660989763674> ",
                emoji_reroll: "<:xmasBells:1043675497365770261>",
                divider_url:
                    "https://media.discordapp.net/attachments/1001660282663337986/1048011566529912882/ezgif.com-gif-maker_7.gif?width=576&height=35",
                button_style: 2,
            },
        },
        miscData: {
            type: Object,
            default: { roles: {}, channels: {}, categories: {} },
        },
    },
    { minimize: false }
);

const model = mongoose.model("GuildModels", guildSchema);

module.exports = model;
