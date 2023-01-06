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
const TimerModel = require("../models/timerSchema");
const PchannelModel = require("../models/pchannelSchema");

const { giveaway_end } = require("../utils/giveaway");
const { partnership_channel_delete } = require("../utils/partnership");
const { timer_end } = require("../utils/timer");

let mainCounter = 0;

module.exports = {
    name: "tick",
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

        const timer_query = await TimerModel.find({
            endsAt: {
                $lt: new Date().getTime(),
            },
        });

        for (const timerData of timer_query) {
            if (Date.now() >= timerData.endsAt) {
                await timer_end(client, timerData, dankex_guildData);
            }
        }

        const pchannel_query = await PchannelModel.find({
            endsAt: {
                $lt: new Date().getTime(),
            },
        });

        for (const pchannelData of pchannel_query) {
            if (Date.now() >= pchannelData.expiresAt) {
                await partnership_channel_delete(
                    client,
                    dankex_guildData,
                    pchannelData
                );
            }
        }

        setTimeout(() => {
            client.emit("tick");
        }, 1000);
    },
};
