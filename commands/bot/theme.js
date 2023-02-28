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
const { discord_check_role } = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("theme")
        .setDescription("Server theme commands.")
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("show")
                .setDescription("Show the current theme of the server.");
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

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Theme Settings`)
                    .setDescription(
                        `*Here lies all the themes.*\n\n${Object.keys(
                            embed_theme
                        )
                            .map((key) => {
                                return `\`${key}\`: ${embed_theme[key]}`;
                            })
                            .join("\n")}`
                    )
                    .setColor(embed_theme.color),
            ],
            components: [
                new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setDisabled()
                        .setStyle(embed_theme.button_style)
                        .setEmoji(`${embed_theme.emoji_join}`)
                        .setCustomId("null")
                ),
            ],
        });
    },
};
