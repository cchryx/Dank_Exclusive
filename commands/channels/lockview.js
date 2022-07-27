const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

const { guild_checkperm } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lockview")
        .setDescription(
            "lock view to change if a role or user can view the channel"
        )
        .addRoleOption((oi) => {
            return oi
                .setName("role")
                .setDescription("A valid role that exists in this server");
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

        let roleid;
        if (!options.role) {
            options.role = await interaction.guild.roles.everyone;
            roleid = "everyone";
        } else {
            roleid = options.role.id;
        }

        const currentsatus = interaction.channel
            .permissionsFor(options.role.id)
            .has("VIEW_CHANNEL");

        const embed = new MessageEmbed().setColor("YELLOW");

        if (currentsatus === true) {
            interaction.channel.permissionOverwrites.set([
                {
                    id: options.role.id,
                    deny: "VIEW_CHANNEL",
                },
            ]);

            embed.setDescription(
                `Currently Status: 🔒\nSuccessfully lockviewed this channel for ${
                    roleid === "everyone" ? "@everyone" : `<@&${roleid}>`
                }\n\`Everyone with that role can no longer view the channel\``
            );
        } else {
            interaction.channel.permissionOverwrites.set([
                {
                    id: options.role.id,
                    allow: "VIEW_CHANNEL",
                },
            ]);

            embed.setDescription(
                `Currently Status: 🔓\nSuccessfully unlockviewed this channel for ${
                    roleid === "everyone" ? "@everyone" : `<@&${roleid}>`
                }\n\`Everyone with that role can now view the channel\``
            );
        }

        return interaction.reply({ embeds: [embed] });
    },
};
