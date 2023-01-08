const { InteractionType, Collection, MessageEmbed } = require("discord.js");

const { giveaway_requiredchat } = require("../utils/giveaway");
const { guild_fetch } = require("../utils/guild");
const {
    user_exp_add_message,
    user_exp_add_interaction,
} = require("../utils/level");
const { perk_autoreaction } = require("../utils/perk");

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        if (message.author.bot) {
            console.log(message);
            if (!message.interaction) {
                return;
            }

            await user_exp_add_interaction(client, message);
        }

        await user_exp_add_message(client, message);
        await giveaway_requiredchat(message.author.id, message.channel.id);

        if (message.mentions.members.size > 0) {
            if (message.mentions.repliedUser) return;
            return perk_autoreaction(
                message,
                message.mentions.members,
                await guild_fetch(message.guildId)
            );
        }
    },
};
