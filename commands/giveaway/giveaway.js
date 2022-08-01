const ms = require("better-ms");
const humanizeDuration = require("humanize-duration");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageMentions: { USERS_PATTERN },
} = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

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
        .setName("giveaway")
        .setDescription("Giveaway stuff")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your current autoreactions")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("start")
                .setDescription("Choose an autoreaction to remove")
                .addStringOption((oi) => {
                    return oi
                        .setName("type")
                        .setDescription(
                            "Nitro, Dank Memer, Bro Bot, Xenon, or other"
                        )
                        .setRequired(true)
                        .addChoices(
                            { name: "Dank Memer", value: "dankmemer" },
                            { name: "Nitro", value: "nitro" },
                            { name: "Bro Bot", value: "brobot" },
                            { name: "Xenon", value: "xenon" },
                            { name: "Other", value: "other" }
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("prize")
                        .setDescription("Giveaway prize")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("time")
                        .setDescription(
                            "How long will the giveaway last, how much time do users get to enter"
                        )
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("winners")
                        .setDescription(
                            "How many winners can the giveaway have"
                        )
                        .setRequired(true);
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("donator")
                        .setDescription("Who donated to this giveaway")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("mentions")
                        .setDescription(
                            "Who will get pinged for this giveaway"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("reqroles")
                        .setDescription(
                            "Which roles do you need in order to join the giveaway, sparate by spaces"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("bypassroles")
                        .setDescription(
                            "What roles can bypass this giveaway, sparate by spaces"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription(
                            "Message that will be attached to the giveaway"
                        );
                })
        ),
    async execute(interaction, client) {
        const embedTheme = {
            color: "#f7cb8d",
            emoji_join: "<:smoothie:1003726574094397560>",
            emoji_mainpoint: "<:mainpoint_summer:1003711384028184658>",
            emoji_subpoint: "<a:subpoint_summer:1003716658277392484>",
            dividerurl:
                "https://media.discordapp.net/attachments/1003715669059178626/1003729430897770506/ezgif.com-gif-maker_14.gif",
        };
        if (interaction.options.getSubcommand() === "start") {
            const options = {
                type: interaction.options.getString("type"),
                prize: interaction.options.getString("prize"),
                time: interaction.options.getString("time"),
                winners: interaction.options.getNumber("winners"),
                donator: interaction.options.getMember("donator"),
                reqrole: interaction.options.getString("reqrole"),
                bypassroles: interaction.options.getString("bypassroles"),
                message: interaction.options.getString("message"),
                mentions: interaction.options.getString("mentions"),
            };

            let typeurl;
            if (options.type === "dankmemer") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729888785739907/memer.webp";
            } else if (options.type === "nitro") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729889150632027/EmSIbDzXYAAb4R7.png";
            } else if (options.type === "brobot") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729887531651193/e4ac5faef283425eb128dac16bbeb2c2.png?width=390&height=390";
            } else if (options.type === "xenon") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729888416632902/988082656505909268.gif";
            } else if (options.type === "other") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729887988809770/824918033889361941.gif";
            }

            options.winners = parseInt(options.winners);

            if (options.winners < 1) {
                message = `\`The amount of winners should be greater than 0\``;
                return error_reply(interaction, message);
            }

            let mentions;
            if (options.mentions) {
                mentions = options.mentions;
            } else {
                mentions = `\`no mentions for this giveaway\``;
            }

            const etime = `time: ` + options.time;
            const timeargs = etime.split(" ");
            timeargs.shift();

            const time = ms.getMilliseconds(timeargs[0]);

            if (!time) {
                message = `\`Couldn't parse ${timeargs[0]}\nExample: 1d1h12m\``;
                return error_reply(interaction, message);
            }
            const endtime = Date.now() + time;

            const giveaway_embed = new EmbedBuilder()
                .setTitle(`${options.prize}`)
                .setThumbnail(typeurl)
                .setColor(embedTheme.color)
                .setDescription(
                    `Click ${embedTheme.emoji_join} to enter\n\n${
                        embedTheme.emoji_mainpoint
                    }**Ending:** <t:${Math.floor(
                        endtime / 1000
                    )}:R> (\`${humantime(time)}\`)\n${
                        embedTheme.emoji_mainpoint
                    }**Host:** ${interaction.user}\n${
                        embedTheme.emoji_mainpoint
                    }**Donator:** ${options.donator}`
                )
                .setImage(embedTheme.dividerurl)
                .setFooter({
                    text: `Winners: ${options.winners.toLocaleString()}`,
                });
            const embeds = [giveaway_embed];

            if (options.message) {
                const message_embed = new EmbedBuilder()
                    .setColor(embedTheme.color)
                    .setDescription(`**Message:** ${options.message}`)
                    .setFooter({
                        url: options.donator.user.displayAvatarURL(),
                        text: `-${options.donator.user.tag}`,
                    });

                embeds.push(message_embed);
            }

            interaction.reply({
                content: "Giveaway started!",
                ephemeral: true,
            });
            return interaction.channel.send({
                content: mentions,
                embeds: embeds,
                allowedMentions: { parse: ["users", "roles"] },
            });
        } else if (interaction.options.getSubcommand() === "show") {
        }
    },
};
