class Utilsfunctions {
    static async roles_dissect(interaction, string) {
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
            return null;
        } else {
            return {
                mapstring: roles_mapstring,
                roles: roles,
            };
        }
    }
}

module.exports = Utilsfunctions;
