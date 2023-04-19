const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const GuildModel = require("../../models/guildSchema");

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
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("edit")
                .setDescription("Edit the current theme of the server.")
                .addStringOption((oi) => {
                    return oi
                        .setRequired(true)
                        .setName("setting")
                        .setDescription(
                            "Which part of the theme do you want to edit?"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setRequired(true)
                        .setName("value")
                        .setDescription("What value do you want to use?");
                });
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

        if (interaction.options.getSubcommand() === "show") {
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
        } else if (interaction.options.getSubcommand() === "edit") {
            const options = {
                setting: interaction.options.getString("setting"),
                value: interaction.options.getString("value"),
            };
            const editable_elements = Object.keys(embed_theme);
            const old_value = embed_theme[options.setting];

            if (!editable_elements.includes(options.setting)) {
                error_message =
                    "There is no such setting! Run </theme show:1080271652199346206> to see all settings.";
                return error_reply(interaction, error_message);
            }

            guildData.theme[options.setting] =
                options.setting === "emoji_mainpoint" ||
                options.setting === "emoji_subpoint"
                    ? options.value + " "
                    : options.value;

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Update theme: SUCCESSFUL**\n*I edited the theme for you.*\n\nSetting: \`${
                            options.setting
                        }\`\nChanges:\n${old_value}\n\`TO\`\n${
                            guildData.theme[options.setting]
                        }`
                    ),
                ],
            });
        }
    },
};
