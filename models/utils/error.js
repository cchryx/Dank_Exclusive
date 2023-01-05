const { EmbedBuilder } = require("discord.js");

class Errorfunctions {
    static async error_reply(interaction, message) {
        const embed = new EmbedBuilder()
            .setDescription(message)
            .setColor("Red");

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

module.exports = Errorfunctions;
