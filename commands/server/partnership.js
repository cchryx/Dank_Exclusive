const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelType,
    PermissionsBitField,
    Message,
} = require("discord.js");

const PchannelModel = require("../../models/pchannelSchema");

const {
    discord_dissect_roles,
    discord_check_role,
} = require("../../utils/discord");
const { error_reply } = require("../../utils/error");
const { guild_fetch } = require("../../utils/guild");
const { time_format } = require("../../utils/time");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("partnership")
        .setDescription("Partnership related commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("log")
                .setDescription("Log an event partnership.")
                .addStringOption((oi) => {
                    return oi
                        .setName("serverinvite")
                        .setDescription("Partnership server invite (infinite).")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("serverid")
                        .setDescription("Partnership server ID.")
                        .setRequired(true);
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription(
                            "User that will help with claiming our side of the partnership."
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("ouroffer")
                        .setDescription(
                            "Our partnership offer (include total reach and other details like if there is top channel or not)."
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("partneroffer")
                        .setDescription(
                            "Their partnership offer (include total reach and other details like if there is top channel or not)."
                        )
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("createchannel")
                .setDescription("Create a channel for channel partnerships.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Other server partnership manager.")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("channelname")
                        .setDescription("Name of channel.")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("time")
                        .setDescription(
                            "Time till the channel will auto delete."
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("mentions")
                        .setDescription(
                            "Mentions that go along with the advertisement."
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("unhidden")
                        .setDescription(
                            "Will this channel be visible to everyone in the server."
                        )
                        .setRequired(true)
                        .addChoices(
                            { name: "True", value: "true" },
                            { name: "False", value: "false" }
                        );
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("claimmention")
                .setDescription(
                    "Claim the mention for this partnership channel."
                )
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);

        const checkAccess = await discord_check_role(interaction, [
            "920839776322609183",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "log") {
            const options = {
                serverinvite: interaction.options.getString("serverinvite"),
                serverid: interaction.options.getString("serverid"),
                user: interaction.options.getUser("user"),
                ouroffer: interaction.options.getString("ouroffer"),
                partneroffer: interaction.options.getString("partneroffer"),
            };

            const partnership_log_msg = await client.channels.cache
                .get("961728822208778260")
                .send({
                    content: `**Server Invite:** ${options.serverinvite}`,
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Server Id:** \`${options.serverid}\`\n**Their Partnership Manager:** ${options.user}\n**Log Issued By:** ${interaction.user}\n\n__**Offers:**__\nOur Offer: \`${options.ouroffer}\`\nTheir Offer: \`${options.partneroffer}\`\n\nRemove respective reaction if offer is used up:\n<:mainpoint_fallblossom:1016418438194933870> - US\n<:mainpoint_summer:1004211052612944014> - THEM`
                        ),
                    ],
                });

            partnership_log_msg.react(
                "<:mainpoint_fallblossom:1016418438194933870>"
            );
            partnership_log_msg.react(
                "<:mainpoint_summer:1004211052612944014>"
            );

            return interaction.reply({
                content:
                    "<a:ravena_check:1002981211708325950> Successfully logged to <#961728822208778260>.",
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "createchannel") {
            const options = {
                user: interaction.options.getMember("user"),
                time: interaction.options.getString("time"),
                mentions: interaction.options.getString("mentions"),
                channelname: interaction.options.getString("channelname"),
                unhidden: interaction.options.getString("unhidden"),
            };

            if (!options.user) {
                error_message = `That user is not in this server.`;
                return error_reply(interaction, error_message);
            }

            // handle duration
            const timeData = await time_format(interaction, options.time);
            if (timeData.status === false) {
                return;
            }

            // handle mentions
            const mentionsData = await discord_dissect_roles(
                interaction,
                options.mentions
            );
            if (mentionsData.length <= 0) {
                error_message = `Couldn't find any mentioning of roles.`;
                return error_reply(interaction, error_message);
            }

            const partnership_channel_information = {};
            partnership_channel_information.name = options.channelname;
            partnership_channel_information.parent =
                guildData.miscData.categories.partnershipChannel || null;
            partnership_channel_information.type = ChannelType.GuildText;
            partnership_channel_information.permissionOverwrites = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: options.user.id,
                    allow: [
                        PermissionsBitField.Flags.SendMessages,
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

            if (
                options.unhidden === "false" &&
                guildData.miscData.roles.noPartnership
            ) {
                console.log(true);
                partnership_channel_information.permissionOverwrites.push({
                    id: guildData.miscData.roles.noPartnership,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                });
            }

            const partnership_channel_discordData =
                await interaction.guild.channels
                    .create(partnership_channel_information)
                    .catch((error) => {
                        error_message = `${error.rawError.message}`;
                        error_reply(interaction, error_message);
                        return false;
                    });

            if (partnership_channel_discordData === false) return;

            partnership_channel_discordData.send({
                content: `${options.user}`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${options.channelname}`)
                        .setDescription(
                            `**Create partnership channel: SUCCESSFUL**\n\nClaim Mentions: </partnership claimmention:1060990423541235823>\nChannel Issued By: ${
                                interaction.user
                            }\nChannel Expires: <t:${Math.floor(
                                timeData.endTime / 1000
                            )}:R> <t:${Math.floor(
                                timeData.endTime / 1000
                            )}:D>\nMentions: ${
                                mentionsData.mapString
                            }\n\n*You can only use the mention command once, so use it when you are mentioning.*\n*Channel will auto delete after timer ends.*\n*Feel free to post your ad.*`
                        ),
                ],
            });

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${options.channelname}`)
                        .setDescription(
                            `**Create partnership channel: SUCCESSFUL**\n\nChannel Expires: <t:${Math.floor(
                                timeData.endTime / 1000
                            )}:R> <t:${Math.floor(
                                timeData.endTime / 1000
                            )}:D>\nPartnership Manager: ${
                                options.user
                            }\nMentions: ${
                                mentionsData.mapString
                            }\nUnhidden: \`${options.unhidden}\`\nChannel: <#${
                                partnership_channel_discordData.id
                            }>`
                        ),
                ],
            });

            if (guildData.miscData.roles.heistPartner) {
                interaction.guild.members.cache
                    .get(options.user.id)
                    .roles.add(guildData.miscData.roles.heistPartner);
            }

            return PchannelModel.create({
                channelId: partnership_channel_discordData.id,
                ownerId: options.user.id,
                expiresAt: timeData.endTime,
                mentions: mentionsData.mapString,
            });
        } else if (interaction.options.getSubcommand() === "claimmention") {
            const pchannelData = await PchannelModel.findOne({
                channelId: interaction.channelId,
            });

            if (!pchannelData) {
                error_message = `This channel isn't registered as a partnership channel.`;
                return error_reply(interaction, error_message);
            }

            if (pchannelData.mentionUsed === true) {
                error_message = `This channel already used their mention.\nIf this is an error contact bot developer or an admin.`;
                return error_reply(interaction, error_message);
            }

            interaction.reply({
                content: "Mentioning Below...",
                ephemeral: true,
            });
            interaction.channel.send({
                content: `${pchannelData.mentions}\nCheck out this server we've just partnered with!\n*This is an event partnership, __we are not otherwise affiliated with this server__*`,
            });

            pchannelData.mentionUsed = true;
            return await PchannelModel.findOneAndUpdate(
                {
                    channelId: pchannelData.channelId,
                },
                pchannelData
            );
        }
    },
};
