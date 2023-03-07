const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const UserModel = require("../../models/userSchema");
const GuildModel = require("../../models/guildSchema");
const { guild_fetch } = require("../../utils/guild");
const { user_exp_calculation } = require("../../utils/level");
const { user_fetch } = require("../../utils/user");
const { discord_check_role } = require("../../utils/discord");

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
                .addStringOption((oi) =>
                    oi
                        .setName("category")
                        .setDescription(
                            "Which experience category do you want to view?"
                        )
                        .addChoices(
                            { name: "Main", value: "main" },
                            { name: "Temporary Experience", value: "tempexp" }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("resettempexp")
                .setDescription("Reset temporary experience")
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const INCREMENT = 50;
        let exp_cap;

        const guildData = await guild_fetch(interaction.guildId);

        if (interaction.options.getSubcommand() === "show") {
            const expData = await user_exp_calculation(interaction);
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
                    `**ᴘʀᴇꜱᴛɪɢᴇ:** \`${userData.levelInfo.prestige.toLocaleString()}\`\nᴇxᴘᴇʀɪᴇɴᴄᴇ ᴘᴇʀ ᴍᴇꜱꜱᴀɢᴇ: \`${expData.exp_increase.toLocaleString()}\`\nᴇxᴘᴇʀɪᴇɴᴄᴇ ᴄᴏᴏʟᴅᴏᴡɴ: \`${(
                        expData.cooldown / 1000
                    ).toLocaleString()} s\``
                )
                .addFields({
                    name: `** **`,
                    value: `**ʟᴇᴠᴇʟ:** \`${userData.levelInfo.level.toLocaleString()}\`\n**ᴇxᴘᴇʀɪᴇɴᴄᴇ:** \`${userData.levelInfo.exp.toLocaleString()}/${exp_cap.toLocaleString()}\`\n**ᴛᴏᴛᴀʟ ᴍᴇꜱꜱᴀɢᴇꜱ ꜱᴇɴᴛ:** \`${userData.levelInfo.messages.toLocaleString()}\``,
                })
                .addFields({
                    name: `** **`,
                    value: `**ᴛᴇᴍᴘᴏʀᴀʀʏ ʟᴇᴠᴇʟ:** \`${guildData.temporaryExp[
                        userDiscord.id
                    ].toLocaleString()}\``,
                });

            return interaction.reply({ embeds: [level_embed] });
        } else if (interaction.options.getSubcommand() === "leaderboard") {
            const options = {
                category: interaction.options.getString("category"),
            };
            if (options.category === "main") {
                const usersData = await UserModel.find();
                let level_sort = usersData.sort((a, b) => {
                    if (a.levelInfo.level === b.levelInfo.level) {
                        return b.levelInfo.exp - a.levelInfo.exp;
                    } else {
                        return b.levelInfo.level - a.levelInfo.level;
                    }
                });

                level_sort = level_sort.slice(0, 15);
                const level_leaderboard_display = level_sort
                    .map((userData, index) => {
                        exp_cap =
                            INCREMENT + userData.levelInfo.level * INCREMENT;

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
                                `**Level leaderboard: DISPLAY**\n*Showing level leaderboard of the top 15 in ${interaction.guild.name}*\n\n${level_leaderboard_display}`
                            )
                            .setThumbnail(interaction.guild.iconURL()),
                    ],
                });
            } else if ((options.category = "tempexp")) {
                let exp_sort = Object.keys(guildData.temporaryExp).sort(
                    (a, b) => {
                        return (
                            guildData.temporaryExp[b] -
                            guildData.temporaryExp[a]
                        );
                    }
                );

                exp_sort = exp_sort.slice(0, 15);
                const exp_leaderboard_display = exp_sort
                    .map((userId, index) => {
                        return `**\`${
                            index + 1
                        }.\`** <@${userId}> - **Experience** \`${
                            guildData.temporaryExp[userId]
                        }\``;
                    })
                    .join("\n");

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `**Temporary experience leaderboard: DISPLAY**\n*Showing temporary experience leaderboard of the top 15 in ${interaction.guild.name}*\n\n${exp_leaderboard_display}`
                            )
                            .setThumbnail(interaction.guild.iconURL()),
                    ],
                });
            }
        } else if (interaction.options.getSubcommand() === "resettempexp") {
            let exp_sort = Object.keys(guildData.temporaryExp).sort((a, b) => {
                guildData.temporaryExp[b] - guildData.temporaryExp[a];
            });

            exp_sort = exp_sort.slice(0, 15);
            const exp_leaderboard_display = exp_sort
                .map((userId, index) => {
                    return `**\`${
                        index + 1
                    }.\`** <@${userId}> - **Experience** \`${
                        guildData.temporaryExp[userId]
                    }\``;
                })
                .join("\n");

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                { $set: { temporaryExp: {} } }
            );

            interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Reset temporary experience: SUCCESSFUL**\n*I reset temporary experience, the leaderboard before reset is displayed below.*`
                    ),
                ],
            });

            return interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**Temporary experience leaderboard: DISPLAY**\n*Showing temporary experience leaderboard of the top 15 in ${interaction.guild.name}*\n\n${exp_leaderboard_display}`
                        )
                        .setThumbnail(interaction.guild.iconURL()),
                ],
            });
        }
    },
};
