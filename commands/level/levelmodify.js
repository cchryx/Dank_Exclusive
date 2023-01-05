const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, Embed } = require("discord.js");
const { discord_check_role } = require("../../utils/discord");
const { error_reply } = require("../../utils/error");

const { user_level_modify } = require("../../utils/level");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("levelmodify")
        .setDescription("Check the level of yourself or someone else.")
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("add")
                .setDescription("Add levels to a user.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Specify a users")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("value")
                        .setDescription("Specify a number value.")
                        .setRequired(true);
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("minus")
                .setDescription("Minus levels to a user.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Specify a user.")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("value")
                        .setDescription("Specify a number value.")
                        .setRequired(true);
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("set")
                .setDescription("Set levels to a user.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Specify a user.")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("value")
                        .setDescription("Specify a number value.")
                        .setRequired(true);
                });
        }),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const checkAccess = await discord_check_role(interaction, [
            "904456239415697441",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        const options = {
            user: interaction.options.getUser("user"),
            value: interaction.options.getNumber("value"),
        };
        const modifiedLevelData = await user_level_modify(
            options.user.id,
            interaction.options.getSubcommand(),
            Math.floor(options.value)
        );

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setThumbnail(options.user.displayAvatarURL())
                    .setDescription(
                        `**New Level:** \`${modifiedLevelData.newLevel.toLocaleString()}\`\n**Action:** \`${
                            modifiedLevelData.action
                        }\`\n**Value:** \`${modifiedLevelData.value.toLocaleString()}\``
                    ),
            ],
        });
    },
};
