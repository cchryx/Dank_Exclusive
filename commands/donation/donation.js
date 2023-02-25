const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const UserModel = require("../../models/userSchema");

const { error_reply } = require("../../utils/error");
const {
    donation_autoroles,
    donation_edit,
    donation_fetch,
} = require("../../utils/donation");
const { guild_fetch } = require("../../utils/guild");
const { discord_check_role } = require("../../utils/discord");
const { auto_log } = require("../../utils/auto");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donation")
        .setDescription("Donation commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your's or someone else's donations.")
                .addUserOption((oi) => {
                    return oi.setName("user").setDescription("Valid user.");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("leaderboard")
                .setDescription("Show donation leaderboard.")
                .addStringOption((oi) => {
                    return oi
                        .setName("category")
                        .setDescription(
                            "Which donation category do you want to edit?"
                        )
                        .setRequired(true)
                        .addChoices(
                            { name: "Dank Memer", value: "dankmemer" },
                            { name: "Investment", value: "investment" },
                            { name: "Bro Bot", value: "brobot" }
                        );
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Add, remove, set a user's donations.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription(
                            "Which user's donations do you want to edit."
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("category")
                        .setDescription(
                            "Which donation category do you want to edit?"
                        )
                        .setRequired(true)
                        .addChoices(
                            { name: "Dank Memer", value: "dankmemer" },
                            { name: "Investment", value: "investment" },
                            { name: "Bro Bot", value: "brobot" }
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("action")
                        .setDescription("Action you want to execute.")
                        .setRequired(true)
                        .addChoices(
                            { name: "set", value: "set" },
                            { name: "add", value: "add" },
                            { name: "minus", value: "minus" }
                        );
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("value")
                        .setDescription("Specify an number.")
                        .setRequired(true);
                })
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;

        const donation_icon = {
            dankmemer: "⏣",
            investment: "$",
            brobot: "💵",
        };

        if (interaction.options.getSubcommand() === "edit") {
            let error_message;
            const guildData = await guild_fetch(interaction.guildId);
            const checkAccess = await discord_check_role(interaction, [
                "1016888202725965864",
            ]);
            if (checkAccess === false) {
                error_message = "You don't have the roles to use this command.";
                return error_reply(interaction, error_message);
            }

            const options = {
                category: interaction.options.getString("category"),
                user: interaction.options.getMember("user"),
                action: interaction.options.getString("action"),
                value: interaction.options.getNumber("value"),
            };

            const donation_newtotal = await donation_edit(
                options.user.id,
                options.category,
                options.action,
                options.value
            );

            const donation_autorole = await donation_autoroles(
                options.user,
                guildData.donation.roles[options.category],
                donation_newtotal
            );

            await auto_log(interaction, {
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Edit donation: LOG**\n\nIssued By: ${
                            interaction.user
                        }\nUser Edited: ${options.user}\nCategory: \`${
                            options.category
                        }\`\nAction: \`${
                            options.action
                        }\`\nValue: \`${options.value.toLocaleString()}\`\nNew Total: \`${donation_newtotal.toLocaleString()}\`\n\n${donation_autorole}`
                    ),
                ],
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Edit donation: SUCCESSFUL**\n\nIssued By: ${
                            interaction.user
                        }\nUser Edited: ${options.user}\nCategory: \`${
                            options.category
                        }\`\nAction: \`${
                            options.action
                        }\`\nValue: \`${options.value.toLocaleString()}\`\nNew Total: \`${donation_newtotal.toLocaleString()}\`\n\n${donation_autorole}`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "show") {
            const options = {
                user: interaction.options.getMember("user"),
            };

            const target = options.user || interaction.user;
            const donationData = await donation_fetch(target.id);

            let donations_map = Object.keys(donationData)
                .map((key) => {
                    return `**${key}:** \`${donation_icon[key]} ${donationData[
                        key
                    ].toLocaleString()}\``;
                })
                .join("\n");

            if (Object.keys(donationData) <= 0) {
                donations_map = `\`no record of donations\``;
            }

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: `${target.tag || target.user.tag}`,
                            iconURL: target.displayAvatarURL(),
                        })
                        .setDescription(
                            `**Donations**\n*Here lies the donation logs for this user.*\n\n${donations_map}`
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "leaderboard") {
            const options = {
                category: interaction.options.getString("category"),
            };

            const usersData = await UserModel.find();
            let donation_sort = usersData.sort((a, b) => {
                if (!a.donation[options.category]) {
                    a.donation[options.category] = 0;
                }

                if (!b.donation[options.category]) {
                    b.donation[options.category] = 0;
                }

                return (
                    b.donation[options.category] - a.donation[options.category]
                );
            });

            donation_sort = donation_sort.slice(0, 15);
            const donation_leaderboard_display = donation_sort
                .map((userData, index) => {
                    return `**\`${index + 1}.\`** <@${userData.userId}> - \`${
                        donation_icon[options.category]
                    } ${
                        userData.donation[options.category]
                            ? userData.donation[
                                  options.category
                              ].toLocaleString()
                            : 0
                    }\``;
                })
                .join("\n");

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**Donation leaderboard: ${options.category.toUpperCase()}**\n*Showing donation leaderboard of the top 15 in ${
                                interaction.guild.name
                            }*\n\n${donation_leaderboard_display}`
                        )
                        .setThumbnail(interaction.guild.iconURL()),
                ],
            });
        }
    },
};
