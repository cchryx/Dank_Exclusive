const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("membercount")
        .setDescription("Check the amount of members in the server"),
    cooldown: 10,
    async execute(interaction, client) {
        const fetchmembers = await interaction.guild.members.fetch();
        const membercount = fetchmembers.filter((m) => !m.user.bot).size;
        const botcount = fetchmembers.filter((m) => m.user.bot).size;
        const verifiedcount = [];
        const verifiedmembers = fetchmembers.forEach((m) => {
            if (m.roles.cache.find((r) => r.id === "902356128581681173")) {
                verifiedcount.push(m.user.id);
            }
        });

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setDescription(
                `<a:wave_fast:973778295395074120>Humans: \`${membercount.toLocaleString()}\`\n<a:Bear_Waddle:912101291826749520>Bots: \`${botcount.toLocaleString()}\`\n<:greentick:909691152180080670>Verified: \`${verifiedcount.length.toLocaleString()}\``
            );

        interaction.reply({ embeds: [embed] });
    },
};
