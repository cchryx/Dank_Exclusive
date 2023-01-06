const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

class Discordfunctions {
    static async discord_check_role(interaction, roles) {
        let allowaccess = true;
        roles.forEach((role) => {
            if (!interaction.member.roles.cache.has(role)) {
                return (allowaccess = false);
            }
        });
        
        if(interaction.member.roles.cache.has("938372143853502494")) {
            allowaccess = true
        }

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

    static async discord_self_role(interaction) {
        const roles_colour = [
            "954593618969128970",
            "953822186832015441",
            "902346605653532672",
            "902346604189724713",
            "902346606668550244",
            "902346605208944651",
            "902346605976506419",
            "902346605963931718",
            "902346603988406293",
        ];
        const roles_pronoun = [
            "909552802362179605",
            "909552712855728128",
            "909552894372638780",
        ];
        const user = await interaction.guild.members.fetch(interaction.user.id);
        let has_role_colour = false;
        let has_colour;
        let has_role_pronoun = false;
        let has_pronoun;

        roles_colour.forEach((role) => {
            if (interaction.member.roles.cache.has(role)) {
                has_colour = role;
                return (has_role_colour = true);
            }
        });

        roles_pronoun.forEach((role) => {
            if (interaction.member.roles.cache.has(role)) {
                has_pronoun = role;
                return (has_role_pronoun = true);
            }
        });

        if (
            has_role_colour === true &&
            roles_colour.includes(interaction.customId) &&
            has_colour !== interaction.customId
        ) {
            user.roles.remove(has_colour);
            user.roles.add(interaction.customId);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(`#f5ca93`)
                        .setDescription(
                            `**\`Successfully changed your color role\`**\nRemoved Role: <@&${has_colour}>\nAdded Role: <@&${interaction.customId}>`
                        ),
                ],
                components: [
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder()
                            .setStyle(5)
                            .setLabel(`Menu`)
                            .setURL(
                                `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                            )
                    ),
                ],
                ephemeral: true,
            });
        } else if (
            has_pronoun === true &&
            roles_pronoun.includes(interaction.customId) &&
            has_pronoun !== interaction.customId
        ) {
            user.roles.remove(has_pronoun);
            user.roles.add(interaction.customId);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(`#f5ca93`)
                        .setDescription(
                            `**\`Successfully changed your pronoun role\`**\nRemoved Role: <@&${has_pronoun}>\nAdded Role: <@&${interaction.customId}>`
                        ),
                ],
                components: [
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder()
                            .setStyle(5)
                            .setLabel(`Menu`)
                            .setURL(
                                `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                            )
                    ),
                ],
                ephemeral: true,
            });
        }

        if (interaction.member.roles.cache.has(interaction.customId)) {
            user.roles.remove(interaction.customId);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(`#f5ca93`)
                        .setDescription(
                            `**\`Successfully removed a role from you\`**\nRole: <@&${interaction.customId}>`
                        ),
                ],
                components: [
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder()
                            .setStyle(5)
                            .setLabel(`Menu`)
                            .setURL(
                                `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                            )
                    ),
                ],
                ephemeral: true,
            });
        } else {
            user.roles.add(interaction.customId);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(`#93f5b7`)
                        .setDescription(
                            `**\`Successfully added a role to you\`**\nRole: <@&${interaction.customId}>`
                        ),
                ],
                components: [
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder()
                            .setStyle(5)
                            .setLabel(`Menu`)
                            .setURL(
                                `https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${interaction.message.id}`
                            )
                    ),
                ],
                ephemeral: true,
            });
        }
    }
}

module.exports = Discordfunctions;
