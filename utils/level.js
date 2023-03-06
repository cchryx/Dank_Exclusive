const fs = require("fs");

const UserModel = require("../models/userSchema");
const GuildModel = require("../models/guildSchema");
const LVLCOOLDOWN = require("../cooldowns/exp.json");

const { user_fetch } = require("./user");
const { guild_fetch } = require("./guild");
const { EmbedBuilder } = require("discord.js");

const cooldown = 5 * 1000;

class Levelfunctions {
    static async user_exp_add_message(client, message) {
        if (message.author.id === "685672031395905583") return; // blacklist poWer
        const userData = await user_fetch(message.author.id);
        const guildData = await guild_fetch(message.guild.id);
        const level_initial = userData.levelInfo.level;
        const INCREMENT = 50;
        const exp_cap = INCREMENT + userData.levelInfo.level * INCREMENT;
        let exp_increase = 1;
        let exp_multiplier = 1;
        let timeLeft;
        let readyTimestamp;
        let check;

        if (
            guildData.level.multipliers.channel.hasOwnProperty(
                message.channel.id
            )
        ) {
            exp_multiplier +=
                guildData.level.multipliers.channel[message.channel.id];
        }

        Object.keys(guildData.level.multipliers.role).forEach((role) => {
            try {
                if (message.member.roles.cache.has(role)) {
                    exp_multiplier += guildData.level.multipliers.role[role];
                }
                return;
            } catch (error) {
                return;
            }
        });

        userData.levelInfo.messages += 1;
        exp_increase *= exp_multiplier;

        if (!LVLCOOLDOWN.hasOwnProperty(message.author.id)) {
            LVLCOOLDOWN[message.author.id] = null;
        }

        readyTimestamp = LVLCOOLDOWN[message.author.id];
        if (!readyTimestamp) {
            readyTimestamp = 0;
        }

        timeLeft = new Date(readyTimestamp);
        check = timeLeft - Date.now() >= timeLeft || timeLeft - Date.now() <= 0;

        if (check) {
            if (message.channel.id === "908201143660859433") {
                guildData.temporaryExp[message.author.id] =
                    guildData.temporaryExp.hasOwnProperty(message.author.id)
                        ? guildData.temporaryExp[message.author.id] + 1
                        : 1;
                await GuildModel.findOneAndUpdate(
                    { guildId: guildData.guildId },
                    guildData
                );
            }
            userData.levelInfo.exp += exp_increase;

            if (userData.levelInfo.exp >= exp_cap) {
                userData.levelInfo.level += 1;
                userData.levelInfo.exp -= exp_cap;
            }

            readyTimestamp = Date.now() + cooldown;
            LVLCOOLDOWN[message.author.id] = readyTimestamp;
            fs.writeFile(
                "./cooldowns/exp.json",
                JSON.stringify(LVLCOOLDOWN),
                (error) => {
                    if (error) {
                        console.log(error);
                    }
                }
            );
        }

        await UserModel.findOneAndUpdate(
            { userId: message.author.id },
            userData
        );

        if (userData.levelInfo.level > level_initial) {
            if (guildData.level.channel) {
                client.channels.cache.get(guildData.level.channel).send({
                    content: `${message.author}`,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${message.author.tag}`)
                            .setDescription(
                                `**Level message: CONGRATULATIONS**\n*You are now \`level ${userData.levelInfo.level.toLocaleString()}\`*`
                            )
                            .setThumbnail(message.author.displayAvatarURL()),
                    ],
                });
            }
        }

        for (const role of Object.keys(guildData.level.roles)) {
            if (
                userData.levelInfo.level >= guildData.level.roles[role] &&
                message.member.roles.cache.has(role) === false
            ) {
                message.member.roles.add(role);
            } else if (
                userData.levelInfo.level < guildData.level.roles[role] &&
                message.member.roles.cache.has(role) === true
            ) {
                message.member.roles.remove(role);
            }
        }
    }

    static async user_exp_calculation(interaction) {
        const user_discordData = await interaction.guild.members.fetch(
            interaction.user.id
        );
        const userData = await user_fetch(user_discordData.user.id);
        const guildData = await guild_fetch(user_discordData.guild.id);
        let exp_increase = 1;
        let exp_multiplier = 1;

        if (
            guildData.level.multipliers.channel.hasOwnProperty(
                interaction.channelId
            )
        ) {
            exp_multiplier +=
                guildData.level.multipliers.channel[interaction.channelId];
        }

        Object.keys(guildData.level.multipliers.role).forEach((role) => {
            try {
                if (user_discordData.roles.cache.has(role)) {
                    exp_multiplier += guildData.level.multipliers.role[role];
                }
                return;
            } catch (error) {
                return;
            }
        });

        exp_increase *= exp_multiplier;

        return {
            cooldown,
            exp_multiplier,
            exp_increase,
        };
    }

    static async user_exp_add_interaction(client, message) {
        if (message.interaction.user.id === "685672031395905583") return; // blacklist poWer
        const user_discordData = await message.guild.members.fetch(
            message.interaction.user.id
        );
        const userData = await user_fetch(user_discordData.user.id);
        const guildData = await guild_fetch(user_discordData.guild.id);
        const level_initial = userData.levelInfo.level;
        const INCREMENT = 50;
        const exp_cap = INCREMENT + userData.levelInfo.level * INCREMENT;
        let exp_increase = 1;
        let exp_multiplier = 1;
        let timeLeft;
        let readyTimestamp;
        let check;

        if (
            guildData.level.multipliers.channel.hasOwnProperty(
                message.channel.id
            )
        ) {
            exp_multiplier +=
                guildData.level.multipliers.channel[message.channel.id];
        }

        Object.keys(guildData.level.multipliers.role).forEach((role) => {
            try {
                if (user_discordData.roles.cache.has(role)) {
                    exp_multiplier += guildData.level.multipliers.role[role];
                }
                return;
            } catch (error) {
                return;
            }
        });

        userData.levelInfo.messages += 1;
        exp_increase *= exp_multiplier;

        if (!LVLCOOLDOWN.hasOwnProperty(user_discordData.user.id)) {
            LVLCOOLDOWN[user_discordData.user.id] = null;
        }

        readyTimestamp = LVLCOOLDOWN[user_discordData.user.id];
        if (!readyTimestamp) {
            readyTimestamp = 0;
        }

        timeLeft = new Date(readyTimestamp);
        check = timeLeft - Date.now() >= timeLeft || timeLeft - Date.now() <= 0;

        if (check) {
            userData.levelInfo.exp += exp_increase;

            if (userData.levelInfo.exp >= exp_cap) {
                userData.levelInfo.level += 1;
                userData.levelInfo.exp -= exp_cap;
            }

            readyTimestamp = Date.now() + cooldown;
            LVLCOOLDOWN[user_discordData.user.id] = readyTimestamp;
            fs.writeFile(
                "./cooldowns/exp.json",
                JSON.stringify(LVLCOOLDOWN),
                (error) => {
                    if (error) {
                        console.log(error);
                    }
                }
            );
        }

        await UserModel.findOneAndUpdate(
            { userId: user_discordData.user.id },
            userData
        );

        if (userData.levelInfo.level > level_initial) {
            if (guildData.level.channel) {
                client.channels.cache.get(guildData.level.channel).send({
                    content: `${user_discordData.user}`,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${user_discordData.user.tag}`)
                            .setDescription(
                                `**Level message: CONGRATULATIONS**\n*You are now \`level ${userData.levelInfo.level.toLocaleString()}\`*`
                            )
                            .setThumbnail(
                                user_discordData.user.displayAvatarURL()
                            ),
                    ],
                });
            }
        }

        for (const role of Object.keys(guildData.level.roles)) {
            if (
                userData.levelInfo.level >= guildData.level.roles[role] &&
                user_discordData.roles.cache.has(role) === false
            ) {
                user_discordData.roles.add(role);
            } else if (
                userData.levelInfo.level < guildData.level.roles[role] &&
                user_discordData.roles.cache.has(role) === true
            ) {
                user_discordData.roles.remove(role);
            }
        }
    }

    static async user_level_modify(interaction, userId, action, value) {
        const userData = await user_fetch(userId);
        const guildData = await guild_fetch(interaction.guildId);
        const user_discordData = await interaction.guild.members.fetch(userId);

        if (action === "add") {
            userData.levelInfo.level += value;
        } else if (action == "minus") {
            userData.levelInfo.level -= value;
        } else if (action == "set") {
            userData.levelInfo.level = value;
        }

        await UserModel.findOneAndUpdate({ userId: userId }, userData);

        if (guildData.level.channel) {
            interaction.guild.channels.cache.get(guildData.level.channel).send({
                content: `${user_discordData.user}`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${user_discordData.user.tag}`)
                        .setDescription(
                            `**Level message: CONGRATULATIONS**\n*You are now \`level ${userData.levelInfo.level.toLocaleString()}\`*`
                        )
                        .setThumbnail(user_discordData.user.displayAvatarURL()),
                ],
            });
        }

        return {
            action: action,
            value: value,
            newLevel: userData.levelInfo.level,
        };
    }

    static async level_autoroles(user_discordData, roles, level) {
        for (const role of Object.keys(roles)) {
            if (
                level >= roles[role] &&
                user_discordData.roles.cache.has(role) === false
            ) {
                user_discordData.roles.add(role);
            } else if (
                level < roles[role] &&
                user_discordData.roles.cache.has(role) === true
            ) {
                user_discordData.roles.remove(role);
            }
        }
    }
}

module.exports = Levelfunctions;
