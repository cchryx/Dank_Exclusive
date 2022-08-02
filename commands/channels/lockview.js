const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const { guild_checkperm_mod } = require("../../utils/guild");
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
        requiredperms = ["ManageChannels", "ManageGuild", "Administrator"];
        let message;
        let pass = await guild_checkperm_mod(interaction, requiredperms);

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
            .has("ViewChannel");

        const embed = new EmbedBuilder().setColor("Yellow");

        if (currentsatus === true) {
            interaction.channel.permissionOverwrites.edit(options.role.id, {
                ViewChannel: false,
            });

            embed.setDescription(
                `Currently Status: 🔒\nSuccessfully lockviewed this channel for ${
                    roleid === "everyone" ? "@everyone" : `<@&${roleid}>`
                }\n\`Everyone with that role can no longer view the channel\`\n\nTo reset changes:\n\`\`\`/lockview ${
                    roleid === "everyone" ? "" : ` role: <@&${roleid}>`
                }\`\`\``
            );
        } else {
            interaction.channel.permissionOverwrites.edit(options.role.id, {
                ViewChannel: null,
            });

            embed
                .setDescription(
                    `Currently Status: 🔓\nSuccessfully unlockviewed this channel for ${
                        roleid === "everyone" ? "@everyone" : `<@&${roleid}>`
                    }\n\`Everyone with that role can now view the channel\``
                )
                .setColor("Blurple");
        }
        return interaction.reply({ embeds: [embed] });
    },
};
