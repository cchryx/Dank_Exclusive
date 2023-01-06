const { EmbedBuilder } = require("discord.js");

const PerkchannelModel = require("../models/perkchannelSchema");
const PerkroleModel = require("../models/perkroleSchema");
const UserModel = require("../models/userSchema");

const { guild_fetch } = require("./guild");
const { user_fetch } = require("./user");

class Perkfunctions {
    static async perk_slots_max(interaction, perkData) {
        const slots_hasroles = [];
        let slots_max = 0;
        let slots_hasroles_display;

        if (Object.keys(perkData).length > 0) {
            Object.keys(perkData).forEach((roleId) => {
                if (
                    interaction.member.roles.cache.find(
                        (role) => role.id === roleId
                    )
                ) {
                    slots_max += perkData[roleId];
                    slots_hasroles.push(roleId);
                }
            });

            slots_hasroles_display = Object.keys(perkData)
                .map((roleId) => {
                    return `${
                        interaction.member.roles.cache.find(
                            (r) => r.id === roleId
                        )
                            ? "<a:ravena_check:1002981211708325950>"
                            : "<a:ravena_uncheck:1002983318565965885>"
                    }\`+ ${perkData[roleId]}\`<@&${roleId}>`;
                })
                .join("\n");
        } else {
            slots_hasroles_display = `\`This server has no perk auto-reaction roles\``;
        }

        return {
            slots_max: slots_max || 0,
            slots_hasroles: slots_hasroles,
            slots_hasroles_display: slots_hasroles_display,
        };
    }

    static async perk_slots_max_g(interaction, userId, perkData) {
        const slots_hasroles = [];
        let slots_max = 0;
        let slots_hasroles_display;

        const user_discordData = await interaction.guild.members.fetch(userId);

        if (user_discordData) {
            if (Object.keys(perkData).length > 0) {
                Object.keys(perkData).forEach((roleId) => {
                    if (
                        user_discordData.roles.cache.find(
                            (role) => role.id === roleId
                        )
                    ) {
                        slots_max += perkData[roleId];
                        slots_hasroles.push(roleId);
                    }
                });

                slots_hasroles_display = Object.keys(perkData)
                    .map((roleId) => {
                        return `${
                            user_discordData.roles.cache.find(
                                (r) => r.id === roleId
                            )
                                ? "<a:ravena_check:1002981211708325950>"
                                : "<a:ravena_uncheck:1002983318565965885>"
                        }\`+ ${perkData[roleId]}\`<@&${roleId}>`;
                    })
                    .join("\n");
            } else {
                slots_hasroles_display = `\`This server has no perk auto-reaction roles\``;
            }
        }

        return {
            slots_max: slots_max || 0,
            slots_hasroles: slots_hasroles,
            slots_hasroles_display: slots_hasroles_display,
        };
    }

    static async perk_channel_fetch(userId) {
        let perkchannelData;
        try {
            perkchannelData = await PerkchannelModel.findOne({
                userId: userId,
            });
            if (!perkchannelData) {
                perkchannelData = null;
            }
            return perkchannelData;
        } catch (error) {}
    }

    static async perk_channel_create(userId, channelId) {
        try {
            let perkchannelCreate = await PerkchannelModel.create({
                userId: userId,
                channelId: channelId,
            });

            perkchannelCreate.save();
        } catch (error) {}
    }

    static async perk_role_fetch(userId) {
        let perkroleData;
        try {
            perkroleData = await PerkroleModel.findOne({
                userId: userId,
            });
            if (!perkroleData) {
                perkroleData = null;
            }
            return perkroleData;
        } catch (error) {}
    }

    static async perk_role_create(userId, roleId) {
        try {
            let perkroleCreate = await PerkroleModel.create({
                userId: userId,
                roleId: roleId,
            });

            perkroleCreate.save();
        } catch (error) {}
    }

    static async perk_autoreaction(message, mentions, guildData) {
        mentions.forEach(async (mention) => {
            const userData = await user_fetch(mention.id);

            if (userData.autoReaction.length <= 0) return;

            let slots_max = 0;
            let slots_used = userData.autoReaction.length;

            for (const role of Object.keys(guildData.perk.autoReaction)) {
                if (mention.roles.cache.find((r) => r.id === role)) {
                    slots_max += guildData.perk.autoReaction[role];
                }
            }

            if (slots_max > 2) {
                slots_max = 2;
            }

            if (slots_used > slots_max) {
                userData.autoReaction = userData.autoReaction.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userId: userData.userId },
                    userData
                );
                slots_used = userData.autoReaction.length;
            }

            userData.autoReaction.forEach((emoji) => {
                return message.react(`${emoji}`).catch(async (error) => {
                    if (error.code === 10014) {
                        userData.autoReaction = [];
                        return await UserModel.findOneAndUpdate(
                            { userId: userData.userId },
                            userData
                        );
                    }
                });
            });
        });
    }
}

module.exports = Perkfunctions;
