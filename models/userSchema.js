const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userid: {
            type: String,
            required: true,
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
        dankdonations: {
            type: Number,
            default: 0,
        },
        boostamount: {
            type: Number,
            default: 0,
        },
    },
    { minimize: false }
);

const model = mongoose.model("UserModels", userSchema);

module.exports = model;
