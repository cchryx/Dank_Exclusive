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
const PchannelModel = require("../models/pchannelSchema");

const { partnership_channel_delete } = require("../utils/partnership");

let mainCounter = 0;

module.exports = {
    name: "tickPartnership",
    once: false,
    async execute(client) {
        mainCounter++;
        const dankex_guildData = await GuildModel.findOne({
            guildId: "902334382939963402",
        });

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
            client.emit("tickPartnership");
        }, 1000);
    },
};
