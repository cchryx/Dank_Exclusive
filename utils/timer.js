const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const TimerModel = require("../models/timerSchema");
const { time_humantime } = require("./time");

class Timerfunctions {
    static async timer_fetch(interaction, messageId) {
        let status = true;
        const timerData = await TimerModel.findOne({
            messageId: messageId,
        });

        if (!timerData) {
            status = false;
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`\`Timer no longer exists\``)
                        .setColor("#ffc182"),
                ],

                ephemeral: true,
            });

            return {
                status: status,
                data: timerData,
            };
        }

        return {
            status: status,
            data: timerData,
        };
    }

    static async timer_check_fulfill(interaction, timerData) {
        let status = true;

        if (timerData.users.includes(interaction.user.id)) {
            status = false;
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`\`You already joined this timer\``)
                        .setColor("#ffc182"),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Leave timer")
                            .setCustomId("timer_leave")
                            .setEmoji("<a:ravena_uncheck:1002983318565965885>")
                            .setStyle(4)
                    ),
                ],
                ephemeral: true,
            });

            return status;
        }

        return status;
    }

    static async giveaway_join(interaction, timerData, guildData) {
        let timer_entries_count;
        timerData.entries.push(interaction.user.id);
        timer_entries_count = timerData.entries.length;

        await GiveawayModel.findOneAndUpdate(
            {
                messageId: timerData.messageId,
            },
            timerData
        );

        const row = new ActionRowBuilder();
        const button_join = new ButtonBuilder()
            .setCustomId(interaction.customId)
            .setLabel(`${timer_entries_count}`)
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

    static async giveaway_leave(interaction, timerData, guildData) {
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

        const timer_message = await interaction.channel.messages.fetch(
            interaction.message.reference.messageId
        );

        if (timerData.hasEnded === true) {
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

        if (!timerData.entries.includes(interaction.user.id)) {
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

        let timer_entries_count;
        const pullIndex = timerData.entries.indexOf(interaction.user.id);
        timerData.entries.splice(pullIndex, 1);
        timer_entries_count = timerData.entries.length;

        await GiveawayModel.findOneAndUpdate(
            {
                messageId: timerData.messageId,
            },
            timerData
        );

        const row = new ActionRowBuilder();
        const button_join = new ButtonBuilder()
            .setCustomId(`giveaway_join`)
            .setLabel(`${timer_entries_count}`)
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
        await timer_message.edit({
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

    static async timer_join(interaction, timerData, guildData) {
        timerData.users.push(interaction.user.id);
        await TimerModel.findOneAndUpdate(
            {
                messageId: timerData.messageId,
            },
            timerData
        );

        interaction.message.edit({
            components: [
                new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setCustomId(`timer_join`)
                        .setLabel(`${timerData.users.length}`)
                        .setEmoji(`${guildData.theme.emoji_join}`)
                        .setStyle(guildData.theme.button_style)
                ),
            ],
        });

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`\`You successfullly joined this timer\``)
                    .setColor("#69ff6e"),
            ],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Leave timer")
                        .setCustomId("timer_leave")
                        .setEmoji("<a:ravena_uncheck:1002983318565965885>")
                        .setStyle(4)
                ),
            ],
            ephemeral: true,
        });
    }

    static async timer_leave(interaction, timerData, guildData) {
        if (!interaction.message) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `\`Couldn't find timer message, this could be that the giveaway has been deleted\``
                        )
                        .setColor("#ffc182"),
                ],

                ephemeral: true,
            });
        }

        const timer_message = await interaction.channel.messages.fetch(
            interaction.message.reference.messageId
        );

        if (timerData.hasEnded === true) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `\`Timer ended, so you can no longer interact with it\``
                        )
                        .setColor("#ffc182"),
                ],

                ephemeral: true,
            });
        }

        if (interaction.user.id === timerData.hostId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `\`You are the host of this timer so you cannot leave it\``
                        )
                        .setColor("#ffc182"),
                ],
                ephemeral: true,
            });
        }

        if (!timerData.users.includes(interaction.user.id)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`\`You didn't join this timer\``)
                        .setColor("#ffc182"),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Timer")
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

        let timer_entries_count;
        const pullIndex = timerData.users.indexOf(interaction.user.id);
        timerData.users.splice(pullIndex, 1);
        timer_entries_count = timerData.users.length;

        await TimerModel.findOneAndUpdate(
            {
                messageId: timerData.messageId,
            },
            timerData
        );

        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`timer_join`)
                .setLabel(`${timer_entries_count}`)
                .setEmoji(`${guildData.theme.emoji_join}`)
                .setStyle(guildData.theme.button_style)
        );
        await timer_message.edit({
            components: [row],
        });

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`\`You successfully left the timer\``)
                    .setColor("#80a2ff"),
            ],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Timer")
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

    static async timer_end(client, timerData, guildData) {
        try {
            const channel = client.channels.cache.get(timerData.channelId);
            await TimerModel.findOneAndDelete({
                messageId: timerData.messageId,
            });

            if (channel) {
                try {
                    const timer_message = await channel.messages.fetch(
                        timerData.messageId
                    );
                    if (timer_message) {
                        const timer_duration = await time_humantime(
                            timerData.duration
                        );

                        timer_message.edit({
                            content: "`Timer has ended`",
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(`Timer`)
                                    .setImage(
                                        `https://media.discordapp.net/attachments/1001660282663337986/1030589604207796324/unknown.png?width=405&height=12`
                                    )
                                    .setDescription(
                                        `${
                                            guildData.theme.emoji_mainpoint
                                        }**Ended:** <t:${Math.floor(
                                            timerData.endsAt / 1000
                                        )}:R>\n${
                                            guildData.theme.emoji_mainpoint
                                        }**Lasted For:** \`${timer_duration}\`\n${
                                            guildData.theme.emoji_mainpoint
                                        }**Host:** <@${timerData.hostId}>${
                                            timerData.description
                                                ? `\n\n${timerData.description}`
                                                : ""
                                        }`
                                    ),
                            ],
                            components: [
                                new ActionRowBuilder().setComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`timer_join`)
                                        .setLabel(`${timerData.users.length}`)
                                        .setEmoji(
                                            `${guildData.theme.emoji_join}`
                                        )
                                        .setStyle(2)
                                        .setDisabled()
                                ),
                            ],
                        });

                        const messageTheshold = 75;
                        const messagesNeeded =
                            timerData.users.length / messageTheshold;

                        for (let i = 0; i < messagesNeeded; i++) {
                            const mentionsChunck = timerData.users.slice(
                                messageTheshold * i,
                                messageTheshold * (i + 1)
                            );
                            const mentionsChunck_map = mentionsChunck
                                .map((userId) => {
                                    return `<@${userId}>`;
                                })
                                .join(" ");

                            const timer_message_mentions =
                                await timer_message.channel.send({
                                    content: `${mentionsChunck_map}`,
                                });

                            setTimeout(function () {
                                timer_message_mentions.delete();
                            }, 500);
                        }
                        await timer_message.channel.send({
                            content: `\`Timer has ended\``,
                            embeds: [
                                new EmbedBuilder().setDescription(
                                    `${
                                        guildData.theme.emoji_mainpoint
                                    }**Host:** <@${timerData.hostId}>${
                                        timerData.description
                                            ? `\n\n${timerData.description}`
                                            : ``
                                    }`
                                ),
                            ],
                            components: [
                                new ActionRowBuilder().setComponents(
                                    new ButtonBuilder()
                                        .setStyle(5)
                                        .setLabel(`Timer`)
                                        .setEmoji(
                                            `${guildData.theme.emoji_join}`
                                        )
                                        .setURL(
                                            `https://discord.com/channels/${timerData.guildId}/${timerData.channelId}/${timerData.messageId}`
                                        )
                                ),
                            ],
                        });
                    }
                } catch (_) {
                    console.log(_);
                }
            }
        } catch (_) {}
    }
}

module.exports = Timerfunctions;
