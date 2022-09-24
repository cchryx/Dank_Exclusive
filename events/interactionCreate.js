const {
    InteractionType,
    Collection,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const humanizeDuration = require("humanize-duration");

const { user_fetch } = require("../utils/user");
const { error_reply } = require("../utils/error");
const { guild_fetch } = require("../utils/guild");
const TimerModel = require("../models/timerSchema");
const GiveawayModel = require("../models/giveawaySchema");
const GuildModel = require("../models/guildSchema");

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
    name: "interactionCreate",
    async execute(interaction, client) {
        const dankexData = await GuildModel.findOne({
            guildId: "902334382939963402",
        });
        const embedTheme = dankexData.theme;

        if (interaction.type === InteractionType.ApplicationCommand) {
            if (interaction.guildId !== "902334382939963402") {
                return interaction.reply({
                    content: "This server has no permission to use this bot.",
                    ephemeral: true,
                });
            }
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
                    row.addComponents(
                        button_join,
                        new ButtonBuilder()
                            .setCustomId(`giveaway_end`)
                            .setLabel(`End`)
                            .setEmoji(`<a:ravena_uncheck:1002983318565965885>`)
                            .setStyle(2)
                    );
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
                row.addComponents(
                    button_join,
                    new ButtonBuilder()
                        .setCustomId(`giveaway_end`)
                        .setLabel(`End`)
                        .setEmoji(`<a:ravena_uncheck:1002983318565965885>`)
                        .setStyle(2)
                );
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
            } else if (interaction.customId === "giveaway_end") {
                const giveaway = await GiveawayModel.findOne({
                    messageid: interaction.message.id,
                });
                if (giveaway.hostid !== interaction.user.id) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You are not the host of this giveaway, therefore you cannot end it manually\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }
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

                let winners = [];
                if (giveaway.winnersamount > 1) {
                    for (i = 0; i < giveaway.winnersamount; i++) {
                        winners.push(
                            giveaway.entries.filter(
                                (val) => !winners.includes(val)
                            )[
                                Math.floor(
                                    Math.random() *
                                        giveaway.entries.filter(
                                            (val) => !winners.includes(val)
                                        ).length
                                )
                            ]
                        );
                    }
                } else if (giveaway.winnersamount === 1) {
                    winners = [
                        giveaway.entries[
                            Math.floor(Math.random() * giveaway.entries.length)
                        ],
                    ];
                }

                winners = winners.filter(function (element) {
                    return element !== undefined;
                });

                try {
                    const channel = client.channels.cache.get(
                        giveaway.channelid
                    );
                    giveaway.winnersresults = winners;
                    giveaway.hasEnded = true;
                    await GiveawayModel.findOneAndUpdate(
                        {
                            messageid: giveaway.messageid,
                        },
                        giveaway
                    );

                    if (channel) {
                        try {
                            const message = await channel.messages.fetch(
                                giveaway.messageid
                            );
                            const winners_map = giveaway.winnersresults
                                .map((id) => {
                                    const embed = new EmbedBuilder()
                                        .setTitle("You won a giveaway!")
                                        .setDescription(
                                            `Please dm the host within their set claim duration (default: \`24 hours\`)\n\n${embedTheme.emoji_mainpoint}**Prize:** ${giveaway.prize}\n${embedTheme.emoji_mainpoint}**Host:** <@${giveaway.hostid}>`
                                        );
                                    client.users
                                        .fetch(id, false)
                                        .then((user) => {
                                            user.send({
                                                content: `<@${id}>`,
                                                embeds: [embed],
                                                components: [
                                                    new ActionRowBuilder().addComponents(
                                                        new ButtonBuilder()
                                                            .setLabel(
                                                                "Giveaway"
                                                            )
                                                            .setStyle(
                                                                ButtonStyle.Link
                                                            )
                                                            .setEmoji(
                                                                embedTheme.emoji_join
                                                            )
                                                            .setURL(
                                                                `https://discord.com/channels/${giveaway.guildid}/${giveaway.channelid}/${giveaway.messageid}`
                                                            )
                                                    ),
                                                ],
                                            });
                                        });
                                    return `<@${id}>`;
                                })
                                .join(", ");

                            const host_embed = new EmbedBuilder()
                                .setTitle("Your giveaway ended!")
                                .setDescription(
                                    `Please payout when the winners dm you and send you the link to the giveaway, you can get a claim time (default: \`24 hours\`)\n\n${
                                        embedTheme.emoji_mainpoint
                                    }**Prize:** ${giveaway.prize}\n${
                                        embedTheme.emoji_mainpoint
                                    }**Winners:** ${
                                        giveaway.winnersresults.length > 0
                                            ? `${winners_map}`
                                            : `*there was no entries to determine a winner*`
                                    }`
                                );
                            client.users
                                .fetch(giveaway.hostid, false)
                                .then((user) => {
                                    user.send({
                                        content: `<@${giveaway.hostid}>`,
                                        embeds: [host_embed],
                                        components: [
                                            new ActionRowBuilder().addComponents(
                                                new ButtonBuilder()
                                                    .setLabel("Giveaway")
                                                    .setStyle(ButtonStyle.Link)
                                                    .setEmoji(
                                                        embedTheme.emoji_join
                                                    )
                                                    .setURL(
                                                        `https://discord.com/channels/${giveaway.guildid}/${giveaway.channelid}/${giveaway.messageid}`
                                                    )
                                            ),
                                        ],
                                    });
                                });
                            const results_embed =
                                new EmbedBuilder().setDescription(
                                    `${embedTheme.emoji_mainpoint} ${
                                        giveaway.winnersresults.length > 0
                                            ? `Congratulations, you have won the giveaway for **${giveaway.prize}**`
                                            : `There was no winners in the giveaway for **${giveaway.prize}**`
                                    }`
                                );
                            const result_msg = await message.reply({
                                content: `**Host:** <@${giveaway.hostid}>\n${
                                    giveaway.winnersresults.length > 0
                                        ? `Winners: ${winners_map}`
                                        : `*there was no entries to determine a winner*`
                                }`,
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

                            if (message) {
                                const giveaway_embed = new EmbedBuilder()
                                    .setTitle(`${giveaway.prize}`)
                                    .setThumbnail(giveaway.typeurl)
                                    .setDescription(
                                        `Click ${
                                            embedTheme.emoji_join
                                        } to enter\n\n${
                                            embedTheme.emoji_mainpoint
                                        }**Winners:** ${
                                            giveaway.winnersresults.length > 0
                                                ? `[**giveaway results**](https://discord.com/channels/${result_msg.guildId}/${result_msg.channelId}/${result_msg.id})`
                                                : `*there was no entries to determine a winner*`
                                        }\n${
                                            embedTheme.emoji_mainpoint
                                        }**Ended:** <t:${Math.floor(
                                            giveaway.endsAt / 1000
                                        )}:R>\n${
                                            embedTheme.emoji_mainpoint
                                        }**Lasted For:** \`${humantime(
                                            giveaway.duration
                                        )}\`\n${
                                            embedTheme.emoji_mainpoint
                                        }**Host:** <@${giveaway.hostid}>\n${
                                            embedTheme.emoji_mainpoint
                                        }**Donator:** <@${giveaway.sponsorid}>`
                                    )
                                    .setImage(
                                        `https://media.discordapp.net/attachments/1003715669059178626/1004459806972723260/output-onlinepngtools_2.png`
                                    )
                                    .setFooter({
                                        text: `Winners: ${giveaway.winnersamount.toLocaleString()}`,
                                    });

                                if (giveaway.infodisplay) {
                                    giveaway_embed.setFields({
                                        name: "Information:",
                                        value: giveaway.infodisplay,
                                    });
                                }

                                const row = new ActionRowBuilder();
                                const button_join = new ButtonBuilder()
                                    .setCustomId(`giveaway_join`)
                                    .setLabel(`${giveaway.entriescount}`)
                                    .setEmoji(`${embedTheme.emoji_join}`)
                                    .setStyle(2)
                                    .setDisabled();
                                const button_reroll = new ButtonBuilder()
                                    .setCustomId(`giveaway_reroll`)
                                    .setLabel(`Reroll`)
                                    .setEmoji(`${embedTheme.emoji_reroll}`)
                                    .setStyle(2);
                                row.addComponents(button_join);

                                if (giveaway.winnersresults.length > 0) {
                                    row.addComponents(button_reroll);
                                }

                                const sponsor =
                                    await message.guild.members.fetch(
                                        giveaway.sponsorid
                                    );

                                const embeds = [giveaway_embed];
                                if (giveaway.sponsormessage) {
                                    const message_embed = new EmbedBuilder()
                                        .setDescription(
                                            `**Message:** ${giveaway.sponsormessage}`
                                        )
                                        .setFooter({
                                            url: sponsor.user.displayAvatarURL(),
                                            text: `-${sponsor.user.tag}`,
                                        });
                                    embeds.push(message_embed);
                                }

                                interaction.reply({
                                    content: "Successfully ended that giveaway",
                                    ephemeral: true,
                                });

                                message.edit({
                                    content: "`Giveaway has ended`",
                                    embeds: embeds,
                                    components: [row],
                                });
                            }
                        } catch (_) {
                            console.log(_);
                        }
                    }
                } catch (_) {}
            } else if (interaction.customId === "timer_join") {
                const timer = await TimerModel.findOne({
                    messageid: interaction.message.id,
                });

                if (!timer) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`\`Timer no longer exists\``)
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                if (timer.mentions.includes(interaction.user.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You already joined this timer\``
                                )
                                .setColor("#ffc182"),
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Leave timer")
                                    .setCustomId("timer_leave")
                                    .setEmoji("<a:X_:964313029732872242>")
                                    .setStyle(4)
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                async function timer_join() {
                    timer.mentions.push(interaction.user.id);
                    await TimerModel.findOneAndUpdate(
                        {
                            messageid: timer.messageid,
                        },
                        timer
                    );

                    interaction.message.edit({
                        components: [
                            new ActionRowBuilder().setComponents(
                                new ButtonBuilder()
                                    .setCustomId(`timer_join`)
                                    .setLabel(`${timer.mentions.length}`)
                                    .setEmoji(`${embedTheme.emoji_join}`)
                                    .setStyle(embedTheme.button_style)
                            ),
                        ],
                    });

                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You successfullly joined this timer\``
                                )
                                .setColor("#69ff6e"),
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Leave timer")
                                    .setCustomId("timer_leave")
                                    .setEmoji("<a:X_:964313029732872242>")
                                    .setStyle(4)
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                timer_join();
            } else if (interaction.customId === "timer_leave") {
                if (!interaction.message) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`Couldn't find timer message, this could be that the timer has been deleted\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                const timer_msg = await interaction.channel.messages.fetch(
                    interaction.message.reference.messageId
                );

                const timer = await TimerModel.findOne({
                    messageid: interaction.message.reference.messageId,
                });

                if (!timer) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`\`Timer no longer exists\``)
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                if (!timer.mentions.includes(interaction.user.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You didn't join this timer\``
                                )
                                .setColor("#ffc182"),
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Timer")
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

                const pullIndex = timer.mentions.indexOf(interaction.user.id);
                timer.mentions.splice(pullIndex, 1);

                await TimerModel.findOneAndUpdate(
                    {
                        messageid: timer.messageid,
                    },
                    timer
                );

                timer_msg.edit({
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`timer_join`)
                                .setLabel(`${timer.mentions.length}`)
                                .setEmoji(`${embedTheme.emoji_join}`)
                                .setStyle(embedTheme.button_style)
                        ),
                    ],
                });

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `\`You successfully left the timer\``
                            )
                            .setColor("#80a2ff"),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel("Timer")
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

            const isrole = interaction.guild.roles.cache.find(
                (r) => r.id === interaction.customId
            );
            if (isrole) {
                const colorroles = [
                    "954593618969128970",
                    "953822186832015441",
                    "902346605653532672",
                    "902346604189724713",
                    "902346606668550244",
                    "902346605208944651",
                    "902346605976506419",
                    "902346605963931718",
                    "902346603988406293",
                ];
                const pronounroles = [
                    "909552802362179605",
                    "909552712855728128",
                    "909552894372638780",
                ];
                const user = await interaction.guild.members.fetch(
                    interaction.user.id
                );
                let hascolorrole = false;
                let hascolor;
                let haspronounroles = false;
                let haspronoun;

                colorroles.forEach((role) => {
                    if (interaction.member.roles.cache.has(role)) {
                        hascolor = role;
                        return (hascolorrole = true);
                    }
                });

                pronounroles.forEach((role) => {
                    if (interaction.member.roles.cache.has(role)) {
                        haspronoun = role;
                        return (haspronounroles = true);
                    }
                });

                if (
                    hascolorrole === true &&
                    colorroles.includes(interaction.customId) &&
                    hascolor !== interaction.customId
                ) {
                    user.roles.remove(hascolor);
                    user.roles.add(interaction.customId);
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`#f5ca93`)
                                .setDescription(
                                    `**\`Successfully changed your color role\`**\nRemoved Role: <@&${hascolor}>\nAdded Role: <@&${interaction.customId}>`
                                ),
                        ],
                        components: [
                            new ActionRowBuilder().setComponents(
                                new ButtonBuilder()
                                    .setStyle(5)
                                    .setLabel(`Menu`)
                                    .setURL(
                                        `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                                    )
                            ),
                        ],
                        ephemeral: true,
                    });
                } else if (
                    haspronoun === true &&
                    pronounroles.includes(interaction.customId) &&
                    haspronoun !== interaction.customId
                ) {
                    user.roles.remove(haspronoun);
                    user.roles.add(interaction.customId);
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`#f5ca93`)
                                .setDescription(
                                    `**\`Successfully changed your pronoun role\`**\nRemoved Role: <@&${haspronoun}>\nAdded Role: <@&${interaction.customId}>`
                                ),
                        ],
                        components: [
                            new ActionRowBuilder().setComponents(
                                new ButtonBuilder()
                                    .setStyle(5)
                                    .setLabel(`Menu`)
                                    .setURL(
                                        `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                                    )
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                if (interaction.member.roles.cache.has(interaction.customId)) {
                    user.roles.remove(interaction.customId);
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`#f5ca93`)
                                .setDescription(
                                    `**\`Successfully removed a role from you\`**\nRole: <@&${interaction.customId}>`
                                ),
                        ],
                        components: [
                            new ActionRowBuilder().setComponents(
                                new ButtonBuilder()
                                    .setStyle(5)
                                    .setLabel(`Menu`)
                                    .setURL(
                                        `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                                    )
                            ),
                        ],
                        ephemeral: true,
                    });
                } else {
                    user.roles.add(interaction.customId);
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`#93f5b7`)
                                .setDescription(
                                    `**\`Successfully added a role to you\`**\nRole: <@&${interaction.customId}>`
                                ),
                        ],
                        components: [
                            new ActionRowBuilder().setComponents(
                                new ButtonBuilder()
                                    .setStyle(5)
                                    .setLabel(`Menu`)
                                    .setURL(
                                        `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                                    )
                            ),
                        ],
                        ephemeral: true,
                    });
                }
            }
        }
    },
};
