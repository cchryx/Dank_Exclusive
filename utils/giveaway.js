const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const fs = require("fs");

const GiveawayModel = require("../models/giveawaySchema");
const GWCOOLDOWN = require("../cooldowns/gwmention.json");
const { error_reply } = require("./error");
const { time_humantime } = require("./time");

class Giveawayfunctions {
    static async giveaway_check_mentioncd(interaction, mention) {
        const cooldown = 120 * 1000;
        const userId = interaction.user.id;
        let error_message;
        let status = true;

        if (!GWCOOLDOWN.hasOwnProperty(userId)) {
            GWCOOLDOWN[userId] = {};
        }

        let readytimestamp = GWCOOLDOWN[userId][mention];
        if (!readytimestamp) {
            readytimestamp = 0;
        }

        const timeLeft = new Date(readytimestamp);
        let check =
            timeLeft - Date.now() >= timeLeft || timeLeft - Date.now() <= 0;

        if (!check) {
            error_message = `\`You are on cooldown for mentioning giveaways, please wait for cooldown to end or don't add mentions when using this command\`\n\`Other mentions may work if they are not on cooldown\`\nReady: <t:${Math.floor(
                readytimestamp / 1000
            )}:R>\nMention: <@&${mention}>`;

            status = false;
            error_reply(interaction, error_message);
        } else {
            GWCOOLDOWN[userId][mention] = Date.now() + cooldown;
            fs.writeFile(
                "./cooldowns/gwmention.json",
                JSON.stringify(GWCOOLDOWN),
                (err) => {
                    if (err) {
                        console.log(err);
                    }
                }
            );
        }

        return status;
    }

    static async giveaway_fetch(interaction, messageId) {
        let status = true;
        const giveawayData = await GiveawayModel.findOne({
            messageId: messageId,
        });

        if (!giveawayData) {
            status = false;
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`\`Giveaway no longer exists\``)
                        .setColor("#ffc182"),
                ],

