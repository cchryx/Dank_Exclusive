const { Discord } = require("discord.js");

module.exports = (client) => {
    process.on("uncaughtException", (err) => {
        console.log(err);
    });

    process.on("unhandledRejection", (err) => {
        console.log(err);
    });
};
