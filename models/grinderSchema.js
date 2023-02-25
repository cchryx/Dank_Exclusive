const mongoose = require("mongoose");

const grinderSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        initialDate: {
            type: Number,
            default: Date.now(),
        },
        payments: {
            type: Number,
            default: 0,
        },
        break: {
            type: Object,
            default: {
                issuedBy: null,
                expires: null,
                reason: null,
            },
        },
    },
    { minimize: false }
);

const model = mongoose.model("GrinderModels", grinderSchema);

module.exports = model;
