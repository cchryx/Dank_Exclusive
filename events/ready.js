const colors = require("colors");
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`Client logged in as ${client.user.tag}`.green);
        client.emit("tickGiveaway");
        client.emit("tickGrinder");
        client.emit("tickPartnership");
        client.emit("tickTimer");

        client.user.setPresence({
            activities: [
                { name: `Dank Exclusive`, type: ActivityType.Watching },
            ],
            status: "dnd",
        });
    },
};
