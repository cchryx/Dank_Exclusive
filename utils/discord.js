const { EmbedBuilder } = require("discord.js");

class Discordfunctions {
    static async discord_check_role(interaction, roles) {
        let allowaccess = true;
        roles.forEach((role) => {
            if (!interaction.member.roles.cache.has(role)) {
                return (allowaccess = false);
            }
        });

        return allowaccess;
    }

    static async discord_dissect_roles(interaction, string) {
        const roles = [];
        let roles_mapstring;
        const roles_keepnumbers = string.replace(/\D/g, " ");
        const roles_keepsplit = roles_keepnumbers.split(" ");
        const roles_numbers = [...new Set(roles_keepsplit)];

        roles_numbers.forEach((element) => {
            if (
                interaction.guild.roles.cache.find(
                    (role) => role.id === element
                )
            ) {
                roles.push(element);
            }
        });

        roles_mapstring = roles
            .map((element) => {
                return `<@&${element}>`;
            })
            .join(", ");

        if (string.includes("@everyone")) {
            roles.push("everyone");
            roles_mapstring =
                `@everyone${roles.length > 1 ? ", " : ""}` + roles_mapstring;
        }

        if (roles.length <= 0) {
            return [];
        } else {
            return {
                mapString: roles_mapstring,
                roles: roles,
            };
        }
    }
}

module.exports = Discordfunctions;
