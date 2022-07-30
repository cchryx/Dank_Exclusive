const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkrole")
        .setDescription("Perk command: create/remove/edit your autoreaction")
        .addSubcommand((subcommand) =>
            subcommand.setName("create").setDescription("Create your role")
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("show").setDescription("Show your current role")
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("remove").setDescription("Remove your role")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("useradd")
                .setDescription("Choose a user to add your role to")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("A valid user that is in this server")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("userremove")
                .setDescription("Choose a user to remove your role from")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("A valid user that is in this server")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit your role: color, icon, name")
                .addUserOption((oi) => {
                    return oi
                        .setName("icon")
                        .setDescription(
                            "Valid non-animated emoji from Dank Exclusive"
                        );
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription(
                            "Valid role name with at least 1 character but the max is 100"
                        );
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("color")
                        .setDescription("Valid hex color");
                })
        ),
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        let userData = await user_fetch(interaction.user.id);
        let error_message;

        if (interaction.options.getSubcommand() !== "create") {
            if (!userData.customrole.id) {
                error_message = `\`You do not have your own role\`\n\`\`\`fix\n/perkrole create\`\`\``;
                return error_reply(interaction, error_message);
            }
        }

        if (interaction.options.getSubcommand() === "create") {
        } else if (interaction.options.getSubcommand() === "show") {
            if (!userData.customrole.id) {
                error_message = `\`You do not have your own role\`\n\`\`\`fix\n/perkrole create\`\`\``;
                return error_reply(interaction, error_message);
            }
        } else if (interaction.options.getSubcommand() === "edit") {
        } else if (interaction.options.getSubcommand() === "userremove") {
        } else if (interaction.options.getSubcommand() === "useradd") {
        } else if (interaction.options.getSubcommand() === "remove") {
        }
    },
};
