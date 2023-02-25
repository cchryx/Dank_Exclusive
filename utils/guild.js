const { EmbedBuilder } = require("discord.js");

const GuildModel = require("../models/guildSchema");

class Guildfunctions {
    static async guild_fetch(guildId) {
        let guildData;
        try {
            guildData = await GuildModel.findOne({
                guildId: guildId,
            });
            if (!guildData) {
                let guildCreate = await GuildModel.create({
                    guildId: guildId,
                });

                guildCreate.save();
                guildData = guildCreate;
            }

            return guildData;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = Guildfunctions;
