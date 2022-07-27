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
                id: {
                    type: String,
                    default: null,
                },
                users: {
                    type: Array,
                    default: [],
                },
            },
        },
        autoreaction: {
            type: String,
            default: null,
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
