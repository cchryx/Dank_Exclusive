const {
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    TextChannel,
    Collection,
} = require("discord.js");

const GuildModel = require("../models/guildSchema");
const GiveawayModel = require("../models/giveawaySchema");

const { giveaway_end } = require("../utils/giveaway");

let mainCounter = 0;

module.exports = {
    name: "tickGiveaway",
    once: false,
    async execute(client) {
        mainCounter++;
        const dankex_guildData = await GuildModel.findOne({
            guildId: "902334382939963402",
        });

        const giveaway_query = await GiveawayModel.find({
            hasEnded: false,
            endsAt: {
                $lt: new Date().getTime(),
            },
        });

        for (const giveawayData of giveaway_query) {
            if (Date.now() >= giveawayData.endsAt) {
                await giveaway_end(client, giveawayData, dankex_guildData);
            }
        }

        setTimeout(() => {
            client.emit("tickGiveaway");
        }, 1000);
    },
};
