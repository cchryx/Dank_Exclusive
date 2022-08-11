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
        .setName("timer")
        .setDescription("Start a timer")
        .addStringOption((oi) => {
            return oi
                .setName("time")
                .setDescription("How long the timer will last")
                .setRequired(true);
        })
        .addStringOption((oi) => {
            return oi
                .setName("description")
                .setDescription("Timer description");
        }),
    cooldown: 10,
    async execute(interaction, client) {
        requiredperms = ["ManageChannels", "ManageGuild", "Administrator"];
        let message;
        let pass = await guild_checkperm_mod(interaction, requiredperms);

        if (!pass === true) {
            message = `\`You don't have the required permissions to preform this action\``;
            return error_reply(interaction, message);
        }

        const embedTheme = {
            color: "#f7cb8d",
            emoji_join: "<:smoothie:1003726574094397560>",
            emoji_mainpoint: "<:mainpoint_summer:1004211052612944014>",
            emoji_subpoint: "<a:subpoint_summer:1003716658277392484>",
            dividerurl:
                "https://media.discordapp.net/attachments/1003715669059178626/1003729430897770506/ezgif.com-gif-maker_14.gif",
            button_style: 4,
        };

        const options = {
            time: interaction.options.getString("time"),
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

        let display = `${embedTheme.emoji_mainpoint}**Ending:** <t:${Math.floor(
            endtime / 1000
        )}:R> (\`duration: ${humantime(time)}\`)\n${
            embedTheme.emoji_mainpoint
        }**Host:** ${interaction.user}`;

        if (options.description) {
            display = display + `\n\n` + `${options.description}`;
        }

        const giveaway_embed = new EmbedBuilder()
            .setTitle(`Timer`)
            .setColor(embedTheme.color)
            .setDescription(display)
            .setImage(embedTheme.dividerurl);

        interaction.reply({
            content: "`Timer started!`",
            ephemeral: true,
        });

        const send_msg = await interaction.channel.send({
            embeds: [giveaway_embed],
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
            description: options.description,
        });
    },
};
