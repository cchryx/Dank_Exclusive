const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const { guild_checkperm } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("locksend")
        .setDescription(
            "lock send to change if a role or user can send messages in the channel"
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
            .has("SendMessages");

        const embed = new EmbedBuilder().setColor("Yellow");

        if (currentsatus === true) {
            interaction.channel.permissionOverwrites.edit(options.role.id, {
                SendMessages: false,
            });

            embed.setDescription(
                `Currently Status: 🔒\nSuccessfully locksended this channel for ${
                    roleid === "everyone" ? "@everyone" : `<@&${roleid}>`
                }\n\`Everyone with that role can no longer send messages in the channel\`\n\nTo reset changes:\n\`\`\`/locksend ${
                    roleid === "everyone" ? "" : `role: <@&${roleid}>`
                }\`\`\``
            );
        } else {
            interaction.channel.permissionOverwrites.edit(options.role.id, {
                SendMessages: null,
            });

            embed
                .setDescription(
                    `Currently Status: 🔓\nSuccessfully unlocksended this channel for ${
                        roleid === "everyone" ? "@everyone" : `<@&${roleid}>`
                    }\n\`Everyone with that role can now send messsages in the channel\``
                )
                .setColor("Blurple");
        }

        return interaction.reply({ embeds: [embed] });
    },
};
