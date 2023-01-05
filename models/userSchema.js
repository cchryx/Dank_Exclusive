const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        autoReaction: {
            type: Array,
            default: [],
        },
        levelInfo: {
            type: Object,
            default: {
                prestige: 0,
                level: 0,
                exp: 0,
                messages: 0,
            },
        },
        donation: {
            type: Object,
            default: {},
        },
        miscData: {
            type: Object,
            default: {},
        },
    },
    { minimize: false }
);

const model = mongoose.model("UserModels", userSchema);

module.exports = model;
