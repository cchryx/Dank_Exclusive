const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const TimerModel = require("../../models/timerSchema");

const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");
const { time_format } = require("../../utils/time");
const { discord_check_role } = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timer")
        .setDescription("Start a timer.")
        .addStringOption((oi) => {
            return oi
                .setName("duration")
                .setDescription("How long the timer will last.")
                .setRequired(true);
        })
        .addStringOption((oi) => {
            return oi
                .setName("description")
                .setDescription("Timer description.");
        }),
    cooldown: 10,
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        const embed_theme = guildData.theme;
        let error_message;

        const checkAccess = await discord_check_role(interaction, [
            "904456239415697441",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        const options = {
            duration: interaction.options.getString("duration"),
            description: interaction.options.getString("description"),
        };

        // handle duration
        const timeData = await time_format(interaction, options.duration);
        if (timeData.status === false) {
            return;
        }

        interaction.reply({
            content: "`Timer started!`",
            ephemeral: true,
        });

        const timer_message = await interaction.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Timer`)
                    .setColor(embed_theme.color)
                    .setImage(embed_theme.divider_url)
                    .setDescription(
                        `${
                            embed_theme.emoji_mainpoint
                        }**Ending:** <t:${Math.floor(
                            timeData.endTime / 1000
                        )}:R> (\`duration: ${timeData.humanTime}\`)\n${
                            embed_theme.emoji_mainpoint
                        }**Host:** ${interaction.user}${
                            options.description
                                ? `\n\n${options.description}`
                                : ""
                        }`
                    ),
            ],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(embed_theme.button_style)
                        .setLabel(`1`)
                        .setCustomId("timer_join")
                        .setEmoji(embed_theme.emoji_join)
                ),
            ],
        });

        return TimerModel.create({
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            messageId: timer_message.id,
            hostId: interaction.user.id,
            duration: timeData.timeMilliseconds,
            endsAt: timeData.endTime,
            description: options.description,
            users: [interaction.user.id],
        });
    },
};
