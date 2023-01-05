const fs = require("fs");

const USERMODEL = require("../models/userSchema");
const LVLCOOLDOWN = require("../cooldowns/exp.json");

const { user_fetch } = require("./user");
const { guild_fetch } = require("./guild");

class Levelfunctions {
    static async user_exp_add(message) {
        const userData = await user_fetch(message.author.id);
        const guildData = await guild_fetch(message.guild.id);
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
    }

    static async user_level_modify(userId, action, value) {
        const userData = await user_fetch(userId);

        if (action === "add") {
            userData.levelInfo.level += value;
        } else if (action == "minus") {
            userData.levelInfo.level -= value;
        } else if (action == "set") {
            userData.levelInfo.level = value;
        }

        await USERMODEL.findOneAndUpdate({ userId: userId }, userData);

        return {
            action: action,
            value: value,
            newLevel: userData.levelInfo.level,
        };
    }
}

module.exports = Levelfunctions;
