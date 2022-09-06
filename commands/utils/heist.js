const { SlashCommandBuilder } = require("@discordjs/builders");
const ms = require("better-ms");
const humanizeDuration = require("humanize-duration");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const TimerModel = require("../../models/timerSchema");
const GuildModel = require("../../models/guildSchema");
const { guild_checkperm_mod } = require("../../utils/guild");
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
        .setName("heist")
        .setDescription("Heist event related commands")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("timer")
                .setDescription("Set a timer for a heist")
                .addStringOption((oi) => {
                    return oi
                        .setName("time")
                        .setDescription("How long the timer will last")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("amount")
                        .setDescription("Heist amount")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("description")
                        .setDescription("Timer description");
                })
        ),
    cooldown: 10,
    async execute(interaction, client) {
        const dankexData = await GuildModel.findOne({
            guildId: "902334382939963402",
        });
        const embedTheme = dankexData.theme;
        
        if (interaction.options.getSubcommand() === "timer") {
            let message;

            if (
                !interaction.member.roles.cache.has("902358680748568596") ===
                true
            ) {
                message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, message);
            }

            const TimerModel = require("../../models/timerSchema");
            const options = {
                time: interaction.options.getString("time"),
                amount: interaction.options.getNumber("amount"),
                description: interaction.options.getString("description"),
            };

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
            const endtime = Date.now() + time;

            let display = `${
                embedTheme.emoji_mainpoint
            }**Heist Amount:** **\`⏣ ${options.amount.toLocaleString()}\`**\n${
                embedTheme.emoji_mainpoint
            }**Ending:** <t:${Math.floor(
                endtime / 1000
            )}:R> (\`duration: ${humantime(time)}\`)\n${
                embedTheme.emoji_mainpoint
            }**Host:** ${interaction.user}`;

            if (options.description) {
                display = display + `\n\n` + `${options.description}`;
            }

            const timer_embed = new EmbedBuilder()
                .setTitle(`Timer`)
                .setColor(embedTheme.color)
                .setDescription(display)
                .setImage(embedTheme.dividerurl);

            interaction.reply({
                content: "`Heist timer started!`",
                ephemeral: true,
            });

            const send_msg = await interaction.channel.send({
                content: `<@&902636766786371634>`,
                embeds: [timer_embed],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setStyle(embedTheme.button_style)
                            .setLabel(`1`)
                            .setCustomId("timer_join")
                            .setEmoji(embedTheme.emoji_join)
                    ),
                ],
            });

            return TimerModel.create({
                guildid: interaction.guildId,
                channelid: interaction.channelId,
                messageid: send_msg.id,
                hostid: interaction.user.id,
                duration: time,
                endsAt: endtime,
                mentions: [interaction.user.id],
                description: `**Heist Amount:** **\`⏣ ${options.amount.toLocaleString()}\`**${
                    options.description ? `\n${options.description}` : ""
                }`,
            });
        }
    },
};
