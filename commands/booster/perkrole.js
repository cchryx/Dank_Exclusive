const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkrole")
        .setDescription("Perk command: create/remove/edit your autoreaction")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create your role")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription(
                            "Valid role name with at least 1 character but the max is 100"
                        )
                        .setRequired(true);
                })
                .addAttachmentOption((oi) => {
                    return oi
                        .setName("uploadicon")
                        .setDescription("Valid non-animated image under 256KB");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("color")
                        .setDescription("Valid hex color");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("show").setDescription("Show your current role")
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("remove").setDescription("Remove your role")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("useradd")
                .setDescription("Choose a user to add your role to")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("A valid user that is in this server")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("userremove")
                .setDescription("Choose a user to remove your role from")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("A valid user that is in this server")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit your role: color, icon, name")
                .addAttachmentOption((oi) => {
                    return oi
                        .setName("uploadicon")
                        .setDescription("Valid non-animated image under 256KB");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription(
                            "Valid role name with at least 1 character but the max is 100"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("color")
                        .setDescription("Valid hex color");
                })
        ),
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        let userData = await user_fetch(interaction.user.id);
        let error_message;

        if (interaction.options.getSubcommand() !== "create") {
            if (!userData.customrole.id) {
                error_message = `\`You do not have your own role\`\n\`\`\`fix\n/perkrole create\`\`\``;
                return error_reply(interaction, error_message);
            }
        }

        if (interaction.options.getSubcommand() === "create") {
            if (!guildData.perkrole_head) {
                error_message = `\`This server doesn't have a head role where the perkroles can be put under\``;
                return error_reply(interaction, error_message);
            }
            let allowtocreate = false;
            const allowedroles = [];
            Object.keys(guildData.perkrole_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    return (allowtocreate = true);
                }
                allowedroles.push(key);
            });
            const allowedroles_mapped = allowedroles
                .map((element) => {
                    return `<@&${element}>\`+ ${guildData.perkrole_roles[element]}\``;
                })
                .join("\n");

            if (allowtocreate === false) {
                if (userData.customrole.id) {
                    interaction.guild.roles.delete(
                        userData.customrole.id,
                        "Didn't fulfill perkrole requirements"
                    );
                }
                userData.customrole.id = null;
                userData.customrole.users = [];
                await UserModel.findOneAndUpdate(
                    { userid: userData.userid },
                    userData
                );

                error_message = `\`You don't fulfill the requirements to have your own role\`\n\n**Perkrole roles:**\n${allowedroles_mapped}`;
                return error_reply(interaction, error_message);
            }
            if (userData.customrole.id) {
                error_message = `\`You already have your own role\`\n\`\`\`fix\n/perkrole edit\`\`\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                name: interaction.options.getString("name"),
                color: interaction.options.getString("color"),
                uploadicon: interaction.options.getAttachment("uploadicon"),
            };

            const roleinfo = {};
            const headrole = await interaction.guild.roles.fetch(
                guildData.perkrole_head
            );

            var validhex_reg = /^#([0-9a-f]{3}){1,2}$/i;
            if (validhex_reg.test(options.color) === false) {
                options.color = null;
            }

            roleinfo.name = options.name;
            roleinfo.color = options.color || null;
            // roleinfo.icon = options.icon || null;
            roleinfo.reason = "creating perk role";
            roleinfo.position = headrole.rawPosition - 1;

            const rolecreated = await interaction.guild.roles
                .create(roleinfo)
                .catch((error) => {
                    error_message = `\`${error.rawError.message}\``;
                    error_reply(interaction, error_message);
                    return false;
                });

            if (roleupdated === false) return;
            userData.customrole.id = rolecreated.id;
            interaction.guild.members.cache
                .get(interaction.user.id)
                .roles.add(rolecreated);
            await UserModel.findOneAndUpdate(
                { userid: userData.userid },
                userData
            );

            const embed = new EmbedBuilder()
                .setColor(rolecreated.color)
                .setDescription(
                    `<a:ravena_check:1002981211708325950> **Role created successfully**\n\nRole: <@&${rolecreated.id}>\nRole Id: \`${rolecreated.id}\`\nColor: \`${options.color}\`\nPosition: \`${rolecreated.rawPosition}\``
                );

            return interaction.reply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "show") {
            if (!userData.customrole.id) {
                error_message = `\`You do not have your own role\`\n\`\`\`fix\n/perkrole create\`\`\``;
                return error_reply(interaction, error_message);
            }
        } else if (interaction.options.getSubcommand() === "edit") {
            if (!guildData.perkrole_head) {
                error_message = `\`This server doesn't have a head role where the perkroles can be put under\``;
                return error_reply(interaction, error_message);
            }
            let allowtocreate = false;
            const allowedroles = [];
            Object.keys(guildData.perkrole_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    return (allowtocreate = true);
                }
                allowedroles.push(key);
            });
            const allowedroles_mapped = allowedroles
                .map((element) => {
                    return `<@&${element}>\`+ ${guildData.perkrole_roles[element]}\``;
                })
                .join("\n");

            if (allowtocreate === false) {
                if (userData.customrole.id) {
                    interaction.guild.roles.delete(
                        userData.customrole.id,
                        "Didn't fulfill perkrole requirements"
                    );
                }
                userData.customrole.id = null;
                userData.customrole.users = [];
                await UserModel.findOneAndUpdate(
                    { userid: userData.userid },
                    userData
                );

                error_message = `\`You don't fulfill the requirements to have your own role\`\n\n**Perkrole roles:**\n${allowedroles_mapped}`;
                return error_reply(interaction, error_message);
            }

            const options = {
                name: interaction.options.getString("name"),
                color: interaction.options.getString("color"),
                uploadicon: interaction.options.getAttachment("uploadicon"),
            };

            var validhex_reg = /^#([0-9a-f]{3}){1,2}$/i;
            if (validhex_reg.test(options.color) === false) {
                options.color = null;
            }

            const roleinfo = {};
            const role = await interaction.guild.roles.fetch(
                userData.customrole.id
            );

            roleinfo.name = options.name || role.name;
            roleinfo.color = options.color || role.color;

            if (options.uploadicon) {
                roleinfo.icon = options.uploadicon.attachment;
            } else {
                roleinfo.icon = role.icon;
            }

            const roleupdated = await interaction.guild.roles
                .edit(role.id, roleinfo)
                .catch((error) => {
                    error_message = `\`${error.rawError.message}\``;
                    error_reply(interaction, error_message);
                    return false;
                });

            if (roleupdated === false) return;

            let embedcolor;
            if (roleupdated.color) {
                embedcolor = roleupdated.color;
            } else {
                embedcolor = role.color;
            }

            const embed = new EmbedBuilder()
                .setColor(embedcolor)
                .setDescription(
                    `<a:ravena_check:1002981211708325950> **Role updated successfully**\n\nRole: <@&${
                        roleupdated.id
                    }>\nRole Id: \`${roleupdated.id}\`\nColor: \`${
                        options.color || role.color
                    }\``
                );
            return interaction.reply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "userremove") {
        } else if (interaction.options.getSubcommand() === "useradd") {
        } else if (interaction.options.getSubcommand() === "remove") {
            const roledeleted = interaction.guild.roles.cache.find(
                (r) => r.id === userData.customrole.id
            );

            interaction.guild.roles.delete(
                userData.customrole.id,
                "Delete perkrole"
            );
            userData.customrole.id = null;
            userData.customrole.users = [];
            await UserModel.findOneAndUpdate(
                { userid: userData.userid },
                userData
            );

            const embed = new EmbedBuilder()
                .setColor(roledeleted.color)
                .setDescription(
                    `<a:ravena_check:1002981211708325950> **Role removed successfully**\n\nRole: <@&${roledeleted.id}>\nRole Id: \`${roledeleted.id}\`\nPosition: \`${roledeleted.rawPosition}\``
                );

            return interaction.reply({ embeds: [embed] });
        }
    },
};
