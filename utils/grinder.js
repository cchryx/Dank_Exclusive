const { ButtonBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

const GrinderModel = require("../models/grinderSchema");

class GrinderFunctions {
    static async grinders_map(channel_discordData, warn_mentions) {
        let grinderDatas = await GrinderModel.find();
        grinderDatas = grinderDatas.sort((a, b) => {
            const nextPayment_a = a.initialDate + a.payments * 86400000;
            const nextPayment_b = b.initialDate + b.payments * 86400000;
            return nextPayment_a - nextPayment_b;
        });

        const embedTheshold = 25;
        const embedsNeeded = grinderDatas.length / embedTheshold;
        const embedsData = [];
        const warnMentionsIds = [];

        if (grinderDatas.length === 0) {
            embedsData.push(
                new EmbedBuilder()
                    .setTitle(`Grinders Notice Board`)
                    .setDescription("`No grinders.`")
            );
        } else {
            for (let i = 0; i < embedsNeeded; i++) {
                const grindersChunck = grinderDatas.slice(
                    embedTheshold * i,
                    embedTheshold * (i + 1)
                );

                const grinderDatas_map = grindersChunck
                    .map((grinderData) => {
                        const paymentDue =
                            grinderData.initialDate +
                            grinderData.payments * 86400000;
                        const timeLeft = paymentDue - Date.now();
                        let symbol;

                        if (timeLeft > 259200000) {
                            symbol = "<:warning_none:1070054131127025805>";
                        } else if (
                            timeLeft <= 259200000 &&
                            timeLeft > 86400000
                        ) {
                            symbol = "<:warning_time:1070054477584928798>";
                        } else {
                            symbol = "<:warning_servre:1070054714470834186>";
                        }

                        if (timeLeft <= 0) {
                            symbol = "<a:warning_flag:1070074604913168434>";
                            warnMentionsIds.push(grinderData.userId);
                        }

                        return `> ${symbol} <@${
                            grinderData.userId
                        }> - Next Payment: <t:${Math.floor(
                            paymentDue / 1000
                        )}:D> <t:${Math.floor(paymentDue / 1000)}:R>`;
                    })
                    .join("\n");

                const embedData = new EmbedBuilder().setDescription(
                    grinderDatas_map
                );

                if (i === 0) {
                    embedData.setTitle(`Grinders Notice Board`);
                }

                embedsData.push(embedData);
            }
        }

        if (warn_mentions === true) {
            channel_discordData.send({
                content: `**LATE PAYMENTS:**\n*You will be automatically kicked from grinder when you are 3 days late of payment.*\n${warnMentionsIds.map(
                    (id) => {
                        return `<@${id}>`;
                    }
                )}`,
            });
        }

        return embedsData.forEach((embed, index) => {
            if (index + 1 === embedsData.length) {
                channel_discordData.send({
                    embeds: [embed],
                    components: [
                        new ActionRowBuilder().setComponents(
                            new ButtonBuilder()
                                .setCustomId(`grinder_show`)
                                .setLabel(`Quick Find`)
                                .setStyle(ButtonStyle.Primary)
                        ),
                    ],
                });
            } else {
                channel_discordData.send({ embeds: [embed] });
            }
        });
    }

    static async grinder_autokick(client, guildData, grinderData) {
        const guild_discordData = await client.guilds.fetch(guildData.guildId);
        const user_discordData = await guild_discordData.members.fetch(
            grinderData.userId
        );

        if (guildData.miscData.channels.grindersnotice) {
            const grindernotice_channel = client.channels.cache.get(
                guildData.miscData.channels.grindersnotice
            );

            grindernotice_channel.send({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `${user_discordData} has been auto-kicked for not paying 3 days after deadline.`
                    ),
                ],
            });
        }

        if (user_discordData) {
            if (guildData.miscData.roles.grinder) {
                user_discordData.roles.remove(guildData.miscData.roles.grinder);
            }

            user_discordData
                .send({
                    content: `${user_discordData}`,
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Grinder: NOTICE**\n*You have been auto-kicked from the grinder team for not paying 3 days after deadline.*`
                        ),
                    ],
                })
                .catch((error) => {});
        }

        return await GrinderModel.findOneAndDelete({
            userId: user_discordData.user.id,
        });
    }

    static async grinder_reminder(client, guildData, grinderData) {
        const guild_discordData = await client.guilds.fetch(guildData.guildId);
        const user_discordData = await guild_discordData.members.fetch(
            grinderData.userId
        );

        if (user_discordData) {
            user_discordData
                .send({
                    content: `${user_discordData}`,
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Grinder: NOTICE**\n*You are being reminded that you are late 2 days for your grinder payment. You will be kicked from the grinder team automatically in 1 day if you do not pay in time.*\n\n`
                        ),
                    ],
                })
                .catch((error) => {});
        }
    }
}

module.exports = GrinderFunctions;
