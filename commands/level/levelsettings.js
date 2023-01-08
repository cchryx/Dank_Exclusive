const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, Embed } = require("discord.js");

const GuildModel = require("../../models/guildSchema");

const { discord_check_role } = require("../../utils/discord");
const { error_reply } = require("../../utils/error");
const { guild_fetch } = require("../../utils/guild");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("levelsettings")
        .setDescription("Server level settings.")
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("multiplierset")
                .setDescription(
                    "Set a experience multiplier to a channel or role."
                )
                .addNumberOption((oi) => {
                    return oi
                        .setName("value")
                        .setDescription("Specify an positive interger.")
                        .setRequired(true);
                })
                .addChannelOption((oi) => {
                    return oi
                        .setName("channel")
                        .setDescription("Specify a channel.");
                })
                .addRoleOption((oi) => {
                    return oi.setName("role").setDescription("Specify a role.");
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("multiplierremove")
                .setDescription(
                    "Remove a experience multiplier to a channel or role."
                )
                .addChannelOption((oi) => {
                    return oi
                        .setName("channel")
                        .setDescription("Specify a channel.");
                })
                .addRoleOption((oi) => {
                    return oi.setName("role").setDescription("Specify a role.");
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("multipliershow")
                .setDescription("Show experience multipliers.");
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("roleset")
                .setDescription("Set a level auto-role to a level.")
                .addNumberOption((oi) => {
                    return oi
                        .setName("level")
                        .setDescription("Specify an positive interger.")
                        .setRequired(true);
                })
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Specify a role.")
                        .setRequired(true);
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("roleremove")
                .setDescription("Remove a level auto-role.")
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Specify a role.")
                        .setRequired(true);
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("roleshow")
                .setDescription("Show all level auto-roles.");
        }),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        const checkAccess = await discord_check_role(interaction, [
            "938372143853502494",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "multiplierset") {
            const multiplierset_changes = {};
            let multiplierset_changes_map;
            const options = {
                value: interaction.options.getNumber("value"),
                channel: interaction.options.getChannel("channel"),
                role: interaction.options.getRole("role"),
            };

            if (!options.channel && !options.role) {
                error_message =
                    "You need to specify at least one channel or role to add a multiplier to.";
                return error_reply(interaction, error_message);
            }

            options.value = Math.floor(options.value);
            if (options.value < 1) {
                options.value *= -1;
            }

            if (options.channel) {
                guildData.level.multipliers.channel[options.channel.id] =
                    options.value;

                multiplierset_changes.channel = options.channel.id;
            }

            if (options.role) {
                guildData.level.multipliers.role[options.role.id] =
                    options.value;

                multiplierset_changes.role = options.role.id;
            }

            multiplierset_changes_map = Object.keys(multiplierset_changes)
                .map((element) => {
                    if (element === "channel") {
                        return `Channel: <#${multiplierset_changes[element]}>`;
                    } else if (element === "role") {
                        return `Role: <@&${multiplierset_changes[element]}>`;
                    } else {
                        return;
                    }
                })
                .filter(Boolean)
                .join("\n");

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Set experience multipliers: SUCCESSFUL**\n*I finished setting new experience multipliers.*\n\nMultiplier: \`x ${options.value.toLocaleString()}\`\n${multiplierset_changes_map}`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "multipliershow") {
            const multiplier_roles = guildData.level.multipliers.role;
            const multiplier_channels = guildData.level.multipliers.channel;
            let multiplier_roles_map = Object.keys(multiplier_roles).map(
                (role) => {
                    return `\`x ${multiplier_roles[
                        role
                    ].toLocaleString()}\` <@&${role}>`;
                }
            );
            let multiplier_channels_map = Object.keys(multiplier_channels).map(
                (channel) => {
                    return `\`x ${multiplier_channels[
                        channel
                    ].toLocaleString()}\` <#${channel}>`;
                }
            );

            if (multiplier_roles_map.length > 0) {
                multiplier_roles_map = multiplier_roles_map.join("\n");
            } else {
                multiplier_roles_map = `\`no role multipliers\``;
            }

            if (multiplier_channels_map.length > 0) {
                multiplier_channels_map = multiplier_channels_map.join("\n");
            } else {
                multiplier_channels_map = `\`no channel multipliers\``;
            }

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**Experience Multipliers**`)
                        .setFields(
                            {
                                name: `Roles`,
                                value: multiplier_roles_map,
                                inline: true,
                            },
                            {
                                name: "Channels",
                                value: multiplier_channels_map,
                                inline: true,
                            }
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "multiplierremove") {
            const multiplierremove_changes = {};
            let multiplierremove_changes_map;
            const options = {
                channel: interaction.options.getChannel("channel"),
                role: interaction.options.getRole("role"),
            };

            if (!options.channel && !options.role) {
                error_message =
                    "You need to specify at least one channel or role to remove a multiplier from.";
                return error_reply(interaction, error_message);
            }

            if (options.channel) {
                if (!guildData.level.multipliers.channel[options.channel.id]) {
                    error_message = `${options.channel} doesn't have a multiplier.`;
                    return error_reply(interaction, error_message);
                }
                delete guildData.level.multipliers.channel[options.channel.id];
                multiplierremove_changes.channel = options.channel.id;
            }

            if (options.role) {
                if (!guildData.level.multipliers.role[options.role.id]) {
                    error_message = `${options.role} doesn't have a multiplier.`;
                    return error_reply(interaction, error_message);
                }
                delete guildData.level.multipliers.role[options.role.id];
                multiplierremove_changes.role = options.role.id;
            }

            multiplierremove_changes_map = Object.keys(multiplierremove_changes)
                .map((element) => {
                    if (element === "channel") {
                        return `Channel: <#${multiplierremove_changes[element]}>`;
                    } else if (element === "role") {
                        return `Role: <@&${multiplierremove_changes[element]}>`;
                    } else {
                        return;
                    }
                })
                .filter(Boolean)
                .join("\n");

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Remove experience multipliers: SUCCESSFUL**\n*I finished removing these experience multipliers.*\n\n${multiplierremove_changes_map}`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "roleset") {
            const options = {
                level: interaction.options.getNumber("level"),
                role: interaction.options.getRole("role"),
            };

            options.level = Math.floor(options.level);
            if (options.level < 1) {
                options.level *= -1;
            }

            guildData.level.roles[options.role.id] = options.level;

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Set level auto-role: SUCCESSFUL**\n*I set an auto-role to that level.*\n\nAuto-role: \`level ${options.level.toLocaleString()}\` ${
                            options.role
                        }`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "roleremove") {
            const options = {
                role: interaction.options.getRole("role"),
            };

            if (!guildData.level.roles.hasOwnProperty(options.role.id)) {
                error_message = `The role specified isn't an already existing level auto-role.\n\nRole: ${options.role}`;
                return error_reply(interaction, error_message);
            }

            delete guildData.level.roles[options.role.id];

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Remove level auto-role: SUCCESSFUL**\n*I removed a level auto-role.*\n\nAuto-role: ${options.role}`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "roleshow") {
            roleshow_map = Object.keys(guildData.level.roles)
                .map((roleId) => {
                    return `\`${guildData.level.roles[roleId]}\` <@&${roleId}>`;
                })
                .join("\n");

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Level Auto-roles**\n*Here lies all of the set level auto-role for ${
                            interaction.guild.name
                        }.*\n\n${
                            roleshow_map
                                ? roleshow_map
                                : "`no level auto-roles`"
                        }`
                    ),
                ],
            });
        }
    },
};
