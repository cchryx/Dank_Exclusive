const { EmbedBuilder } = require("discord.js");

const GuildModel = require("../models/guildSchema");

class Guildfunctions {
    static async guild_checkperm(interaction, permissions) {
        let status;
        let guildData;
        try {
            guildData = await GuildModel.findOne({
                guildid: interaction.guildId,
            });
            if (!guildData) {
                let perms = await GuildModel.create({
                    guildid: interaction.guildId,
                });

                perms.save();

                guildData = perms;
            }
        } catch (error) {
            console.log(error);
        }

        if (guildData.moderation_roles.length > 0) {
            guildData.moderation_roles.forEach((roleid) => {
                const hasrole = interaction.member.roles.cache.some(
                    (role) => role.id === roleid
                );

                if (hasrole === true) {
                    status = true;
                }
            });
        }

        permissions.forEach((perm) => {
            if (interaction.member.permissions.has(perm)) {
                status = true;
            }
        });

        if (guildData.moderation_guildids.includes(interaction.guild.id)) {
            status = true;
        }
        return status;
    }
    static async guild_fetch(guildid) {
        let guildData;
        try {
            guildData = await GuildModel.findOne({
                guildid: guildid,
            });
            if (!guildData) {
                let guild = await GuildModel.create({
                    guildid: guildid,
                });

                guild.save();

                guildData = guild;
            }

            return guildData;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = Guildfunctions;
