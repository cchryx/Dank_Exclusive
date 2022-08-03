const { InteractionType, Collection, MessageEmbed } = require("discord.js");

const { user_ar } = require("../utils/user");
const { guild_fetch } = require("../utils/guild");

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        if (message.mentions.members.size > 0) {
            if (message.mentions.repliedUser) return;
            return user_ar(
                message,
                message.mentions.members,
                await guild_fetch(message.guildId)
            );
            r;
        }
    },
};
