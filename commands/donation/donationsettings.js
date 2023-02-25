const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const GuildModel = require("../../models/guildSchema");

const { error_reply } = require("../../utils/error");
const { guild_fetch } = require("../../utils/guild");
const { discord_check_role } = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donationsettings")
        .setDescription("Donation settings commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("rolesshow")
                .setDescription("Show the donation settings roles.")
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        const checkAccess = await discord_check_role(interaction, [
            "904456239415697441",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "rolesshow") {
            let donationroles_dankmemer = guildData.donation.roles.dankmemer;
            let donationroles_investment = guildData.donation.roles.investment;
            let donationroles_brobot = guildData.donation.roles.brobot;

            donationroles_dankmemer = Object.keys(donationroles_dankmemer)
                .map((roleId) => {
                    return `\`${donationroles_dankmemer[
                        roleId
                    ].toLocaleString()}\` <@&${roleId}>`;
                })
                .join("\n");

            donationroles_investment = Object.keys(donationroles_investment)
                .map((roleId) => {
                    return `\`${donationroles_investment[
                        roleId
                    ].toLocaleString()}\` <@&${roleId}>`;
                })
                .join("\n");

            donationroles_brobot = Object.keys(donationroles_brobot)
                .map((roleId) => {
                    return `\`${donationroles_brobot[
                        roleId
                    ].toLocaleString()}\` <@&${roleId}>`;
                })
                .join("\n");

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**Donation settings: Auto-roles**`)
                        .setFields(
                            {
                                name: `Dank Memer`,
                                value: `${donationroles_dankmemer}`,
                                inline: true,
                            },
                            {
                                name: `Investment`,
                                value: `${donationroles_investment}`,
                                inline: true,
                            },
                            {
                                name: `Bro bot`,
                                value: `${donationroles_brobot}`,
                            }
                        ),
                ],
            });
        }
    },
};
