const { EmbedBuilder } = require("discord.js");

const GuildModel = require("../models/guildSchema");

class Guildfunctions {
    static async guild_checkperm_mod(interaction, permissions) {
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

        if (guildData.moderation_userids.length > 0) {
            if (guildData.moderation_userids.includes(interaction.guild.id)) {
                status = true;
            }
        }

        return status;
    }

    static async guild_checkperm_giveaway(interaction, permissions) {
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

        if (guildData.giveaway_roles.length > 0) {
            guildData.giveaway_roles.forEach((roleid) => {
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

        if (guildData.giveaway_userids.length > 0) {
            if (guildData.giveaway_userids.includes(interaction.guild.id)) {
                status = true;
            }
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

    static async guild_checkrole(interaction, string) {
        const roles_array_fromstring = [];
        const roles_args = string.split(" ");
        let roles_mapstring;

        roles_args.forEach((roleid) => {
            if (
                interaction.guild.roles.cache.find((role) => role.id === roleid)
            ) {
                const fetchedrole = interaction.guild.roles.cache.find(
                    (r) => r.id === roleid
                );
                roles_array_fromstring.push(fetchedrole);
            }
        });

        const roles_array = [...new Set(roles_array_fromstring)];

        roles_mapstring = roles_array
            .map((element) => {
                return element;
            })
            .join(", ");

        if (roles_array.length <= 0) {
            return null;
        } else {
            return {
                mapstring: roles_mapstring,
                roles: roles_array,
            };
        }
    }
}

module.exports = Guildfunctions;
