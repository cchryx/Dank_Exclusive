const UserModel = require("../models/userSchema");

const { user_fetch } = require("./user");

class Donationfunctions {
    static async donation_autoroles(user_discordData, roles, total) {
        let donation_rolesmessage = `\`no roles were edited\``;
        const donation_rolesadded = [];
        const donation_rolesremoved = [];

        for (const role of Object.keys(roles)) {
            if (
                total >= roles[role] &&
                user_discordData.roles.cache.has(role) === false
            ) {
                user_discordData.roles.add(role);
                donation_rolesadded.push(role);
            } else if (
                total < roles[role] &&
                user_discordData.roles.cache.has(role) === true
            ) {
                donation_rolesremoved.push(role);
                user_discordData.roles.remove(role);
            }
        }

        if (donation_rolesadded.length > 0) {
            const role_added = donation_rolesadded
                .map((role) => {
                    return `<@&${role}>`;
                })
                .join("\n");

            if (donation_rolesmessage === `\`no roles were edited\``) {
                donation_rolesmessage = `**Roles Added:**\n${role_added}`;
            }
        }

        if (donation_rolesremoved.length > 0) {
            const role_removed = donation_rolesremoved
                .map((role) => {
                    return `<@&${role}>`;
                })
                .join("\n");

            if (donation_rolesmessage === `\`no roles were edited\``) {
                donation_rolesmessage = `**Roles Removed:**\n${role_removed}`;
            }
        }

        return donation_rolesmessage;
    }

    static async donation_fetch(userId, category) {
        const userData = await user_fetch(userId);
        const userData_donations = userData.donation;

        return userData_donations;
    }

    static async donation_edit(userId, category, action, value) {
        const userData = await user_fetch(userId);

        if (action === "set") {
            userData.donation[category] = value;
        } else if (action === "add") {
            if (!userData.donation[category]) {
                userData.donation[category] = value;
            } else {
                userData.donation[category] += value;
            }
        } else if (action === "minus") {
            if (!userData.donation[category]) {
                userData.donation[category] = -value;
            } else {
                userData.donation[category] -= value;
            }
        }

        await UserModel.findOneAndUpdate({ userId: userId }, userData);

        return userData.donation[category];
    }
}

module.exports = Donationfunctions;
