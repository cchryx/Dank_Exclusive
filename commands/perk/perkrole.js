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
        .setDescription(
            "Perk command: create/remove/edit your customrole.users"
        )
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
            subcommand
                .setName("delete")
                .setDescription("Delete your current role")
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("show").setDescription("Show your current role")
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
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("selfremove")
                .setDescription("Remove a perkrole from yourself")
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Valid role name within the server")
                        .setRequired(true);
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

            if (rolecreated === false) return;
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

            let slots_max = 0;
            let slots_used = userData.customrole.users.length;
            let hasroles_display;
            let slots_display;

            let hasroles = [];
            Object.keys(guildData.perkrole_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    slots_max = slots_max + guildData.perkrole_roles[key];
                    hasroles.push(key);
                }
            });

            if (slots_used > slots_max) {
                const removedusers = userData.customrole.users.slice(slots_max);
                removedusers.forEach(async (removedid) => {
                    const user = await interaction.guild.members.fetch(
                        removedid
                    );
                    user.roles.remove(userData.customrole.id);
                });
                userData.customrole.users = userData.customrole.users.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                slots_used = userData.customrole.users.length;
            }

            if (slots_used === 0) {
                slots_display = `\`no slots\``;
            } else {
                slots_display = userData.customrole.users
                    .map((user) => {
                        const slot_location =
                            userData.customrole.users.indexOf(user) + 1;
                        return `Slot ${slot_location}: <@${user}>`;
                    })
                    .join("\n");
            }

            if (guildData.perkrole_roles) {
                hasroles_display = Object.keys(guildData.perkrole_roles)
                    .map((key) => {
                        let status = "<a:ravena_uncheck:1002983318565965885>";

                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === key
                            )
                        ) {
                            status = "<a:ravena_check:1002981211708325950>";
                        }
                        return `${status}<@&${key}>\`+ ${guildData.perkrole_roles[key]}\``;
                    })
                    .join("\n");
            } else {
                hasroles_display = `\`server has no perkrole roles\``;
            }

            const sub_embed = new EmbedBuilder().setDescription(
                `\`\`\`diff\nSubcommands:\n- /perkrole userremove\n+ /perkrole useradd\`\`\``
            );
            const show_embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Perk Roles <a:crown:924052254074474567>")
                .setDescription(
                    `\`Slots is the number of users you are permitted to add\`\nRole: <@&${
                        userData.customrole.id
                    }>\n**Max Slots:** \`${slots_max.toLocaleString()}\`\n**Avaliable Slots:** \`${
                        slots_max - slots_used
                    }\``
                )
                .addFields(
                    {
                        name: "Your Slots ↭",
                        value: `${slots_display}`,
                        inline: true,
                    },
                    {
                        name: "Perkrole Roles ↭",
                        value: `${hasroles_display}`,
                        inline: true,
                    }
                );

            return interaction.reply({ embeds: [show_embed, sub_embed] });
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
            }

            const updaterole = await interaction.guild.roles
                .edit(role.id, roleinfo)
                .catch((error) => {
                    error_message = `\`${
                        error.rawError
                            ? error.rawError.message
                            : "There was an error"
                    }\``;
                    error_reply(interaction, error_message);
                    return false;
                });

            if (updaterole === false) return;

            let embedcolor;
            if (options.color) {
                embedcolor = options.color;
            } else {
                embedcolor = role.color;
            }

            const roleupdated = interaction.guild.roles.cache.get(role.id);

            const embed = new EmbedBuilder()
                .setColor(embedcolor)
                .setDescription(
                    `<a:ravena_check:1002981211708325950> **Role updated successfully**\n\nRole: <@&${
                        roleupdated.id
                    }>\nRole Id: \`${roleupdated.id}\`\nColor: \`${
                        options.color || role.color
                    }\``
                );

            if (options.uploadicon) {
                embed.setThumbnail(options.uploadicon.attachment);
            }
            return interaction.reply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "userremove") {
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
                user: interaction.options.getUser("user"),
            };

            let slots_max = 0;
            let slots_used = userData.customrole.users.length;
            let slots_display;
            let hasroles_display;
            let message;

            let hasroles = [];
            Object.keys(guildData.perkrole_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    slots_max = slots_max + guildData.perkrole_roles[key];
                    hasroles.push(key);
                }
            });

            if (slots_used === 0) {
                slots_display = `\`no slots\``;
            } else {
                slots_display = userData.customrole.users
                    .map((user) => {
                        const slot_location =
                            userData.customrole.users.indexOf(user) + 1;
                        return `Slot ${slot_location}: ${user}`;
                    })
                    .join("\n");
            }

            if (guildData.perkrole_roles) {
                hasroles_display = Object.keys(guildData.perkrole_roles)
                    .map((key) => {
                        let status = "<a:ravena_uncheck:1002983318565965885>";

                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === key
                            )
                        ) {
                            status = "<a:ravena_check:1002981211708325950>";
                        }
                        return `${status}<@&${key}>\`+ ${guildData.perkrole_roles[key]}\``;
                    })
                    .join("\n");
            } else {
                hasroles_display = `\`server has no perk perkrole roles\``;
            }

            if (slots_used >= slots_max) {
                const removedusers = userData.customrole.users.slice(slots_max);
                removedusers.forEach(async (removedid) => {
                    const user = await interaction.guild.members.fetch(
                        removedid
                    );
                    user.roles.remove(userData.customrole.id);
                });
                userData.customrole.users = userData.customrole.users.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                slots_used = userData.customrole.users.length;
            }

            let user = options.user;

            if (!userData.customrole.users.includes(`${options.user.id}`)) {
                message = `**That user doesn't exist in one of your user slots**\nUser: ${user}`;
                const error_embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(message);
                return interaction.reply({
                    embeds: [error_embed],
                    ephemeral: true,
                });
            }

            const pullIndex = userData.customrole.users.indexOf(user.id);
            userData.customrole.users.splice(pullIndex, 1);
            slots_used = slots_used - 1;

            await UserModel.findOneAndUpdate(
                { userid: interaction.user.id },
                userData
            );

            if (interaction.guild.members.cache.get(options.user.id)) {
                interaction.guild.members.cache
                    .get(options.user.id)
                    .roles.remove(userData.customrole.id);
            }

            message = `<a:ravena_check:1002981211708325950> **User removed successfully**\nYour Role: <@&${
                userData.customrole.id
            }>\nUser: ${user}\nAvaliable Slots: \`${slots_max - slots_used}\``;

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(message);
            return interaction.reply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "useradd") {
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
                user: interaction.options.getMember("user"),
            };

            if (!options.user) {
                error_message = `\`That user doesn't exist in the server\``;
                return error_reply(interaction, error_message);
            }

            if (options.user.id === interaction.user.id) {
                error_message = `\`You own the role so why give to yourself?\``;
                return error_reply(interaction, error_message);
            }

            let slots_max = 0;
            let slots_used = userData.customrole.users.length;
            let slots_display;
            let hasroles_display;
            let message;

            let hasroles = [];
            Object.keys(guildData.perkrole_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    slots_max = slots_max + guildData.perkrole_roles[key];
                    hasroles.push(key);
                }
            });

            if (slots_used === 0) {
                slots_display = `\`no slots\``;
            } else {
                slots_display = userData.customrole.users
                    .map((user) => {
                        const slot_location =
                            userData.customrole.users.indexOf(user) + 1;
                        return `Slot ${slot_location}: ${user}`;
                    })
                    .join("\n");
            }

            if (guildData.perkrole_roles) {
                hasroles_display = Object.keys(guildData.perkrole_roles)
                    .map((key) => {
                        let status = "<a:ravena_uncheck:1002983318565965885>";

                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === key
                            )
                        ) {
                            status = "<a:ravena_check:1002981211708325950>";
                        }
                        return `${status}<@&${key}>\`+ ${guildData.perkrole_roles[key]}\``;
                    })
                    .join("\n");
            } else {
                hasroles_display = `\`server has no perk perkrole roles\``;
            }

            if (slots_used >= slots_max) {
                const removedusers = userData.customrole.users.slice(slots_max);
                removedusers.forEach(async (removedid) => {
                    const user = await interaction.guild.members.fetch(
                        removedid
                    );
                    user.roles.remove(userData.customrole.id);
                });
                userData.customrole.users = userData.customrole.users.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                slots_used = userData.customrole.users.length;

                const sub_embed = new EmbedBuilder().setDescription(
                    `\`\`\`diff\nSubcommands:\n- /perkrole userremove\n# /perkrole show\`\`\``
                );
                message = `**You have reached you max amount of user slots of \`${slots_max}\`, so you aren't able to add more**`;
                const error_embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(message)
                    .addFields(
                        {
                            name: "Your Slots ↭",
                            value: `\`Slots is the number of users you are permitted to add\`\n**Max Slots:** \`${slots_max.toLocaleString()}\`\n**Avaliable Slots:** \`${
                                slots_max - slots_used
                            }\``,
                            inline: true,
                        },
                        {
                            name: "Perkrole Roles ↭",
                            value: `${hasroles_display}`,
                            inline: true,
                        }
                    );
                return interaction.reply({
                    embeds: [error_embed, sub_embed],
                    ephemeral: true,
                });
            }

            let user = options.user;

            if (userData.customrole.users.includes(`${options.user.id}`)) {
                message = `**That user already exist in one of your user slots**\nUser: ${user}`;
                const error_embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(message);
                return interaction.reply({
                    embeds: [error_embed],
                    ephemeral: true,
                });
            }

            userData.customrole.users.push(user.id);
            slots_used = slots_used + 1;

            await UserModel.findOneAndUpdate(
                { userid: interaction.user.id },
                userData
            );
            interaction.guild.members.cache
                .get(options.user.id)
                .roles.add(userData.customrole.id);
            message = `<a:ravena_check:1002981211708325950> **User added successfully**\nYour Role: <@&${
                userData.customrole.id
            }>\nUser: ${user}\nAvaliable Slots: \`${slots_max - slots_used}\``;

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(message);
            return interaction.reply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "delete") {
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
        } else if (interaction.options.getSubcommand() === "selfremove") {
            const options = {
                role: interaction.options.getRole("role"),
            };

            if (
                !interaction.member.roles.cache.find(
                    (r) => r.id === options.role.id
                )
            ) {
                error_message = `\`You don't currently have that role\``;
                return error_reply(interaction, error_message);
            }

            if (options.role.id === userData.customrole.id) {
                error_message = `\`You are the owner of this role so you have to do the following\`\`\`fix\n/perkrole delete\`\`\``;
                return error_reply(interaction, error_message);
            }

            const ownerofrole = await UserModel.findOne({
                "customrole.id": "1000887377499263116",
            });

            const user = await interaction.guild.members.fetch(
                interaction.user.id
            );
            user.roles.remove(options.role.id);

            let slots_used = ownerofrole.customrole.users.length;
            const pullIndex = ownerofrole.customrole.users.indexOf(user.id);
            ownerofrole.customrole.users.splice(pullIndex, 1);
            slots_used = slots_used - 1;

            await UserModel.findOneAndUpdate(
                { userid: ownerofrole.id },
                ownerofrole
            );

            message = `<a:ravena_check:1002981211708325950> **Role removed successfully**\nRole: <@&${options.role.id}>\nUser: <@${ownerofrole.userid}>`;

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(message);
            return interaction.reply({ embeds: [embed] });
        }
    },
};