                ephemeral: true,
            });

            return {
                status: status,
                data: giveawayData,
            };
        }

        if (giveawayData.hasEnded === true) {
            status = false;
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `\`Giveaway ended, so you can no longer interact with it\``
                        )
                        .setColor("#ffc182"),
                ],

                ephemeral: true,
            });

            return {
                status: status,
                data: giveawayData,
            };
        }

        return {
            status: status,
            data: giveawayData,
        };
    }

    static async giveaway_check_fulfill(
        interaction,
        giveawayData,
        userData,
        guildData
    ) {
        let status = true;
        if (giveawayData.entries.includes(interaction.user.id)) {
            status = false;
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`\`You already joined this giveaway\``)
                        .setColor("#ffc182"),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Leave giveaway")
                            .setCustomId("giveaway_leave")
                            .setEmoji("<a:ravena_uncheck:1002983318565965885>")
                            .setStyle(4)
                    ),
                ],
                ephemeral: true,
            });
            return status;
        }

        // handle giveaway blacklist
        if (
            giveawayData.blacklist.length > 0 ||
            guildData.giveaway.globalBlacklist_roles.length > 0
        ) {
            let blacklisted_roles = [];
            giveawayData.blacklist.forEach((id) => {
                if (interaction.member.roles.cache.find((r) => r.id === id)) {
                    blacklisted_roles.push(id);
                }
            });
            guildData.giveaway.globalBlacklist_roles.forEach((id) => {
                if (interaction.member.roles.cache.find((r) => r.id === id)) {
                    blacklisted_roles.push(id);
                }
            });
            if (blacklisted_roles.length > 0) {
                status = false;
                const blacklisted_roles_map = blacklisted_roles
                    .map((id) => {
                        return `<@&${id}>`;
                    })
                    .join(", ");
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `**You have have been blacklisted from joining this giveaway.**\n\nRoles keeping you from joining:\n${blacklisted_roles_map}`
                            )
                            .setColor("#ffc182"),
                    ],
                    ephemeral: true,
                });
                return status;
            }
        }

        // handle giveaway bypass
        if (
            giveawayData.bypass.length > 0 ||
            guildData.giveaway.globalBypass_roles.length > 0
        ) {
            let hasBypass_roles = false;
            giveawayData.bypass.forEach((id) => {
                if (interaction.member.roles.cache.find((r) => r.id === id)) {
                    hasBypass_roles = true;
                }
            });

            if (giveawayData.globalBypass === "true") {
                guildData.giveaway.globalBypass_roles.forEach((id) => {
                    if (
                        interaction.member.roles.cache.find((r) => r.id === id)
                    ) {
                        hasBypass_roles = true;
                    }
                });
            }

            if (hasBypass_roles === true) {
                return status;
            }
        }

        // handle chat requirement
        if (giveawayData.chatRequirements) {
            if (
                !giveawayData.chatRequirements.users_progress.hasOwnProperty(
                    interaction.user.id
                )
            ) {
                giveawayData.chatRequirements.users_progress[
                    interaction.user.id
                ] = {
                    messages: 0,
                    cooldown: 0,
                };

                await GiveawayModel.findOneAndUpdate(
                    { messageId: giveawayData.messageId },
                    giveawayData
                );
            }

            if (
                giveawayData.chatRequirements.users_progress[
                    interaction.user.id
                ].messages < giveawayData.chatRequirements.messages
            ) {
                status = false;
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `**You don't fulfill  the requirements to join this giveaway.**\n\nYour Progress: \`${
                                    giveawayData.chatRequirements
                                        .users_progress[interaction.user.id]
                                        .messages
                                }/${giveawayData.chatRequirements.messages.toLocaleString()} messages\` in <#${
                                    giveawayData.chatRequirements.channel
                                }>`
                            )
                            .setColor("#ffc182"),
                    ],
                    ephemeral: true,
                });
                return status;
            }
        }

        if (giveawayData.requirements.requiredRoles.length > 0) {
            // handle giveaway role requirements
            let required_roles = [];
            giveawayData.requirements.requiredRoles.forEach((id) => {
                if (!interaction.member.roles.cache.find((r) => r.id === id)) {
                    required_roles.push(id);
                }
            });
            if (required_roles.length > 0) {
                status = false;
                const required_roles_map = required_roles
                    .map((id) => {
                        return `<@&${id}>`;
                    })
                    .join(", ");
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `**You don't fulfill  the requirements to join this giveaway.**\n\nRoles you need to aquire before joining:\n${required_roles_map}`
                            )
                            .setColor("#ffc182"),
                    ],
                    ephemeral: true,
                });
                return status;
            }
        }

        // handle giveaway level requirements
        if (giveawayData.requirements.requiredlevel) {
            if (
                giveawayData.requirements.requiredlevel >
                userData.levelInfo.level
            ) {
                status = false;
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `**You don't have enough levels to join this giveaway.**\n\nYour Level: \`${userData.levelInfo.level.toLocaleString()}\`\nLevels Needed: \`${(
                                    giveawayData.requirements.requiredlevel -
                                    userData.levelInfo.level
                                ).toLocaleString()}\``
                            )
                            .setColor("#ffc182"),
                    ],
                    ephemeral: true,
                });
                return status;
            }
        }

        return status;
    }

    static async giveaway_join(interaction, giveawayData, guildData) {
        let giveaway_entries_count;
        giveawayData.entries.push(interaction.user.id);
        giveaway_entries_count = giveawayData.entries.length;

        await GiveawayModel.findOneAndUpdate(
            {
                messageId: giveawayData.messageId,
            },
            giveawayData
        );

        const row = new ActionRowBuilder();
        const button_join = new ButtonBuilder()
            .setCustomId(interaction.customId)
            .setLabel(`${giveaway_entries_count}`)
            .setEmoji(`${guildData.theme.emoji_join}`)
            .setStyle(interaction.componentType);
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
                        .setEmoji("<a:ravena_uncheck:1002983318565965885>")
                        .setStyle(4)
                ),
            ],
            ephemeral: true,
        });
    }

    static async giveaway_leave(interaction, giveawayData, guildData) {
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

        const giveaway_message = await interaction.channel.messages.fetch(
            interaction.message.reference.messageId
        );

        if (giveawayData.hasEnded === true) {
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

        if (!giveawayData.entries.includes(interaction.user.id)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`\`You didn't join this giveaway\``)
                        .setColor("#ffc182"),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Giveaway")
                            .setStyle(ButtonStyle.Link)
                            .setEmoji(guildData.theme.emoji_join)
                            .setURL(
                                `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.reference.messageId}`
                            )
                    ),
                ],
                ephemeral: true,
            });
        }

        let giveaway_entries_count;
        const pullIndex = giveawayData.entries.indexOf(interaction.user.id);
        giveawayData.entries.splice(pullIndex, 1);
        giveaway_entries_count = giveawayData.entries.length;

        await GiveawayModel.findOneAndUpdate(
            {
                messageId: giveawayData.messageId,
            },
            giveawayData
        );

        const row = new ActionRowBuilder();
        const button_join = new ButtonBuilder()
            .setCustomId(`giveaway_join`)
            .setLabel(`${giveaway_entries_count}`)
            .setEmoji(`${guildData.theme.emoji_join}`)
            .setStyle(guildData.theme.button_style);
        row.addComponents(
            button_join,
            new ButtonBuilder()
                .setCustomId(`giveaway_end`)
                .setLabel(`End`)
                .setEmoji(`<a:ravena_uncheck:1002983318565965885>`)
                .setStyle(2)
        );
        await giveaway_message.edit({
            components: [row],
        });

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`\`You successfully left the giveaway\``)
                    .setColor("#80a2ff"),
            ],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Giveaway")
                        .setStyle(ButtonStyle.Link)
                        .setEmoji(guildData.theme.emoji_join)
                        .setURL(
                            `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.reference.messageId}`
                        )
                ),
            ],
            ephemeral: true,
        });
    }

    static async giveaway_end(client, giveawayData, guildData) {
        const giveaway_entires_count = giveawayData.entries.length;

        // handle giveaway winners
        let giveaway_winners = [];
        if (giveawayData.winnersAmount > 1) {
            for (let i = 0; i < giveawayData.winnersAmount; i++) {
                giveaway_winners.push(
                    giveawayData.entries.filter(
                        (val) => !giveaway_winners.includes(val)
                    )[
                        Math.floor(
                            Math.random() *
                                giveawayData.entries.filter(
                                    (val) => !giveaway_winners.includes(val)
                                ).length
                        )
                    ]
                );
            }
        } else if (giveawayData.winnersAmount === 1) {
            giveaway_winners = [
                giveawayData.entries[
                    Math.floor(Math.random() * giveaway_entires_count)
                ],
            ];
        }

        giveaway_winners = giveaway_winners.filter(function (element) {
            return element !== undefined;
        });

        giveawayData.winnersResults = giveaway_winners;
        giveawayData.hasEnded = true;
        await GiveawayModel.findOneAndUpdate(
            {
                messageId: giveawayData.messageId,
            },
            giveawayData
        );

        try {
            const giveaway_channel = client.channels.cache.get(
                giveawayData.channelId
            );

            if (giveaway_channel) {
                try {
                    const giveaway_message =
                        await giveaway_channel.messages.fetch(
                            giveawayData.messageId
                        );

                    const giveaway_winners_map = giveawayData.winnersResults
                        .map((id) => {
                            const embed = new EmbedBuilder()
                                .setTitle("You won a giveaway!")
                                .setDescription(
                                    `Your payouts are automatic, check notifications or payout channel.\n\n${guildData.theme.emoji_mainpoint}**Prize:** ${giveawayData.prize}\n${guildData.theme.emoji_mainpoint}**Host:** <@${giveawayData.hostId}>`
                                );
                            client.users.fetch(id, false).then((user) => {
                                user.send({
                                    content: `<@${id}>`,
                                    embeds: [embed],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setLabel("Giveaway")
                                                .setStyle(ButtonStyle.Link)
                                                .setEmoji(
                                                    guildData.theme.emoji_join
                                                )
                                                .setURL(
                                                    `https://discord.com/channels/${giveawayData.guildId}/${giveawayData.channelId}/${giveawayData.messageId}`
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
                            `Please payout when the winners in the payout channel.\n\n${
                                guildData.theme.emoji_mainpoint
                            }**Prize:** ${giveawayData.prize}\n${
                                guildData.theme.emoji_mainpoint
                            }**Winners:** ${
                                giveawayData.winnersResults.length > 0
                                    ? `${giveaway_winners_map}`
                                    : `*there was no entries to determine a winner*`
                            }`
                        );
                    client.users
                        .fetch(giveawayData.hostId, false)
                        .then((user) => {
                            user.send({
                                content: `<@${giveawayData.hostId}>`,
                                embeds: [host_embed],
                                components: [
                                    new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setLabel("Giveaway")
                                            .setStyle(ButtonStyle.Link)
                                            .setEmoji(
                                                guildData.theme.emoji_join
                                            )
                                            .setURL(
                                                `https://discord.com/channels/${giveawayData.guildId}/${giveawayData.channelId}/${giveawayData.messageId}`
                                            )
                                    ),
                                ],
                            });
                        });
                    const results_embed = new EmbedBuilder().setDescription(
                        `${guildData.theme.emoji_mainpoint} ${
                            giveawayData.winnersResults.length > 0
                                ? `Congratulations, you have won the giveaway for **${giveawayData.prize}**`
                                : `There was no winners in the giveaway for **${giveawayData.prize}**`
                        }`
                    );

                    const result_message = await giveaway_message.reply({
                        content: `**Host:** <@${giveawayData.hostId}>\n${
                            giveawayData.winnersResults.length > 0
                                ? `Winners: ${giveaway_winners_map}`
                                : `*there was no entries to determine a winner*`
                        }`,
                        embeds: [results_embed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Giveaway")
                                    .setStyle(ButtonStyle.Link)
                                    .setEmoji(guildData.theme.emoji_join)
                                    .setURL(
                                        `https://discord.com/channels/${giveawayData.guildId}/${giveawayData.channelId}/${giveawayData.messageId}`
                                    )
                            ),
                        ],
                    });

                    const giveaway_duration = await time_humantime(
                        giveawayData.duration
                    );

                    if (giveaway_message) {
                        const giveaway_embed = new EmbedBuilder()
                            .setTitle(`${giveawayData.prize}`)
                            .setDescription(
                                `Click ${
                                    guildData.theme.emoji_join
                                } to enter\n\n${
                                    guildData.theme.emoji_mainpoint
                                }**Winners:** ${
                                    giveawayData.winnersResults.length > 0
                                        ? `[**giveaway results**](https://discord.com/channels/${result_message.guildId}/${result_message.channelId}/${result_message.id})`
                                        : `*there was no entries to determine a winner*`
                                }\n${
                                    guildData.theme.emoji_mainpoint
                                }**Ended:** <t:${Math.floor(
                                    giveawayData.endsAt / 1000
                                )}:R>\n${
                                    guildData.theme.emoji_mainpoint
                                }**Lasted For:** \`${giveaway_duration}\`\n${
                                    guildData.theme.emoji_mainpoint
                                }**Host:** <@${giveawayData.hostId}>\n${
                                    guildData.theme.emoji_mainpoint
                                }**Donator:** <@${giveawayData.sponsorId}>`
                            )
                            .setImage(
                                `https://media.discordapp.net/attachments/1003715669059178626/1004459806972723260/output-onlinepngtools_2.png`
                            )
                            .setFooter({
                                text: `Winners: ${giveawayData.winnersAmount.toLocaleString()}`,
                            });

                        if (giveawayData.informationDisplay) {
                            giveaway_embed.setFields({
                                name: "Information:",
                                value: giveawayData.informationDisplay,
                            });
                        }

                        const row = new ActionRowBuilder();
                        const button_join = new ButtonBuilder()
                            .setCustomId(`giveaway_join`)
                            .setLabel(`${giveaway_entires_count}`)
                            .setEmoji(`${guildData.theme.emoji_join}`)
                            .setStyle(2)
                            .setDisabled();
                        const button_reroll = new ButtonBuilder()
                            .setCustomId(`giveaway_reroll`)
                            .setLabel(`Reroll`)
                            .setEmoji(`${guildData.theme.emoji_reroll}`)
                            .setStyle(2);
                        row.addComponents(button_join);

                        if (giveawayData.winnersResults.length > 0) {
                            row.addComponents(button_reroll);
                        }

                        const giveaway_sponsor =
                            await giveaway_message.guild.members.fetch(
                                giveawayData.sponsorId
                            );

                        const embeds = [giveaway_embed];
                        if (giveawayData.sponsorMessage) {
                            const message_embed = new EmbedBuilder()
                                .setDescription(
                                    `**Message:** ${giveawayData.sponsorMessage}`
                                )
                                .setFooter({
                                    url: giveaway_sponsor.user.displayAvatarURL(),
                                    text: `-${giveaway_sponsor.user.tag}`,
                                });
                            embeds.push(message_embed);
                        }

                        giveaway_message.edit({
                            content: "`Giveaway has ended!`",
                            embeds: embeds,
                            components: [row],
                        });
                    }
                } catch (_) {
                    console.log(_);
                }
            }
        } catch (_) {
            console.log(_);
        }
    }

    static async giveaway_reroll(client, interaction, giveawayData, guildData) {
        const choosewinner =
            giveawayData.entries[
                Math.floor(Math.random() * giveawayData.entries.length)
            ];

        const results_embed = new EmbedBuilder().setDescription(
            `${guildData.theme.emoji_reroll} \`re-roll activated\`\n${guildData.theme.emoji_mainpoint} Congratulations, you have won the re-roll for the giveaway for **${giveawayData.prize}**`
        );
        await interaction.reply({
            content: `**Host:** <@${giveawayData.hostId}>\nRe-rolled Winner: <@${choosewinner}>`,
            embeds: [results_embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Giveaway")
                        .setStyle(ButtonStyle.Link)
                        .setEmoji(guildData.theme.emoji_join)
                        .setURL(
                            `https://discord.com/channels/${giveawayData.guildId}/${giveawayData.channelId}/${giveawayData.messageId}`
                        )
                ),
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle(
                `${guildData.theme.emoji_reroll} You won the re-roll for a giveaway!`
            )
            .setDescription(
                `Please dm the host within their set claim duration (default: \`24 hours\`)\n\n${guildData.theme.emoji_mainpoint}**Prize:** ${giveawayData.prize}\n${guildData.theme.emoji_mainpoint}**Host:** <@${giveawayData.hostId}>`
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
                            .setEmoji(guildData.theme.emoji_join)
                            .setURL(
                                `https://discord.com/channels/${giveawayData.guildId}/${giveawayData.channelId}/${giveawayData.messageId}`
                            )
                    ),
                ],
            });
        });
    }

    static async giveaway_requiredchat(userId, channelId) {
        const giveaway_requiredchatcd = 8 * 1000;
        const giveaway_query = await GiveawayModel.find({
            "chatRequirements.channel": channelId,
            hasEnded: false,
        });

        for (const giveawayData of giveaway_query) {
            if (
                !giveawayData.chatRequirements.users_progress.hasOwnProperty(
                    userId
                )
            ) {
                giveawayData.chatRequirements.users_progress[userId] = {
                    messages: 1,
                    cooldown: Date.now(),
                };

                await GiveawayModel.findOneAndUpdate(
                    {
                        messageId: giveawayData.messageId,
                    },
                    giveawayData
                );

                continue;
            }

            if (
                giveawayData.chatRequirements.users_progress[userId].messages >=
                giveawayData.chatRequirements.messages
            ) {
                continue;
            }

            const timeLeft = new Date(
                giveawayData.chatRequirements.users_progress[userId].cooldown
            );
            let check =
                timeLeft - Date.now() >= timeLeft || timeLeft - Date.now() <= 0;

            if (!check) {
                continue;
            } else {
                giveawayData.chatRequirements.users_progress[
                    userId
                ].messages += 1;
                giveawayData.chatRequirements.users_progress[userId].cooldown =
                    Date.now() + giveaway_requiredchatcd;

                await GiveawayModel.findOneAndUpdate(
                    {
                        messageId: giveawayData.messageId,
                    },
                    giveawayData
                );
                continue;
            }
        }
    }
}

module.exports = Giveawayfunctions;
