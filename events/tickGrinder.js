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
const GrinderModel = require("../models/grinderSchema");

const { grinders_map, grinder_autokick } = require("../utils/grinder");

let mainCounter = 0;

module.exports = {
    name: "tickGrinder",
    once: false,
    async execute(client) {
        mainCounter++;
        const dankex_guildData = await GuildModel.findOne({
            guildId: "902334382939963402",
        });

        const grinder_query = await GrinderModel.find({});

        for (const grinderData of grinder_query) {
            const kickDate =
                grinderData.initialDate +
                grinderData.payments * 86400000 +
                3 * 86400000;
            if (Date.now() >= kickDate) {
                await grinder_autokick(client, dankex_guildData, grinderData);
            }
        }

        if (dankex_guildData.miscData.channels.grindersnotice) {
            if (mainCounter % 21600 === 0) {
                const grindernotice_channel = client.channels.cache.get(
                    dankex_guildData.miscData.channels.grindersnotice
                );

                let deleted;
                do {
                    deleted = await grindernotice_channel.bulkDelete(100);
                } while (deleted.size != 0);

                await grinders_map(grindernotice_channel, true);
            }
        }

        setTimeout(() => {
            client.emit("tickGrinder");
        }, 1000);
    },
};
