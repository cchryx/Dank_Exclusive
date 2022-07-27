const { MessageEmbed } = require("discord.js");

class Errorfunctions {
    static async error_reply(interaction, message) {
        const embed = new MessageEmbed()
            .setDescription(message)
            .setColor("RED");

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

module.exports = Errorfunctions;
