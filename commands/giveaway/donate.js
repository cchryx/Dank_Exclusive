const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donate")
        .setDescription("Mentions a staff member to handle donations")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("giveaway")
                .setDescription(
                    "Mentions a staff member to handle giveaway donations"
                )
                .addStringOption((oi) => {
                    return oi
                        .setName("prize")
                        .setDescription("Giveaway prizes")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("duration")
                        .setDescription("Giveaway duration")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("winners")
                        .setDescription("Giveaway winners")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requirements")
                        .setDescription("Giveaway requirements");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription("Giveaway message");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("specifications")
                        .setDescription(
                            "Giveaway specifications that may include how you want to giveaway to be handled"
                        );
                })
        ),
    // .addSubcommand((subcommand) =>
    //     subcommand
    //         .setName("event")
    //         .setDescription(
    //             "Mentions a staff member to handle event donations"
    //         )
    // )
    // .addSubcommand((subcommand) =>
    //     subcommand
    //         .setName("heist")
    //         .setDescription(
    //             "Mentions a staff member to handle heist donations"
    //         )
    // ),
    cooldown: 10,
    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === "giveaway") {
            const options = {
                requirements: interaction.options.getString("requirements"),
                prize: interaction.options.getString("prize"),
                duration: interaction.options.getString("duration"),
                winners: interaction.options.getNumber("winners"),
                message: interaction.options.getString("message"),
                specifications: interaction.options.getString("specifications"),
            };

            const gdonate_embed = new EmbedBuilder()
                .setTitle("New Giveaway Donation")
                .setColor("#deebff")
                .setDescription(
                    `<:aqua_dash:959862042515341423> **Sponsor:** ${
                        interaction.user
                    }\n<:aqua_dash:959862042515341423> **Duration:** \`${
                        options.duration
                    }\`\n<:aqua_dash:959862042515341423> **Winners:** \`${
                        options.winners
                    }\`\n<:aqua_dash:959862042515341423> **Prizes:** \`${
                        options.prize
                    }\`\n<:aqua_dash:959862042515341423> **Requirements:** \`${
                        options.requirements || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Specifications:** \`${
                        options.specifications || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Message:** \`${
                        options.message || "none"
                    }\``
                )
                .setThumbnail(`${interaction.user.displayAvatarURL()}`);

            interaction.reply({
                content: `Giveaway donation request submitted, please wait for giveaway manager to respond to this request.`,
                ephemeral: true,
            });
            interaction.channel.send({
                content: `<@&902372521213587456>`,
                embeds: [gdonate_embed],
            });
        }
    },
};
