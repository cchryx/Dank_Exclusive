const { InteractionType, Collection, EmbedBuilder } = require("discord.js");

const GiveawayModel = require("../models/giveawaySchema");

module.exports = {
    name: "messageDelete",
    async execute(message, client) {
        giveaway = await GiveawayModel.findOne({
            messageid: message.id,
        });
        if (giveaway) {
            const embed = new EmbedBuilder()
                .setTitle("Giveaway has been deleted.")
                .setDescription(`\`\`\`json\n${giveaway}\`\`\``);
            const channel = client.channels.cache
                .get("909650135594729502")
                .send({ embeds: [embed] });
            await GiveawayModel.findOneAndDelete({ messageid: message.id });
        }
    },
};
