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

const PerkchannelModel = require("../../models/perk/perkchannelSchema");

const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");
const {
    perk_channel_fetch,
    perk_slots_max,
    perk_channel_create,
} = require("../../utils/perk");
const { discord_check_role } = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkchannel")
        .setDescription(
            "Perk command: create a perk channel and add/remove users to or from it."
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your perk channel information.")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("sync")
                .setDescription("Sync your permissions to your perk channel.")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("userremove")
                .setDescription(
                    "Choose a user to remove from your perk channel."
                )
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription(
                            "Valid user within the server or id for a user that has left the server."
                        )
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("useradd")
                .setDescription("Choose a user to add to your perk channel.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Valid user within the server.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a perk channel.")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription("Valid channel name.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit perk channel.")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription("Valid channel name.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("selfremove")
                .setDescription("Remove a perk channel from yourself.")
                .addChannelOption((oi) => {
                    return oi
                        .setName("channel")
                        .setDescription("Valid perk channel you are in.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("revoke")
                .setDescription("Delete a perk channel.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Valid perk channel owner.");
                })
                .addChannelOption((oi) => {
                    return oi
                        .setName("channel")
                        .setDescription("Valid perk channel.");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("purge")
                .setDescription("Delete all inactive perk channel.")
        ),

    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        let perkchannelData = await perk_channel_fetch(interaction.user.id);
        const slots_max = await perk_slots_max(
            interaction,
            guildData.perk.channel
        );
        let perkchannel_discordData;
        let slots_used = 0;
        let slots_used_display;

        if (perkchannelData) {
            perkchannel_discordData = interaction.guild.channels.cache.get(
                perkchannelData.channelId
            );

            if (slots_max.slots_max === 0) {
                await PerkchannelModel.findOneAndDelete({
                    userId: perkchannelData.userId,
                });

                interaction.guild.channels.delete(perkchannelData.channelId);
            }

            slots_used = perkchannelData.users.length;

            if (slots_max.slots_max > 80) {
                slots_max.slots_max = 80;
            }

            if (slots_used > slots_max.slots_max) {
                const perkchannel_users_flagged = perkchannelData.users.slice(
                    slots_max.slots_max
                );
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
                            content: `<@${user}>`,
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
                slots_used = perkchannelData.users.length;
            }

            if (slots_used === 0) {
                slots_used_display = `\`No slots used\``;
            } else {
                slots_used_display = perkchannelData.users
                    .map((userId) => {
                        return `<@${userId}>`;
                    })
                    .join(", ");
            }
        }

        if (interaction.options.getSubcommand() === "create") {
            if (perkchannelData) {
                error_message = `You already own a perk channel, you can't create another one!\n\nChannel: <#${perkchannelData.channelId}>`;
                return error_reply(interaction, error_message);
            }

            if (slots_max.slots_max === 0) {
                error_message = `You don't have any perk channel slots to create a perk channel.`;
                return error_reply(interaction, error_message);
            }

            if (!guildData.perk.placement.channelCategory) {
                error_message = `Server has not set a channel category to place perk channels in.`;
                return error_reply(interaction, error_message);
            }

            const options = {
                name: interaction.options.getString("name"),
            };

            const perkchannel_information = {};
            perkchannel_information.name = options.name;
            perkchannel_information.parent =
                guildData.perk.placement.channelCategory;
            perkchannel_information.type = ChannelType.GuildText;
            perkchannel_information.permissionOverwrites = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.UseApplicationCommands,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.UseExternalEmojis,
                        PermissionsBitField.Flags.UseExternalStickers,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
            ];

            if (guildData.miscData.roles.bots) {
                perkchannel_information.permissionOverwrites.push({
                    id: guildData.miscData.roles.bots,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.UseApplicationCommands,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.UseExternalEmojis,
                        PermissionsBitField.Flags.UseExternalStickers,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                });
            }

            perkchannel_discordData = await interaction.guild.channels
                .create(perkchannel_information)
                .catch((error) => {
                    error_message = `${error.rawError.message}`;
                    error_reply(interaction, error_message);
                    return null;
                });

            if (perkchannel_discordData === null) return;

            slots_used = 0;

            perkchannel_discordData.send({
                content: `<@${interaction.user.id}>`,
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Create perk channel: SUCCESSFUL**\n*I have made a perk channel for you! Enjoy it!*\n\nChannel: <#${
                            perkchannel_discordData.id
                        }>\nChannel Id: \`${
                            perkchannel_discordData.id
                        }\`\nOccupied Slots: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\``
                    ),
                ],
            });

            await perk_channel_create(
                interaction.user.id,
                perkchannel_discordData.id
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Create perk channel: SUCCESSFUL**\n*I have made a perk channel for you! Enjoy it!*\n\nChannel: <#${
                            perkchannel_discordData.id
                        }>\nChannel Id: \`${
                            perkchannel_discordData.id
                        }\`\nOccupied Slots: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "show") {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Perk: Channel`)
                        .setDescription(
                            `*Slots is the number of users you are permitted to add to your perk channel in accordance to the roles you have.*\n\nPerk Channel: ${
                                perkchannelData
                                    ? `<#${perkchannelData.channelId}>`
                                    : "`null`"
                            }\nSlots Occupied: \`${slots_used}/${
                                slots_max.slots_max
                            }\``
                        )
                        .setFields(
                            {
                                name: "Perk-channel Roles ↭",
                                value: slots_max.slots_hasroles_display,
                                inline: true,
                            },
                            {
                                name: "Occupied Slots ↭",
                                value: `${
                                    slots_used_display
                                        ? slots_used_display
                                        : `\`You don't own a perk channel\``
                                }`,
                                inline: true,
                            }
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "edit") {
            if (!perkchannelData) {
                error_message = `You don't own a perk channel, therefore you cannot edit its name.`;
                return error_reply(interaction, error_message);
            }

            const options = {
                name: interaction.options.getString("name"),
            };

            perkchannel_discordData.setName(options.name);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Update perk channel: SUCCESSFUL**\n*I updated the name of you perk channel.*\n\nPerk Channel: <#${perkchannel_discordData.id}>`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "useradd") {
            if (!perkchannelData) {
                error_message = `You don't own a perk channel, therefore you cannot add it to users.`;
                return error_reply(interaction, error_message);
            }

            if (slots_used >= slots_max.slots_max) {
                error_message = `You have reached the maximum slots for your perk channel, therefore you cannot add any more users.\n\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                user: interaction.options.getMember("user"),
            };

            if (!options.user) {
                error_message = `That user doesn't exist in the server.`;
                return error_reply(interaction, error_message);
            }

            if (options.user.user.bot === true) {
                error_message = `Bot permissions for this perk channel is defaulted.`;
                return error_reply(interaction, error_message);
            }

            if (options.user.id === interaction.user.id) {
                error_message = `You own the channel so why give to yourself?`;
                return error_reply(interaction, error_message);
            }

            if (perkchannelData.users.includes(options.user.id)) {
                error_message = `That user already exist in one of your perk channel user slosts!\n\nUser: ${options.user}`;
                return error_reply(interaction, error_message);
            }

            perkchannelData.users.push(options.user.id);
            slots_used = perkchannelData.users.length;
            perkchannel_discordData =
                await perkchannel_discordData.permissionOverwrites
                    .edit(options.user.id, {
                        ViewChannel: true,
                        ReadMessageHistory: true,
                        UseApplicationCommands: true,
                        EmbedLinks: true,
                        AttachFiles: true,
                        UseExternalEmojis: true,
                        AddReactions: true,
                    })
                    .catch((error) => {
                        console.log(error);
                        error_message = `${error.rawError.message}`;
                        error_reply(interaction, error_message);
                        return null;
                    });

            if (perkchannel_discordData === null) return;

            await PerkchannelModel.findOneAndUpdate(
                { userId: interaction.user.id },
                perkchannelData
            );

            perkchannel_discordData.send({
                content: `${options.user}`,
                embeds: [
                    new EmbedBuilder().setDescription(
                        `*You have been invited to this perk channel.*\n\nChannel: <#${perkchannel_discordData.id}>\nChannel Id: \`${perkchannel_discordData.id}\`\nOwner: <@${interaction.user.id}>\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk channel add user: SUCCESSFUL**\n*I added that user to your perk channel for you.*\n\nUser: ${options.user}\nChannel: <#${perkchannel_discordData.id}>\nChannel Id: \`${perkchannel_discordData.id}\`\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "userremove") {
            if (!perkchannelData) {
                error_message = `You don't own a perk channel, therefore you cannot remove it from users.`;
                return error_reply(interaction, error_message);
            }

            if (perkchannelData.users.length <= 0) {
                error_message = `You have no users occupying your perk channel slots, therefore you can't remove any users from you perk channel. Imagine being lonely.`;
                return error_reply(interaction, error_message);
            }

            const options = {
                user: interaction.options.getUser("user"),
            };

            if (!perkchannelData.users.includes(options.user.id)) {
                error_message = `That user doesn't exist in one of your perk channel user slots!\n\nUser: ${options.user}`;
                return error_reply(interaction, error_message);
            }

            if (options.user.id === interaction.user.id) {
                error_message = `Thats your own perk channel so you can't remove yourself!`;
                return error_reply(interaction, error_message);
            }

            perkchannel_discordData =
                await perkchannel_discordData.permissionOverwrites
                    .delete(options.user)
                    .catch((error) => {
                        error_message = `${error.rawError.message}`;
                        error_reply(interaction, error_message);
                        return null;
                    });

            if (perkchannel_discordData === null) return;

            perkchannelData.users.splice(
                perkchannelData.users.indexOf(options.user.id),
                1
            );

            await PerkchannelModel.findOneAndUpdate(
                { userId: interaction.user.id },
                perkchannelData
            );

            slots_used = perkchannelData.users.length;

            perkchannel_discordData.send({
                content: `${options.user}`,
                embeds: [
                    new EmbedBuilder().setDescription(
                        `*User has been removed from this perk channel.*\n\nChannel: <#${perkchannel_discordData.id}>\nChannel Id: \`${perkchannel_discordData.id}\`\nOwner: <@${interaction.user.id}>\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk channel remove user: SUCCESSFUL**\n*I removed that user from your perk channel for you.*\n\nUser: ${options.user}\nChannel: <#${perkchannel_discordData.id}>\nChannel Id: \`${perkchannel_discordData.id}\`\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "selfremove") {
            options = {
                channel: interaction.options.getChannel("channel"),
            };

            perkchannelData = await PerkchannelModel.findOne({
                channelId: options.channel.id,
            });

            if (!perkchannelData) {
                error_message = `This channel is not registered as a perk channel, if you believe this is a mistake please direct message the bot developer.`;
                return error_reply(interaction, error_message);
            }

            if (perkchannelData.userId === interaction.user.id) {
                error_message = `Thats your own perk channel so you can't remove yourself!`;
                return error_reply(interaction, error_message);
            }

            if (!perkchannelData.users.includes(interaction.user.id)) {
                error_message = `You do not have access to this channel, therefore you cannot remove yourself from it.`;
                return error_reply(interaction, error_message);
            }

            perkchannel_discordData = interaction.guild.channels.cache.get(
                perkchannelData.channelId
            );

            perkchannel_discordData =
                await perkchannel_discordData.permissionOverwrites
                    .delete(interaction.user.id)
                    .catch((error) => {
                        error_message = `${error.rawError.message}`;
                        error_reply(interaction, error_message);
                        return null;
                    });

            if (perkchannel_discordData === null) return;

            perkchannelData.users.splice(
                perkchannelData.users.indexOf(interaction.user.id),
                1
            );

            await perkchannelData.findOneAndUpdate(
                { channelId: perkchannelData.channelId },
                perkchannelData
            );

            slots_used = perkchannelData.users.length;

            perkchannel_discordData.send({
                content: `${options.user}`,
                embeds: [
                    new EmbedBuilder().setDescription(
                        `*User has left this perk channel.*\n\nChannel: <#${perkchannel_discordData.id}>\nChannel Id: \`${perkchannel_discordData.id}\`\nOwner: <@${interaction.user.id}>\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk channel self remove: SUCCESSFUL**\n*I removed you from that perk channel.*\n\n\nChannel: <#${perkchannel_discordData.id}>\nChannel Id: \`${perkchannel_discordData.id}\`\nOwner: <@${perkchannelData.user}>`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "sync") {
            if (!perkchannelData) {
                error_message = `You don't own a perk channel, therefore you cannot user this command.`;
                return error_reply(interaction, error_message);
            }

            perkchannel_discordData =
                await perkchannel_discordData.permissionOverwrites
                    .edit(interaction.user.id, {
                        ViewChannel: true,
                        ReadMessageHistory: true,
                        UseApplicationCommands: true,
                        EmbedLinks: true,
                        AttachFiles: true,
                        UseExternalEmojis: true,
                        UseExternalStickers: true,
                        AddReactions: true,
                    })
                    .catch((error) => {
                        error_message = `${error.rawError.message}`;
                        error_reply(interaction, error_message);
                        return false;
                    });

            if (perkchannel_discordData === false) return;

            perkchannelData.users.forEach(async (userId) => {
                await perkchannel_discordData.permissionOverwrites
                    .edit(userId, {
                        ViewChannel: true,
                        ReadMessageHistory: true,
                        UseApplicationCommands: true,
                        EmbedLinks: true,
                        AttachFiles: true,
                        UseExternalEmojis: true,
                        UseExternalStickers: true,
                        AddReactions: true,
                    })
                    .catch((error) => {});
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Sync perk channel permissions: SUCCESSFUL**\n*I synced your perk channel permissions according what is stored.*\n\nChannel: <#${perkchannel_discordData.id}>\nChannel Id: \`${perkchannel_discordData.id}\`\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "revoke") {
            const checkAccess = await discord_check_role(interaction, [
                "938372143853502494",
            ]);
            if (checkAccess === false) {
                error_message = "You don't have the roles to use this command.";
                return error_reply(interaction, error_message);
            }

            options = {
                user: interaction.options.getUser("user"),
                channel: interaction.options.getChannel("channel"),
            };

            if (!options.user && !options.channel) {
                error_message = "Provide at least a channel or channel owner.";
                return error_reply(interaction, error_message);
            }

            const perkchannelData_target = options.user
                ? await perk_channel_fetch(options.user.id)
                : await PerkchannelModel.findOne({
                      channelId: options.channel.id,
                  });

            if (!perkchannelData_target) {
                error_message = "Couldn't find perk channel.";
                return error_reply(interaction, error_message);
            }

            perkchannel_discordData = interaction.guild.channels.cache.get(
                perkchannelData_target.channelId
            );

            await PerkchannelModel.findOneAndDelete({
                channelId: perkchannelData_target.channelId,
            });

            if (!perkchannel_discordData) {
                error_message =
                    "That channel no longer exists in the server. I deleted it from the database.";

                return error_reply(interaction, error);
            }

            await interaction.guild.channels.delete(
                perkchannelData_target.channelId
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Delete perk channel: SUCCESSFUL**\n*I have deleted that perk channel for you and is cleared from database.*\n\nOwner: <@${perkchannelData_target.userId}>\nChannel: <#${perkchannelData_target.channelId}> \`${perkchannelData_target.channelId}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "purge") {
            const perkchannelDatas = await PerkchannelModel.find();
            const message_discordData = await interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Purge perk-channels: PROCESSING**\n*Deleting inactive channels...*\n*Requirement: the 100th most recent message is within 14 days*\n\nChannels Found: \`${perkchannelDatas.length.toLocaleString()}\``
                    ),
                ],
                fetchReply: true,
            });
            const perkchannelDatas_flagged = [];

            for (let i = 0; i < perkchannelDatas.length; i++) {
                perkchannelData = perkchannelDatas[i];
                perkchannel_discordData = interaction.guild.channels.cache.get(
                    perkchannelData.channelId
                );

                if (!perkchannel_discordData) {
                    await PerkchannelModel.findOneAndDelete({
                        channelId: perkchannelData.channelId,
                    });
                    continue;
                }

                if (perkchannel_discordData.parentId === "1007061047913488425")
                    continue;

                const messages_discordData =
                    await perkchannel_discordData.messages.fetch({
                        limit: 100,
                    });
                const messages_discordData_last = messages_discordData.last();

                if (
                    Date.now() - messages_discordData_last.createdTimestamp >
                    1209600000
                ) {
                    perkchannelData.channelName = perkchannel_discordData.name;
                    perkchannelDatas_flagged.push(perkchannelData);
                }

                if (
                    i === 0 ||
                    i + 1 === perkchannelDatas.length ||
                    i % 5 === 0
                ) {
                    await interaction.guild.channels.delete(
                        perkchannelData.channelId
                    );

                    await PerkchannelModel.findOneAndDelete({
                        channelId: perkchannelData.channelId,
                    });

                    await message_discordData.edit({
                        embeds: [
                            new EmbedBuilder().setDescription(
                                `**Purge perk-channels: PROCESSING**\n*Deleting inactive channels...*\n*Requirement: the 100th most recent message is within 14 days*\n\nChannels Found: \`${perkchannelDatas.length.toLocaleString()}\`\nChannels Proccessed: \`${
                                    i + 1
                                }\``
                            ),
                        ],
                    });
                }
            }

            await message_discordData.edit({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Purge perk-channels: SUCCESSFUL**\n*Deleting inactive channels...*\n*Requirement: the 100th most recent message is within 14 days*\n\nChannels Found: \`${perkchannelDatas.length.toLocaleString()}\`\nChannels Proccessed: \`${perkchannelDatas.length.toLocaleString()}\`\nChannels Deleted: \`${
                            perkchannelDatas_flagged.length
                        }\`\n\n${perkchannelDatas_flagged
                            .map((d) => {
                                return `\`-\`<@${d.userId}> \`#${d.channelName}\``;
                            })
                            .join("\n")}`
                    ),
                ],
            });
        }
    },
};
