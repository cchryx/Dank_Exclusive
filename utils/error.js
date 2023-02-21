const { EmbedBuilder } = require("discord.js");

const { guild_fetch } = require("./guild");

class Errorfunctions {
    static async error_reply(interaction, message) {
        const embed = new EmbedBuilder()
            .setDescription(message)
            .setColor("Red");

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    static async error_log(client, data) {
        const guildData = await guild_fetch("902334382939963402");

        if (guildData.miscData.channels.errorlog) {
            client.channels.cache
                .get(guildData.miscData.channels.errorlog)
                .send({
                    embeds: [new EmbedBuilder().setDescription(`\`${data}\``)],
                });
        }
    }
}

module.exports = Errorfunctions;
