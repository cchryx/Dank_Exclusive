const {
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    TextChannel,
    Collection,
} = require("discord.js");
const humanizeDuration = require("humanize-duration");

const GiveawayModel = require("../models/giveawaySchema");

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

const embedTheme = {
    color: "#f7cb8d",
    emoji_join: "<:smoothie:1003726574094397560>",
    emoji_mainpoint: "<:mainpoint_summer:1004211052612944014>",
    emoji_subpoint: "<a:subpoint_summer:1003716658277392484>",
    dividerurl:
        "https://media.discordapp.net/attachments/1003715669059178626/1003729430897770506/ezgif.com-gif-maker_14.gif",
    button_style: 4,
};

let mainCounter = 0;

module.exports = {
    name: "tick",
    once: false,
    async execute(client) {
        mainCounter++;
        setTimeout(() => {
            client.emit("tick");
            nowTimestamp = new Date();
        }, 1000);

        const giveaway_query = await GiveawayModel.find({
            hasEnded: false,
            endsAt: {
                $lt: new Date().getTime(),
            },
        });

        for (const giveaway of giveaway_query) {
            if (Date.now() >= giveaway.endsAt) {
                const giveawayentries = [];
                if (giveaway.entries.length > 0) {
                    for (let i = 0; i < giveaway.winnersamount; i++) {
                        const choosewinner =
                            giveaway.entries[
                                Math.floor(
                                    Math.random() * giveaway.entries.length
                                )
                            ];

                        if (!choosewinner) {
                            continue;
                        }
                        const pullIndex =
                            giveaway.entries.indexOf(choosewinner);
                        giveaway.entries.splice(pullIndex, 1);
                        giveaway.winnersresults.push(choosewinner);
                        giveawayentries.push(choosewinner);
                    }
                }

                giveaway.entries = giveawayentries;
                giveaway.hasEnded = true;
                await GiveawayModel.findOneAndUpdate(
                    {
                        messageid: giveaway.messageid,
                    },
                    giveaway
                );

                try {
                    const channel = client.channels.cache.get(
                        giveaway.channelid
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
                                row.addComponents(button_join);

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

                                message.edit({
                                    content: "`Giveaway has ended`",
                                    embeds: embeds,
                                    components: [row],
                                });
                            }
                        } catch (_) {}
                    }
                } catch (_) {}
            }
        }
    },
};
