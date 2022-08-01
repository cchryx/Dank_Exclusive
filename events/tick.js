const {
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    Message,
    TextChannel,
    Collection,
} = require("discord.js");

let mainCounter = 0;

module.exports = {
    name: "tick",
    once: false,
    async execute(client) {
        mainCounter++;
        setTimeout(() => {
            client.emit("tick");
            nowTimestamp = new Date();
        }, 1000);
    },
};
