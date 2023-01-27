const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const StickyModel = require("../../models/stickySchema");

const { error_reply } = require("../../utils/error");
const { guild_fetch } = require("../../utils/guild");
const { discord_check_role } = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sticky")
        .setDescription("Sticky message in channel related commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a sticky message for a channel.")
                .addChannelOption((oi) => {
                    return oi
                        .setName("channel")
                        .setDescription(
                            "Which channel this sticky message will be for."
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("content")
                        .setDescription("Sticky message content.");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("title")
                        .setDescription("Sticky message embed title.");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("description")
                        .setDescription("Sticky message embed description.");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("colour")
                        .setDescription("Sticky message embed colour.");
                })
                .addAttachmentOption((oi) => {
                    return oi
                        .setName("thumbnail")
                        .setDescription("Sticky message embed thumbnail.");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("linkurl")
                        .setDescription("Sticky message link URL.");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("linkurl_label")
                        .setDescription("Sticky message link URL label.");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show the sticky message for a channel.")
                .addChannelOption((oi) => {
                    return oi
                        .setName("channel")
                        .setDescription(
                            "Which channel this sticky message will be for."
                        );
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("delete")
                .setDescription("Delete the sticky message for a channel.")
                .addChannelOption((oi) => {
                    return oi
                        .setName("channel")
                        .setDescription(
                            "Which channel this sticky message will be for."
                        )
                        .setRequired(true);
                })
        ),
    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        let stickyData;
        const checkAccess = await discord_check_role(interaction, [
            "904456239415697441",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "create") {
            const options = {
                channel: interaction.options.getChannel("channel"),
                title: interaction.options.getString("title"),
                content: interaction.options.getString("content"),
                description: interaction.options.getString("description"),
                colour: interaction.options.getString("colour"),
                thumbnail: interaction.options.getAttachment("thumbnail"),
                linkurl: interaction.options.getString("linkurl"),
                linkurl_label: interaction.options.getString("linkurl_label"),
            };

            stickyData = await StickyModel.findOne({
                channelId: options.channel.id,
            });

            if (stickyData) {
                error_message =
                    "Cannot create a sticky message for this channel because it already has one.";
                return error_reply(interaction, error_message);
            }

            const sticky_message = new Object();
            const sticky_embed = new EmbedBuilder();
            const sticky_row = new ActionRowBuilder();
            const sticky_button = new ButtonBuilder();
            const stickyData_create = { channelId: options.channel.id };

            if (options.content) {
                sticky_message.content = options.content;
            }

            if (options.linkurl) {
                sticky_message.components = [];
                sticky_button.setStyle(ButtonStyle.Link);

                try {
                    sticky_button.setURL(options.linkurl);

                    if (options.linkurl_label) {
                        sticky_button.setLabel(options.linkurl_label);
                    } else {
                        sticky_button.setLabel(`LINK`);
                    }

                    sticky_row.setComponents(sticky_button);
                    sticky_message.components.push(sticky_row);
                } catch (error) {
                    delete sticky_message.components;
                }
            }

            if (options.title || options.description || options.thumbnail) {
                sticky_message.embeds = [];

                if (options.title) {
                    sticky_embed.setTitle(options.title);
                }
                if (options.description) {
                    sticky_embed.setDescription(options.description);
                }
                if (options.thumbnail) {
                    sticky_embed.setThumbnail(options.thumbnail.url);
                }
                if (options.colour) {
                    try {
                        sticky_embed.setColor(options.colour);
                    } catch (error) {
                        sticky_embed.setColor(null);
                    }
                }

                sticky_message.embeds.push(sticky_embed);
            }

            const sticky_send = await options.channel
                .send(sticky_message)
                .catch((error) => {
                    return false;
                });

            if (sticky_send === false) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Create sticky message: FAILED**\n*Nothing provided for sticky message.*\n\nChannel: ${options.channel}`
                        ),
                    ],
                });
            }

            const sticky_discordData = await interaction.channel.send(
                sticky_message
            );
            interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Create sticky message: SUCCESSFUL**\n*The following message will be how the sticky message will look like.*\n\nChannel: ${options.channel}`
                    ),
                ],
            });

            stickyData_create.messageId = sticky_send.id;
            return await StickyModel.create(stickyData_create);
        } else if (interaction.options.getSubcommand() === "show") {
            const options = {
                channel: interaction.options.getChannel("channel"),
            };

            const stickyDatas = await StickyModel.find();
            const stickyDatas_map = stickyDatas
                .map((sticky) => {
                    return `Channel: <#${sticky.channelId}>, Active: \`${sticky.active}\``;
                })
                .join("\n");

            if (options.channel) {
                const sticky_message = {};
                stickyData = await StickyModel.findOne({
                    channelId: options.channel.id,
                });

                if (!stickyData) {
                    error_message =
                        "Channel doesn't have a sticky message set for it.";
                    return error_reply(interaction, error_message);
                }

                const sticky_discordData = await options.channel.messages.fetch(
                    stickyData.messageId
                );

                if (sticky_discordData.content) {
                    sticky_message.content = sticky_discordData.content;
                }

                if (sticky_discordData.embeds) {
                    sticky_message.embeds = sticky_discordData.embeds;
                }

                if (sticky_discordData.components) {
                    sticky_message.components = sticky_discordData.components;
                }

                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Sticky Settings`)
                            .setDescription(
                                `**Specific sticky settings: DISPLAY**\n*Bellow is the details of the sticky message.*\n\nChannel: <#${stickyData.channelId}>`
                            ),
                    ],
                    components: [
                        new ActionRowBuilder().setComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setURL(
                                    `https://discord.com/channels/${interaction.guildId}/${stickyData.channelId}/${stickyData.messageId}`
                                )
                                .setLabel("Sticky Message")
                        ),
                    ],
                });

                return interaction.channel.send(sticky_message);
            } else {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Sticky Settings`)
                            .setDescription(
                                `*Here lies all the sticky messages.*\n\n${
                                    stickyDatas.length > 0
                                        ? stickyDatas_map
                                        : `\`No sticky messages\``
                                }`
                            ),
                    ],
                });
            }
        } else if (interaction.options.getSubcommand() === "delete") {
            const options = {
                channel: interaction.options.getChannel("channel"),
            };

            stickyData = await StickyModel.findOne({
                channelId: options.channel.id,
            });

            if (!stickyData) {
                error_message =
                    "Channel doesn't have a sticky message set for it.";
                return error_reply(interaction, error_message);
            }

            await StickyModel.findOneAndDelete({
                channelId: options.channel.id,
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Delete sticky message: SUCCESSFUL**\n*I deleted the sticky message for you.*\n\nChannel: <#${stickyData.channelId}>`
                    ),
                ],
            });
        }
    },
};
