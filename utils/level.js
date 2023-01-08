const fs = require("fs");

const USERMODEL = require("../models/userSchema");
const LVLCOOLDOWN = require("../cooldowns/exp.json");

const { user_fetch } = require("./user");
const { guild_fetch } = require("./guild");
const { EmbedBuilder } = require("discord.js");

class Levelfunctions {
    static async user_exp_add(client, message) {
        const userData = await user_fetch(message.author.id);
        const guildData = await guild_fetch(message.guild.id);
        const level_initial = userData.levelInfo.level;
        const cooldown = 5 * 1000;
        const INCREMENT = 35;
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

        await USERMODEL.findOneAndUpdate(
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

        await USERMODEL.findOneAndUpdate({ userId: userId }, userData);

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
