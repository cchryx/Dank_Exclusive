const colors = require("colors");
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`Client logged in as ${client.user.tag}`.green);
        // client.emit("tick");

        client.user.setPresence({
            activities: [
                { name: `Dank Exclusive`, type: ActivityType.Watching },
            ],
            status: "dnd",
        });
    },
};
