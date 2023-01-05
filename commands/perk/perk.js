const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelType,
    PermissionsBitField,
} = require("discord.js");

const UserModel = require("../../models/userSchema");
const PerkchannelModel = require("../../models/perkchannelSchema");
const PerkroleModel = require("../../models/perkroleSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");
const {
    perk_role_fetch,
    perk_channel_fetch,
    perk_slots_max_g,
} = require("../../utils/perk");
const { discord_check_role } = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perk")
        .setDescription("Perk command: default perk commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("status")
                .setDescription("Show your current auto reactions.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Valid user within the server.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("scan")
                .setDescription("Show your current auto reactions.")
        ),

    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        const checkAccess = await discord_check_role(interaction, [
            "938372143853502494",
        ]);

        if (interaction.options.getSubcommand() === "status") {
            const options = {
                user: interaction.options.getMember("user"),
            };

            if (!options.user) {
                error_message = `Not a user in this server.`;
                return error_reply(interaction, error_message);
            }

            userData = await user_fetch(options.user.id);
            const perkroleData = await perk_role_fetch(options.user.id);
            const perkchannelData = await perk_channel_fetch(options.user.id);

            const ar_slots_used = userData.autoReaction.length;
            const ar_slots_max = await perk_slots_max_g(
                interaction,
                options.user.id,
                guildData.perk.autoReaction
            );
            const role_slots_used = perkroleData
                ? perkroleData.users.length
                : 0;
            const role_slots_max = await perk_slots_max_g(
                interaction,
                options.user.id,
                guildData.perk.role
            );
            const channel_slots_used = perkchannelData
                ? perkchannelData.users.length
                : 0;
            const channel_slots_max = await perk_slots_max_g(
                interaction,
                options.user.id,
                guildData.perk.channel
            );

            let ar_display;
            if (ar_slots_used > 0) {
                ar_display = userData.autoReaction
                    .map((ar) => {
                        return ar;
                    })
                    .join(", ");
            }

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: `${options.user.user.tag}`,
                            iconURL: options.user.displayAvatarURL(),
                        })
                        .setTitle(`Perk: Status`)
                        .setFields(
                            {
                                name: "** **",
                                value: `Perkar: \`${ar_slots_used}/${ar_slots_max.slots_max}\`\nPerkrole: \`${role_slots_used}/${role_slots_max.slots_max}\`\nPerkchannel: \`${channel_slots_used}/${channel_slots_max.slots_max}\``,
                                inline: true,
                            },
                            {
                                name: "** **",
                                value: `${
                                    ar_display
                                        ? `${ar_display}\n`
                                        : `\`none\`\n`
                                }${
                                    perkroleData
                                        ? `<@&${perkroleData.roleId}>\n`
                                        : `\`none\`\n`
                                }${
                                    perkchannelData
                                        ? `<#${perkchannelData.channelId}>`
                                        : `\`none\``
                                }`,
                                inline: true,
                            }
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "scan") {
            if (checkAccess === false) {
                error_message = "You don't have the roles to use this command.";
                return error_reply(interaction, error_message);
            }

            const perkchannelsData = await PerkchannelModel.find();
            const perk_scan_message = await interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk scan: IN PROCESS**\n*Scanning, deleting, and updating perk channels...*\n\nChannels Found: \`${perkchannelsData.length}\``
                    ),
                ],
                fetchReply: true,
            });

            const perkchannelsDeleted = [];
            const perkchannelsUpdated = [];
            let perkchannelsDeleted_display;
            if (perkchannelsData.length > 0) {
                for (const perkchannelData of perkchannelsData) {
                    const perkchannel_discordData =
                        interaction.guild.channels.cache.get(
                            perkchannelData.channelId
                        );

                    if (!perkchannel_discordData) {
                        perkchannelsDeleted.push({
                            channelName: perkchannel_discordData.name,
                            userId: perkchannelData.userId,
                        });

                        await PerkchannelModel.deleteOne({
                            channelId: perkchannelData.channelId,
                        });

                        continue;
                    }

                    const slots_max = await perk_slots_max_g(
                        interaction,
                        perkchannelData.userId,
                        guildData.perk.channel
                    );
                    let slots_used = perkchannelData.users.length;

                    if (slots_used > slots_max.slots_max) {
                        perkchannelsUpdated.push({
                            channelId: perkchannelData.channelId,
                            userId: perkchannelData.userId,
                        });

                        const perkchannel_users_flagged =
                            perkchannelData.users.slice(slots_max.slots_max);
                        perkchannelData.users = perkchannelData.users.slice(
                            0,
                            slots_max.slots_max
                        );
                        slots_used = perkchannelData.users.length;

                        for (const user of perkchannel_users_flagged) {
                            await perkchannel_discordData.permissionOverwrites.delete(
                                user
                            );
                            perkchannel_discordData
                                .send({
                                    embeds: [
                                        new EmbedBuilder().setDescription(
                                            `**Remove user from perk channel: COMPLETED**\n*User was over the limit of users in this perk channel.*\n\nChannel: <#${
                                                perkchannelData.channelId
                                            }>\nChannel Id: \`${
                                                perkchannelData.channelId
                                            }\`\nOwner: <@${
                                                perkchannelData.userId
                                            }>\nOccupied Slots: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\``
                                        ),
                                    ],
                                })
                                .catch((error) => {});
                        }

                        await PerkchannelModel.findOneAndUpdate(
                            { userId: interaction.user.id },
                            perkchannelData
                        );
                    }

                    if (slots_max.slots_max === 0) {
                        perkchannelsDeleted.push({
                            channelName: perkchannel_discordData.name,
                            userId: perkchannelData.userId,
                        });

                        await PerkchannelModel.findOneAndDelete({
                            userId: perkchannelData.userId,
                        });

                        interaction.guild.channels.delete(
                            perkchannelData.channelId
                        );
                    }
                }
            }

            const perkrolesData = await PerkroleModel.find();
            perk_scan_message.edit({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk scan: IN PROCESS**\n*Scanning, deleting, and updating perk roles...*\n\nRoles Found: \`${perkrolesData.length}\``
                    ),
                ],
            });

            const perkrolesDeleted = [];
            const perkrolesUpdated = [];
            let perkrolesDeleted_display;
            if (perkrolesData.length > 0) {
                for (const perkroleData of perkrolesData) {
                    const perkrole_discordData =
                        await interaction.guild.roles.fetch(
                            perkroleData.roleId
                        );

                    if (!perkrole_discordData) {
                        perkchannelsDeleted.push({
                            roleName: perkrole_discordData.name,
                            userId: perkroleData.userId,
                        });

                        await PerkchannelModel.deleteOne({
                            roleId: perkroleData.roleId,
                        });

                        continue;
                    }

                    const slots_max = await perk_slots_max_g(
                        interaction,
                        perkroleData.userId,
                        guildData.perk.role
                    );
                    let slots_used = perkroleData.users.length;

                    if (slots_used > slots_max.slots_max) {
                        perkrolesUpdated.push({
                            roleId: perkroleData.roleId,
                            userId: perkroleData.userId,
                        });

                        const perkrole_users_flagged = perkroleData.users.slice(
                            slots_max.slots_max
                        );
                        perkroleData.users = perkroleData.users.slice(
                            0,
                            slots_max.slots_max
                        );
                        slots_used = perkroleData.users.length;

                        for (const userId of perkrole_users_flagged) {
                            const flaggeduser_fetch =
                                await interaction.guild.members.fetch(userId);

                            flaggeduser_fetch.roles
                                .remove(perkroleData.roleId)
                                .catch((error) => {});

                            interaction.user.send({
                                content: `<@${userId}>`,
                                embeds: [
                                    new EmbedBuilder().setDescription(
                                        `**Remove user from perkrole: COMPLETED**\n*User was over the limit of users having this perk role.*\n\nRole: <@&${
                                            perkroleData.roleId
                                        }>\nRole Id: \`${
                                            perkroleData.roleId
                                        }\`\nUser: <@${userId}>\nOccupied Slots: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\``
                                    ),
                                ],
                            });
                        }

                        await PerkroleModel.findOneAndUpdate(
                            { userId: interaction.user.id },
                            perkroleData
                        );
                    }

                    if (slots_max.slots_max === 0) {
                        perkrolesDeleted.push({
                            roleName: perkrole_discordData.name,
                            userId: perkroleData.userId,
                        });

                        await PerkroleModel.findOneAndDelete({
                            userId: perkroleData.userId,
                        });

                        interaction.guild.roles.delete(perkroleData.roleId);
                    }
                }
            }

            if (perkchannelsDeleted.length > 0) {
                perkchannelsDeleted_display = perkchannelsDeleted
                    .map((channelData) => {
                        return `\`-\`<@${channelData.userId}> \`#${channelData.channelName}\``;
                    })
                    .join("\n");
            }

            if (perkrolesDeleted.length > 0) {
                perkrolesDeleted_display = perkrolesDeleted
                    .map((roleData) => {
                        return `\`-\`<@${roleData.userId}> \`@${roleData.roleName}\``;
                    })
                    .join("\n");
            }

            perk_scan_message.edit({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**Perk scan: COMPLETED**\n*I finished scanning, deleting, and updating perk rewards. Here are the results:*`
                        )
                        .setFields(
                            {
                                name: "__Perk Channels__",
                                value: `Channels Found: \`${perkchannelsData.length.toLocaleString()}\`\nPerk-channels Updated: \`${perkchannelsUpdated.length.toLocaleString()}\`\nPerk-channels Deleted: \`${perkchannelsDeleted.length.toLocaleString()}\`${
                                    perkchannelsDeleted_display
                                        ? `\n\n${perkchannelsDeleted_display}`
                                        : ""
                                }`,
                            },
                            {
                                name: "__Perk Roles__",
                                value: `Roles Found: \`${perkrolesData.length.toLocaleString()}\`\nPerk-roles Updated: \`${perkrolesUpdated.length.toLocaleString()}\`\nPerk-roles Deleted: \`${perkrolesDeleted.length.toLocaleString()}\`${
                                    perkrolesDeleted_display
                                        ? `\n\n${perkrolesDeleted_display}`
                                        : ""
                                }`,
                            }
                        ),
                ],
            });
        }
    },
};
