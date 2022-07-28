const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, MessageActionRow, MessageButton } = require("discord.js");

const { guild_checkperm } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rolelock")
        .setDescription("lock view so that only one role can view the channel")
        .addRoleOption((oi) => {
            return oi
                .setName("role")
                .setDescription("A valid role that exists in this server")
                .setRequired(true);
        }),
    async execute(interaction, client) {
        const options = {
            role: interaction.options.getRole("role"),
        };
        requiredperms = ["MANAGE_CHANNELS", "MANAGE_GUILD", "ADMINISTRATOR"];
        let message;
        let pass = await guild_checkperm(interaction, requiredperms);

        if (!pass === true) {
            message = `\`You don't have the required permissions to preform this action\``;
            return error_reply(interaction, message);
        }

        const roleid = options.role.id;
        const everyonerole = await interaction.guild.roles.everyone;

        if (roleid === interaction.guildId) {
            message = `\`No point in locking for everyone using this command. Please use /lockview\``;
            return error_reply(interaction, message);
        }

        const currentsatuseveryone = interaction.channel
            .permissionsFor(everyonerole.id)
            .has("ViewChannel");

        const embed = new EmbedBuilder().setColor("Green");

        if (currentsatuseveryone === true) {
            interaction.channel.permissionOverwrites.edit(everyonerole.id, {
                ViewChannel: false,
            });
            interaction.channel.permissionOverwrites.edit(options.role.id, {
                ViewChannel: true,
            });

            embed.setDescription(
                `Currently Status: 🔒\nSuccessfully rolelocked this channel to <@&${roleid}>\n\`Only people with that role can view the channel\`\n\nTo reset changes:\n\`\`\`/rolelock role: <@&${roleid}>\`\`\``
            );
        } else {
            interaction.channel.permissionOverwrites.edit(everyonerole.id, {
                ViewChannel: true,
            });
            interaction.channel.permissionOverwrites.edit(options.role.id, {
                ViewChannel: null,
            });

            embed
                .setDescription(
                    `Currently Status: 🔓\nSuccessfully unrolelocked this channel from <@&${roleid}>\n\`Everyone can view the channel\``
                )
                .setColor("Blurple");
        }
        return interaction.reply({ embeds: [embed] });
    },
};
