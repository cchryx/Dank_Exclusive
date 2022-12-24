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

const PartnershipChannelModel = require("../../models/partnershipChannel");
const { guild_checkperm_mod } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");
const { roles_dissect } = require("../../utils/utils");

const ms = require("better-ms");
const humanizeDuration = require("humanize-duration");
const humantime = humanizeDuration.humanizer({
    language: "shortEn",
    delimiter: " ",
    spacer: "",
    languages: {
        shortEn: {
            y: () => "y",
            mo: () => "mo",
            w: () => "w",
            d: () => "d",
            h: () => "h",
            m: () => "m",
            s: () => "s",
            ms: () => "ms",
        },
    },
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName("partnership")
        .setDescription("Partnership related commands")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("log")
                .setDescription("Ping and start an event")
                .addStringOption((oi) => {
                    return oi
                        .setName("serverinvite")
                        .setDescription("Partnership server invite (infinite)")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("serverid")
                        .setDescription("Partnership server id")
                        .setRequired(true);
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription(
                            "User that will help with claiming our side of the partnership"
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("ouroffer")
                        .setDescription(
                            "Our partnership offer (include total reach and other details like if there is top channel or not)"
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("partneroffer")
                        .setDescription(
                            "Their partnership offer (include total reach and other details like if there is top channel or not)"
                        )
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("createchannel")
                .setDescription("Create a channel for channel partners")
                .addUserOption((oi) => {
                    return oi
                        .setName("partnermanager")
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
                        .setDescription("Mentions for posting ad.")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("unhidden")
                        .setDescription(
                            "Will is be visible to everyone in the server."
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
                    "Claim the mention for this partnership channel"
                )
        ),
    cooldown: 10,
    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === "log") {
            if (
                !interaction.member.roles.cache.has("920839776322609183") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                serverinvite: interaction.options.getString("serverinvite"),
                serverid: interaction.options.getString("serverid"),
                user: interaction.options.getUser("user"),
                ouroffer: interaction.options.getString("ouroffer"),
                partneroffer: interaction.options.getString("partneroffer"),
            };

            const partnershiplog_msg = await client.channels.cache
                .get("961728822208778260")
                .send({
                    content: `**Server Invite:** ${options.serverinvite}`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#FAFFFC")
                            .setDescription(
                                `**Server Id:** \`${options.serverid}\`\n**Their Partnership Manager:** ${options.user}\n**Log Issued By:** ${interaction.user}\n\n__**Offers:**__\nOur Offer: \`${options.ouroffer}\`\nTheir Offer: \`${options.partneroffer}\`\n\nRemove respective reaction if offer is used up:\n<:mainpoint_fallblossom:1016418438194933870> - US\n<:mainpoint_summer:1004211052612944014> - THEM`
                            ),
                    ],
                });

            partnershiplog_msg.react(
                "<:mainpoint_fallblossom:1016418438194933870>"
            );
            partnershiplog_msg.react("<:mainpoint_summer:1004211052612944014>");

            interaction.reply({
                content:
                    "<a:ravena_check:1002981211708325950> Successfully logged to <#961728822208778260>",
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "createchannel") {
            if (
                !interaction.member.roles.cache.has("920839776322609183") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                partnermanager: interaction.options.getMember("partnermanager"),
                time: interaction.options.getString("time"),
                mentions: interaction.options.getString("mentions"),
                channelname: interaction.options.getString("channelname"),
                unhidden: interaction.options.getString("unhidden"),
            };

            if (!options.partnermanager) {
                error_message = `\`That use is not in this server\``;
                return error_reply(interaction, error_message);
            }

            const etime = `time: ` + options.time;
            const timeargs = etime.split(" ");
            timeargs.shift();
            const time = ms.getMilliseconds(timeargs[0]);
            if (!time) {
                message = `\`Couldn't parse ${timeargs[0]}\nExample: 1d1h12m\``;
                return error_reply(interaction, message);
            }
            if (time < 1000) {
                message = `\`Minimum timer is 1s\``;
                return error_reply(interaction, message);
            }
            const expiretime = Date.now() + time;
            const mentions = await roles_dissect(interaction, options.mentions);

            if (!mentions) {
                error_message = `\`Couldn't find any mentioning of roles\``;
                return error_reply(interaction, error_message);
            }

            const channelinfo = {};
            channelinfo.name = options.channelname;
            channelinfo.parent = "920519695487090759";
            channelinfo.type = ChannelType.GuildText;
            const permissionoverwrites = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: options.partnermanager,
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

            if (options.unhidden === "false") {
                permissionoverwrites.push({
                    id: "920490576904851457",
                    deny: [PermissionsBitField.Flags.ViewChannel],
                });
            }

            channelinfo.permissionOverwrites = permissionoverwrites;

            const channelcreated = await interaction.guild.channels
                .create(channelinfo)
                .catch((error) => {
                    error_message = `\`${error.rawError.message}\``;
                    error_reply(interaction, error_message);
                    return false;
                });

            if (channelcreated === false) return;

            channelcreated.send({
                content: `${options.partnermanager}`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${options.channelname}`)
                        .setDescription(
                            `**Partnership channel has been created!**\n\n**Claim Mentions:** </partnership claimmention:1023475945056772152>\n**Channel Expires:** <t:${Math.floor(
                                expiretime / 1000
                            )}:R> <t:${Math.floor(
                                expiretime / 1000
                            )}:D>\n**Mentions:** ${
                                mentions.mapstring
                            }\n\n*You can only mention once, so use it when you are mentioning.*\n*Channel will auto delete after timer ends.*\n*Feel free to post your ad.*`
                        ),
                ],
            });

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${options.channelname}`)
                        .setDescription(
                            `**Partnership channel has been created!**\n\n**Channel Expires:** <t:${Math.floor(
                                expiretime / 1000
                            )}:R> <t:${Math.floor(
                                expiretime / 1000
                            )}:D>\n**Partnership Manager:** ${
                                options.channelname
                            }\n**Mentions:** ${
                                mentions.mapstring
                            }\n**Channel:** <#${channelcreated.id}>`
                        ),
                ],
            });

            interaction.guild.members.cache
                .get(options.partnermanager.id)
                .roles.add("920192428915441724");

            return PartnershipChannelModel.create({
                channelid: channelcreated.id,
                pmanid: options.partnermanager.id,
                expire: expiretime,
                mentions: mentions.mapstring,
                mentionused: false,
            });
        } else if (interaction.options.getSubcommand() === "claimmention") {
            const pchannelData = await PartnershipChannelModel.findOne({
                channelid: interaction.channelId,
            });

            if (!pchannelData) {
                error_message = `\`This channel isn't registered as a partnership channel\``;
                return error_reply(interaction, error_message);
            }

            if (pchannelData.mentionused === true) {
                error_message = `\`This channel already used their mention.\nIf this is an error contact bot developer or an admin.\``;
                return error_reply(interaction, error_message);
            }

            interaction.reply({
                content: "Mentioning Below...",
                ephemeral: true,
            });
            interaction.channel.send({
                content: `${pchannelData.mentions}\nCheck out this server we've just partnered with!\n*This is an event partnership, __we are not otherwise affiliated with this server__*`,
            });

            await PartnershipChannelModel.findOneAndUpdate(
                {
                    channelid: interaction.channelId,
                },
                { mentionused: true }
            );
        }
    },
};
