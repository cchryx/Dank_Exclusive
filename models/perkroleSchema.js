const mongoose = require("mongoose");

const perkroleSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        roleId: {
            type: String,
            required: true,
            unique: true,
        },
        createdAt: {
            type: Number,
            required: true,
            default: Date.now(),
        },
        users: {
            type: Array,
            default: [],
        },
    },
    { minimize: false }
);

const model = mongoose.model("PerkroleModels", perkroleSchema);

module.exports = model;
