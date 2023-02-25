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
const TimerModel = require("../models/timerSchema");

const { timer_end } = require("../utils/timer");

let mainCounter = 0;

module.exports = {
    name: "tickTimer",
    once: false,
    async execute(client) {
        mainCounter++;
        const dankex_guildData = await GuildModel.findOne({
            guildId: "902334382939963402",
        });

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

        setTimeout(() => {
            client.emit("tickTimer");
        }, 1000);
    },
};
