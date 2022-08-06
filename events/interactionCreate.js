const {
    InteractionType,
    Collection,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const { user_fetch } = require("../utils/user");
const { error_reply } = require("../utils/error");
const { guild_fetch } = require("../utils/guild");

const GiveawayModel = require("../models/giveawaySchema");

const embedTheme = {
    color: "#f7cb8d",
    emoji_join: "<:smoothie:1003726574094397560>",
    emoji_mainpoint: "<:mainpoint_summer:1004211052612944014>",
    emoji_subpoint: "<a:subpoint_summer:1003716658277392484>",
    emoji_reroll: "<a:Hamster_Roll:927070245871566910>",
    dividerurl:
        "https://media.discordapp.net/attachments/1003715669059178626/1003729430897770506/ezgif.com-gif-maker_14.gif",
    button_style: 4,
};

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (interaction.type === InteractionType.ApplicationCommand) {
            const commandname = interaction.commandName;
            const command = client.commands.get(commandname);

            if (!command) return;

            const userid = interaction.user.id;

            const userData = user_fetch(userid);

            try {
                await command.execute(interaction, client, userData);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        } else if (interaction.isButton()) {
            const guildData = await guild_fetch(interaction.guildId);

            if (interaction.customId === "vote_perks") {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({
                                name: `Dank Exclusive's Perks`,
                                iconURL: `https://media.discordapp.net/attachments/909650135594729502/1005197758036189245/a_a0b58c0fa37eab6c37f4b6310e300a99.gif`,
                            })
                            .setThumbnail(
                                `https://images-ext-1.discordapp.net/external/zLueXZKz-HvmhRYnXdkjo0CXBvnRsV2miTCiaJnFM3s/%3Fsize%3D160%26quality%3Dlossless/https/cdn.discordapp.com/emojis/927604085203550209.webp`
                            )
                            .setURL(
                                `https://top.gg/servers/902334382939963402/vote`
                            )
                            .setTitle(`Voter Perks (Click me to vote)`)
                            .setDescription(
                                `<a:blue_arrow:955333342801322004> @Exclusive Voter role for 12 hours\n<a:blue_arrow:955333342801322004> External emote perms\n<a:blue_arrow:955333342801322004> Participate in Voter-Only gaws\n<a:blue_arrow:955333342801322004> Access to these channels with 2x multi\n<#922947565262098454>\n<#952734789264367646>`
                            )
                            .setFooter({
                                iconURL: `https://media.discordapp.net/attachments/909650135594729502/1005197758740824064/806710163032899604.gif`,
                                text: `Voter perks will be expired after 12 hours. Be sure to re-vote us!`,
                            }),
                    ],
                    ephemeral: true,
                });
            }
            if (interaction.customId === "giveaway_join") {
                const giveaway = await GiveawayModel.findOne({
                    messageid: interaction.message.id,
                });

                if (!giveaway) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`\`Giveaway no longer exists\``)
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                if (giveaway.hasEnded === true) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`Giveaway ended, so you can no longer interact with it\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                if (giveaway.entries.includes(interaction.user.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You already joined this giveaway\``
                                )
                                .setColor("#ffc182"),
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Leave giveaway")
                                    .setCustomId("giveaway_leave")
                                    .setEmoji("<a:X_:964313029732872242>")
                                    .setStyle(4)
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                if (
                    giveaway.blacklist.length > 0 ||
                    guildData.giveaway.blacklist.length > 0
                ) {
                    let blacklisted_roles = [];
                    giveaway.blacklist.forEach((id) => {
                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === id
                            )
                        ) {
                            blacklisted_roles.push(id);
                        }
                    });
                    guildData.giveaway.blacklist.forEach((id) => {
                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === id
                            )
                        ) {
                            blacklisted_roles.push(id);
                        }
                    });
                    if (blacklisted_roles.length > 0) {
                        const blacklisted_roles_map = blacklisted_roles
                            .map((id) => {
                                return `<@&${id}>`;
                            })
                            .join(", ");
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(
                                        `\`You have have been blacklisted to join this giveaway\`\nRoles keeping you from joining:\n${blacklisted_roles_map}`
                                    )
                                    .setColor("#ffc182"),
                            ],
                            ephemeral: true,
                        });
                    }
                }

                async function giveaway_join() {
                    giveaway.entriescount = giveaway.entriescount + 1;
                    giveaway.entries.push(interaction.user.id);
                    await GiveawayModel.findOneAndUpdate(
                        {
                            messageid: giveaway.messageid,
                        },
                        giveaway
                    );

                    const row = new ActionRowBuilder();
                    const button_join = new ButtonBuilder()
                        .setCustomId(`giveaway_join`)
                        .setLabel(`${giveaway.entriescount}`)
                        .setEmoji(`${embedTheme.emoji_join}`)
                        .setStyle(embedTheme.button_style);
                    row.addComponents(button_join);
                    interaction.message.edit({
                        components: [row],
                    });

                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You successfullly joined this giveaway\``
                                )
                                .setColor("#69ff6e"),
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Leave giveaway")
                                    .setCustomId("giveaway_leave")
                                    .setEmoji("<a:X_:964313029732872242>")
                                    .setStyle(4)
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                if (
                    giveaway.bypass.length > 0 ||
                    guildData.giveaway.bypass.length > 0
                ) {
                    let joined = false;
                    giveaway.bypass.forEach((id) => {
                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === id
                            )
                        ) {
                            joined = true;
                            return giveaway_join();
                        }
                    });

                    guildData.giveaway.bypass.forEach((id) => {
                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === id
                            )
                        ) {
                            joined = true;
                            return giveaway_join();
                        }
                    });
                    if (joined === true) {
                        return;
                    }
                }

                if (giveaway.requirements.length > 0) {
                    let needroles = [];
                    giveaway.requirements.forEach((id) => {
                        if (
                            !interaction.member.roles.cache.find(
                                (r) => r.id === id
                            )
                        ) {
                            needroles.push(id);
                        }
                    });
                    if (needroles.length > 0) {
                        const needroles_map = needroles
                            .map((id) => {
                                return `<@&${id}>`;
                            })
                            .join(", ");
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(
                                        `\`You don't fullfill the requirements to join this giveaway\`\nRole you need to aquire before joining:\n${needroles_map}`
                                    )
                                    .setColor("#ffc182"),
                            ],
                            ephemeral: true,
                        });
                    }
                }

                giveaway_join();
            } else if (interaction.customId === "giveaway_leave") {
                if (!interaction.message) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`Couldn't find giveaway message, this could be that the giveaway has been deleted\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                const giveaway_msg = await interaction.channel.messages.fetch(
                    interaction.message.reference.messageId
                );

                const giveaway = await GiveawayModel.findOne({
                    messageid: interaction.message.reference.messageId,
                });

                if (giveaway.hasEnded === true) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`Giveaway ended, so you can no longer interact with it\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                if (!giveaway.entries.includes(interaction.user.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You didn't join this giveaway\``
                                )
                                .setColor("#ffc182"),
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Giveaway")
                                    .setStyle(ButtonStyle.Link)
                                    .setEmoji(embedTheme.emoji_join)
                                    .setURL(
                                        `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.reference.messageId}`
                                    )
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                const pullIndex = giveaway.entries.indexOf(interaction.user.id);
                giveaway.entries.splice(pullIndex, 1);
                giveaway.entriescount = giveaway.entriescount - 1;

                await GiveawayModel.findOneAndUpdate(
                    {
                        messageid: giveaway.messageid,
                    },
                    giveaway
                );

                const row = new ActionRowBuilder();
                const button_join = new ButtonBuilder()
                    .setCustomId(`giveaway_join`)
                    .setLabel(`${giveaway.entriescount}`)
                    .setEmoji(`${embedTheme.emoji_join}`)
                    .setStyle(embedTheme.button_style);
                row.addComponents(button_join);
                await giveaway_msg.edit({
                    components: [row],
                });

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `\`You successfully left the giveaway\``
                            )
                            .setColor("#80a2ff"),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel("Giveaway")
                                .setStyle(ButtonStyle.Link)
                                .setEmoji(embedTheme.emoji_join)
                                .setURL(
                                    `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.reference.messageId}`
                                )
                        ),
                    ],
                    ephemeral: true,
                });
            } else if (interaction.customId === "giveaway_reroll") {
                const giveaway = await GiveawayModel.findOne({
                    messageid: interaction.message.id,
                });

                if (giveaway.hostid !== interaction.user.id) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You are not the host of this giveaway, therefore you cannot reroll winners\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                const choosewinner =
                    giveaway.entries[
                        Math.floor(Math.random() * giveaway.entries.length)
                    ];

                const results_embed = new EmbedBuilder().setDescription(
                    `${embedTheme.emoji_reroll} \`re-roll activated\`\n${embedTheme.emoji_mainpoint} Congratulations, you have won the re-roll for the giveaway for **${giveaway.prize}**`
                );
                await interaction.reply({
                    content: `**Host:** <@${giveaway.hostid}>\nRe-rolled Winner: <@${choosewinner}>`,
                    embeds: [results_embed],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel("Giveaway")
                                .setStyle(ButtonStyle.Link)
                                .setEmoji(embedTheme.emoji_join)
                                .setURL(
                                    `https://discord.com/channels/${giveaway.guildid}/${giveaway.channelid}/${giveaway.messageid}`
                                )
                        ),
                    ],
                });

                const embed = new EmbedBuilder()
                    .setTitle(
                        `${embedTheme.emoji_reroll} You won the re-roll for a giveaway!`
                    )
                    .setDescription(
                        `Please dm the host within their set claim duration (default: \`24 hours\`)\n\n${embedTheme.emoji_mainpoint}**Prize:** ${giveaway.prize}\n${embedTheme.emoji_mainpoint}**Host:** <@${giveaway.hostid}>`
                    );
                client.users.fetch(choosewinner, false).then((user) => {
                    user.send({
                        content: `<@${choosewinner}>`,
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Giveaway")
                                    .setStyle(ButtonStyle.Link)
                                    .setEmoji(embedTheme.emoji_join)
                                    .setURL(
                                        `https://discord.com/channels/${giveaway.guildid}/${giveaway.channelid}/${giveaway.messageid}`
                                    )
                            ),
                        ],
                    });
                });
            }
        }
    },
};
