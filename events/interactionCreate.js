const { InteractionType, Collection, MessageEmbed } = require("discord.js");

const { user_fetch } = require("../utils/user");

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (!interaction.type === InteractionType.ApplicationCommand) return;

        const commandname = interaction.commandName;
        const command = client.commands.get(commandname);

        if (!command) return;

        const userid = interaction.user.id;

        const userData = user_fetch(userid);

        try {
            await command.execute(interaction, client, userData);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        }
    },
};
