const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("level")
        .setDescription("Check the level of yourself or someone else.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Check the level of yourself or someone else.")
                .addUserOption((oi) =>
                    oi
                        .setName("user")
                        .setDescription("Specify a user within the server.")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("leaderboard")
                .setDescription("Show level leaderboard.")
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const INCREMENT = 60;
        let exp_cap;

        if (interaction.options.getSubcommand() === "show") {
            const level_embed = new EmbedBuilder();
            const options = {
                user: interaction.options.getUser("user"),
            };
            let userDiscord;
            let userData;

            if (!options.user) {
                userDiscord = interaction.user;
                userData = await user_fetch(interaction.user.id);
            } else {
                userDiscord = options.user;
                userData = await user_fetch(options.user.id);
            }

            exp_cap = INCREMENT + userData.levelInfo.level * INCREMENT;

            level_embed
                .setAuthor({
                    name: `${userDiscord.tag}`,
                    iconURL: userDiscord.displayAvatarURL(),
                })
                .setDescription(
                    `**ᴘʀᴇꜱᴛɪɢᴇ:** \`${userData.levelInfo.prestige.toLocaleString()}\``
                )
                .addFields({
                    name: `** **`,
                    value: `**ʟᴇᴠᴇʟ:** \`${userData.levelInfo.level.toLocaleString()}\`\n**ᴇxᴘᴇʀɪᴇɴᴄᴇ:** \`${userData.levelInfo.exp.toLocaleString()}/${exp_cap.toLocaleString()}\`\n**ᴛᴏᴛᴀʟ ᴍᴇꜱꜱᴀɢᴇꜱ ꜱᴇɴᴛ:** \`${userData.levelInfo.messages.toLocaleString()}\``,
                    inline: true,
                });

            return interaction.reply({ embeds: [level_embed] });
        } else if (interaction.options.getSubcommand() === "leaderboard") {
            const usersData = await UserModel.find();
            let level_sort = usersData.sort((a, b) => {
                if (a.levelInfo.level === b.levelInfo.level) {
                    return b.levelInfo.exp - a.levelInfo.exp;
                } else {
                    return b.levelInfo.level - a.levelInfo.level;
                }
            });

            level_sort = level_sort.slice(0, 15);
            const donation_leaderboard_display = level_sort
                .map((userData, index) => {
                    exp_cap = INCREMENT + userData.levelInfo.level * INCREMENT;

                    return `**\`${index + 1}.\`** <@${
                        userData.userId
                    }> - **level ${
                        userData.levelInfo.level
                            ? userData.levelInfo.level.toLocaleString()
                            : 0
                    }** \`${
                        userData.levelInfo.exp
                            ? userData.levelInfo.exp.toLocaleString()
                            : 0
                    }/${exp_cap.toLocaleString()}\``;
                })
                .join("\n");

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**Level leaderboard: DISPLAY**\n*Showing level leaderboard of the top 15 in ${interaction.guild.name}*\n\n${donation_leaderboard_display}`
                        )
                        .setThumbnail(interaction.guild.iconURL()),
                ],
            });
        }
    },
};
