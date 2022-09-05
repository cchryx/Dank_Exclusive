const { InteractionType, Collection, EmbedBuilder } = require("discord.js");

const GiveawayModel = require("../models/giveawaySchema");
const TimerModel = require("../models/timerSchema");

module.exports = {
    name: "messageDelete",
    async execute(message, client) {
        giveaway = await GiveawayModel.findOne({
            messageid: message.id,
        });
        if (giveaway) {
            await GiveawayModel.findOneAndDelete({ messageid: message.id });

            const embed = new EmbedBuilder()
                .setTitle("Giveaway has been deleted.")
                .setDescription(`\`\`\`json\n${giveaway}\`\`\``);
            const channel = client.channels.cache
                .get("1003661988351709244")
                .send({ embeds: [embed] });
        }

        timer = await TimerModel.findOne({
            messageid: message.id,
        });
        if (timer) {
            await TimerModel.findOneAndDelete({ messageid: message.id });

            const embed = new EmbedBuilder()
                .setTitle("Timer has been deleted.")
                .setDescription(`\`\`\`json\n${timer}\`\`\``);
            const channel = client.channels.cache
                .get("1003661988351709244")
                .send({ embeds: [embed] });
        }
    },
};
