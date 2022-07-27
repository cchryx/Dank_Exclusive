const { mongodb_srv, discord_token } = require("./config.json");
const colors = require("colors");

const {
    Discord,
    Collection,
    Intents,
    Client,
    MessageEmbed,
} = require("discord.js");
const fs = require("fs");

const mongoose = require("mongoose");

mongoose
    .connect(mongodb_srv, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to the MongoDB database...".green);
    })
    .catch((err) => {
        console.log(err);
    });

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});
client.commands = new Collection();

const functions = fs
    .readdirSync("./functions")
    .filter((file) => file.endsWith(".js"));
const eventFiles = fs
    .readdirSync("./events")
    .filter((file) => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./commands");

process.on("uncaughtException", (err) => {
    console.log(err);
});

process.on("unhandledRejection", (err) => {
    console.log(err);
});

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }

    client.handleEvents(eventFiles, "./events");
    client.handleCommands(commandFolders, "./commands");
    client.login(discord_token);
})();
