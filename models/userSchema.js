const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userid: {
            type: String,
            required: true,
            unique: true,
        },
        privatechannel: {
            type: Object,
            default: {
                id: null,
                users: [],
            },
        },
        customrole: {
            type: Object,
            default: {
                id: null,
                users: [],
            },
        },
        autoreaction: {
            type: Array,
            default: [],
        },
        donations: {
            type: Object,
            default: {},
        },
        miscdata: {
            type: Object,
            default: {},
        },
    },
    { minimize: false }
);

const model = mongoose.model("UserModels", userSchema);

module.exports = model;
