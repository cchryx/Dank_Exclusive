const { EmbedBuilder } = require("discord.js");

const PchannelModel = require("../models/pchannelSchema");

class Partnershipfunctions {
    static async partnership_channel_delete(client, guildData, pchannelData) {
        try {
            const guild_discordData = await client.guilds.fetch(
                guildData.guildId
            );
            const partnership_channel_discordData = client.channels.cache.get(
                pchannelData.channelId
            );

            await PchannelModel.findOneAndDelete({
                channelId: pchannelData.channelId,
            });

            if (partnership_channel_discordData) {
                try {
                    if (guildData.miscData.roles.heistPartner) {
                        guild_discordData.members.cache
                            .get(pchannelData.ownerId)
                            .roles.remove(
                                guildData.miscData.roles.heistPartner
                            );
                    }

                    guild_discordData.channels.delete(
                        partnership_channel_discordData.id
                    );

                    if (guildData.miscData.channels.log) {
                        client.channels.cache
                            .get(guildData.miscData.channels.log)
                            .send({
                                embeds: [
                                    new EmbedBuilder().setDescription(
                                        `**Log partnership channel deletion: SUCCESSFUL**\n\nPartnership Manager: <@${pchannelData.ownerId}>\nChannel Id: \`${pchannelData.channelId}\``
                                    ),
                                ],
                            });
                    }
                } catch (_) {}
            }
        } catch (_) {}
    }
}

module.exports = Partnershipfunctions;
