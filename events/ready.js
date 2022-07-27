const colors = require("colors");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`Client logged in as ${client.user.tag}`.green);
        // client.emit("tick");

        client.user.setPresence({
            activities: [
                {
                    name: `Dank Exclusive`,
                    type: "WATCHING",
                },
            ],
        });
    },
};
