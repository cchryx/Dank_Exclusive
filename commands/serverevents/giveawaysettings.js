const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageMentions: { USERS_PATTERN },
} = require("discord.js");

const UserModel = require("../../models/userSchema");
const GuildModel = require("../../models/guildSchema");
const GiveawayModel = require("../../models/givewaySchema");

const { user_fetch } = require("../../utils/user");
const { error_reply } = require("../../utils/error");
const { giveaway_check_mentioncd } = require("../../utils/giveaway");
const {
    discord_check_role,
    discord_dissect_roles,
} = require("../../utils/discord");
const { guild_fetch } = require("../../utils/guild");
const { time_format } = require("../../utils/time");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveawaysettings")
        .setDescription("Giveaway settings actions")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show all giveaway settings.")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("addglobal")
                .setDescription("Add gloabal properties for giveaways.")
                .addStringOption((oi) => {
                    return oi
                        .setName("category")
                        .setDescription("Global property you want to edit.")
                        .addChoices(
                            {
                                name: "Global Bypass",
                                value: "globalBypass_roles",
                            },
                            {
                                name: "Global Blacklist",
                                value: "globalBlacklist_roles",
                            }
                        )
                        .setRequired(true);
                })
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Choose a role to add to the category.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("removeglobal")
                .setDescription("Remove gloabal properties for giveaways.")
                .addStringOption((oi) => {
                    return oi
                        .setName("category")
                        .setDescription("Global property you want to edit.")
                        .addChoices(
                            {
                                name: "Global Bypass",
                                value: "globalBypass_roles",
                            },
                            {
                                name: "Global Blacklist",
                                value: "globalBlacklist_roles",
                            }
                        )
                        .setRequired(true);
                })
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Choose a role to add to the category.")
                        .setRequired(true);
                })
        ),
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        let error_message;

        const checkAccess = await discord_check_role(interaction, [
            "938372143853502494",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "show") {
            const globalBypass_roles_map =
                guildData.giveaway.globalBypass_roles
                    .map((role) => {
                        return `<@&${role}>`;
                    })
                    .join("\n") || "`no global bypass roles`";
            const globalBlacklist_roles_map =
                guildData.giveaway.globalBlacklist_roles
                    .map((role) => {
                        return `<@&${role}>`;
                    })
                    .join("\n") || "`no global blacklist roles`";

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**Giveaway Settings**\n*Here lies all the giveaway settings.*`
                        )
                        .setFields(
                            {
                                name: `Global Bypass Roles`,
                                value: globalBypass_roles_map,
                                inline: true,
                            },
                            {
                                name: `Global Blacklist Roles`,
                                value: globalBlacklist_roles_map,
                                inline: true,
                            }
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "addglobal") {
            const options = {
                category: interaction.options.getString("category"),
                role: interaction.options.getRole("role"),
            };

            if (
                guildData.giveaway[options.category].includes(options.role.id)
            ) {
                error_message = `That role already exists in that category.\n\nCategory: \`${options.category.toLowerCase()}\`\nRole: ${
                    options.role
                }`;
                error_reply(interaction, error_message);
            }

            guildData.giveaway[options.category].push(options.role.id);
            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Add global giveaway property: SUCCESSFUL**\n*I added a global giveaway property for you.*\n\nCategory: \`${options.category.toLowerCase()}\`\nRole: ${
                            options.role
                        }\nTotal Properties in Category: \`${guildData.giveaway[
                            options.category
                        ].length.toLocaleString()}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "removeglobal") {
            const options = {
                category: interaction.options.getString("category"),
                role: interaction.options.getRole("role"),
            };

            if (
                !guildData.giveaway[options.category].includes(options.role.id)
            ) {
                error_message = `That role doesn't exist in that category.\n\nCategory: \`${options.category.toLowerCase()}\`\nRole: ${
                    options.role
                }`;
                error_reply(interaction, error_message);
            }

            guildData.giveaway[options.category].splice(
                guildData.giveaway[options.category].indexOf(options.role.id),
                1
            );

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Remove global giveaway property: SUCCESSFUL**\n*I removed a global giveaway property for you.*\n\nCategory: \`${options.category.toLowerCase()}\`\nRole: ${
                            options.role
                        }\nTotal Properties in Category: \`${guildData.giveaway[
                            options.category
                        ].length.toLocaleString()}\``
                    ),
                ],
            });
        }
    },
};
