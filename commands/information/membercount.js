const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

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

        const close_button = new ButtonBuilder()
            .setCustomId("membercount_close")
            .setEmoji("<a:X_:964313029732872242>")
            .setStyle(4);
        const membercount_msg = await interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(close_button)],
            fetchReply: true,
        });

        const collector = membercount_msg.createMessageComponentCollector({
            time: 10 * 1000,
        });

        let closed = false;
        collector.on("collect", async (button) => {
            if (button.user.id != interaction.user.id) {
                return button.reply({
                    content: "This is not for you.",
                    ephemeral: true,
                });
            }
            await button.deferUpdate();

            if (button.user.id === interaction.user.id) {
                closed = true;
                return membercount_msg.delete();
            }
        });

        collector.on("end", (collected) => {
            if (closed === false) {
                close_button.setDisabled();

                membercount_msg.edit({
                    components: [
                        new ActionRowBuilder().addComponents(close_button),
                    ],
                });
            }
            return;
        });
    },
};
