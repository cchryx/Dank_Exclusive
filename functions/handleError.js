const { Discord } = require("discord.js");

module.exports = (client) => {
    process.on("uncaughtException", (err) => {
        if (err.code === 10008) {
            return;
        }
        console.log(err);
    });

    process.on("unhandledRejection", (err) => {
        console.log(err);
    });
};
