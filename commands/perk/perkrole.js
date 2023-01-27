const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const PerkroleModel = require("../../models/perk/perkroleSchema");

const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");
const {
    perk_role_fetch,
    perk_slots_max,
    perk_role_create,
} = require("../../utils/perk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkrole")
        .setDescription("Perk command: create/remove/edit your perk role.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create your perk role.")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription(
                            "Valid role name with at least 1 character and a maximum of 100 characters."
                        )
                        .setRequired(true);
                })
                .addAttachmentOption((oi) => {
                    return oi
                        .setName("icon_upload")
                        .setDescription(
                            "Valid non-animated image under 256KB."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("icon_emoji")
                        .setDescription(
                            "Valid non-animated emoji under 256KB."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("color")
                        .setDescription("Valid hex color.");
                })
        )
        // .addSubcommand((subcommand) =>
        //     subcommand
        //         .setName("delete")
        //         .setDescription("Delete your current role.")
        // )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your perk role information.")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("useradd")
                .setDescription("Add your perk role to a user.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("A valid user that is in this server.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("userremove")
                .setDescription("Remove your perk role from a user.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("A valid user.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit your perk roles's color, icon, name.")
                .addAttachmentOption((oi) => {
                    return oi
                        .setName("icon_upload")
                        .setDescription(
                            "Valid non-animated image under 256KB."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("icon_emoji")
                        .setDescription(
                            "Valid non-animated emoji under 256KB."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription(
                            "Valid role name with at least 1 character and a maximum of 100 characters."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("color")
                        .setDescription("Valid hex color.");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("selfremove")
                .setDescription("Remove a perk role from yourself.")
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Valid perk role within the server.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("sync")
                .setDescription("Sync your users to your perk role.")
        ),
    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        let perkroleData = await perk_role_fetch(interaction.user.id);
        const slots_max = await perk_slots_max(
            interaction,
            guildData.perk.role
        );
        let perkrole_discordData;
        let slots_used = 0;
        let slots_used_display;

        if (perkroleData) {
            perkrole_discordData = await interaction.guild.roles.fetch(
                perkroleData.roleId
            );

            if (slots_max.slots_max === 0) {
                await PerkroleModel.findOneAndDelete({
                    userId: perkroleData.userId,
                });

                interaction.guild.roles.delete(perkroleData.roleId);
            }

            slots_used = perkroleData.users.length;

            if (slots_max.slots_max > 80) {
                slots_max.slots_max = 80;
            }

            if (slots_used > slots_max.slots_max) {
                const perkrole_users_flagged = perkroleData.users.slice(
                    slots_max.slots_max
                );
                perkroleData.users = perkroleData.users.slice(
                    0,
                    slots_max.slots_max
                );
                slots_used = perkroleData.users.length;

                for (const userId of perkrole_users_flagged) {
                    const flaggeduser_fetch =
                        await interaction.guild.members.fetch(userId);
                    flaggeduser_fetch.roles
                        .remove(perkroleData.roleId)
                        .catch((error) => {});

                    interaction.user.send({
                        embeds: [
                            new EmbedBuilder().setDescription(
                                `**Remove user from perkrole: COMPLETED**\n*User was over the limit of users having this perk role.*\n\nRole: <@&${
                                    perkroleData.roleId
                                }>\nRole Id: \`${
                                    perkroleData.roleId
                                }\`\nUser: <@${userId}>\nOccupied Slots: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\``
                            ),
                        ],
                    });
                }

                await PerkroleModel.findOneAndUpdate(
                    { userId: interaction.user.id },
                    perkroleData
                );
                slots_used = perkroleData.users.length;
            }

            if (slots_used === 0) {
                slots_used_display = `\`No slots used\``;
            } else {
                slots_used_display = perkroleData.users
                    .map((userId) => {
                        return `<@${userId}>`;
                    })
                    .join(", ");
            }
        }

        if (interaction.options.getSubcommand() === "create") {
            if (perkroleData) {
                error_message = `You already own a perk role, you can't create another one!\n\nRole: <@&${perkroleData.roleId}>`;
                return error_reply(interaction, error_message);
            }

            if (slots_max.slots_max === 0) {
                error_message = `You don't have any perk role slots to create a perk role.`;
                return error_reply(interaction, error_message);
            }

            if (!guildData.perk.placement.rolePlacer) {
                error_message = `Server has not set a role placer to place perk roles on top.`;
                return error_reply(interaction, error_message);
            }

            const options = {
                name: interaction.options.getString("name"),
                color: interaction.options.getString("color"),
                icon_upload: interaction.options.getAttachment("icon_upload"),
                icon_emoji: interaction.options.getString("icon_emoji"),
            };
            const perkrole_information = {};
            let perkrole_create_message;

            const perkrole_roleplacer = await interaction.guild.roles.fetch(
                guildData.perk.placement.rolePlacer
            );

            var validHex_reg = /^#([0-9a-f]{3}){1,2}$/i;
            if (validHex_reg.test(options.color) === false) {
                options.color = null;
            }

            if (options.icon_emoji) {
                perkrole_create_message = await interaction.reply({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Checking if the emoji is usable for an auto-reaction...**`
                        ),
                    ],
                    fetchReply: true,
                });

                const verifyEmoji = await perkrole_create_message
                    .react(`${options.icon_emoji}`)
                    .catch(async (error) => {
                        if (error.code === 10014) {
                            perkrole_create_message.edit({
                                embeds: [
                                    new EmbedBuilder()
                                        .setDescription(
                                            `**Your emoji was not valid!**\nYou need to provide a valid emoji that is from Dank Exclusive or can be used by the bot.`
                                        )
                                        .setColor("Red"),
                                ],
                            });
                            return false;
                        }
                    });

                if (verifyEmoji === false) {
                    return;
                }

                if (verifyEmoji._emoji.id) {
                    if (verifyEmoji._emoji.animated === true) {
                        return perkrole_create_message.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(
                                        `**Your emoji was not valid!**\nAnimated emojis don't work for role icons.`
                                    )
                                    .setColor("Red"),
                            ],
                        });
                    } else {
                        options.icon_emoji = `https://cdn.discordapp.com/emojis/${verifyEmoji._emoji.id}.webp`;
                    }
                } else {
                    return perkrole_create_message.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `**Your emoji was not valid!**\nCouldn't find emoji id.`
                                )
                                .setColor("Red"),
                        ],
                    });
                }
            }

            perkrole_information.name = options.name;
            perkrole_information.color = options.color || null;
            if (options.icon_upload) {
                perkrole_information.icon = options.icon_upload.attachment;
            }
            if (options.icon_emoji) {
                perkrole_information.icon = options.icon_emoji;
            }

            perkrole_information.position =
                perkrole_roleplacer.rawPosition + 1 || null;

            perkrole_discordData = await interaction.guild.roles
                .create(perkrole_information)
                .catch((error) => {
                    error_message = `${error.rawError.message}`;
                    error_reply(interaction, error_message);
                    return null;
                });

            if (perkrole_discordData === null) return;

            interaction.guild.members.cache
                .get(interaction.user.id)
                .roles.add(perkrole_discordData);

            await perk_role_create(
                interaction.user.id,
                perkrole_discordData.id
            );

            const perkrole_create_embed = new EmbedBuilder().setDescription(
                `**Create perk role: SUCCESSFUL**\n*I have made a perk role for you! Enjoy it!*\n\nRole: <@&${
                    perkrole_discordData.id
                }>\nRole Id: \`${
                    perkrole_discordData.id
                }\`\nOccupied Slots: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\`\n\n**Properties**\nColor: \`${
                    perkrole_discordData.color
                }\`\nPosition: \`${perkrole_discordData.rawPosition}\`${
                    options.icon_emoji
                        ? `\nIcon Emoji: [\`click here\`](${options.icon_emoji})`
                        : ""
                }`
            );

            if (options.icon_upload) {
                perkrole_create_embed.setThumbnail(
                    options.icon_upload.attachment
                );
            }

            if (perkrole_create_message) {
                return perkrole_create_message.edit({
                    embeds: [perkrole_create_embed],
                });
            } else {
                return interaction.reply({ embeds: [perkrole_create_embed] });
            }
        } else if (interaction.options.getSubcommand() === "show") {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Perk: Role`)
                        .setDescription(
                            `*Slots is the number of users you are permitted to add your perk role to in accordance to the roles you have.*\n\nPerk Role: ${
                                perkroleData
                                    ? `<@&${perkroleData.roleId}>`
                                    : "`null`"
                            }\nSlots Occupied: \`${slots_used}/${
                                slots_max.slots_max
                            }\``
                        )
                        .setFields(
                            {
                                name: "Perk-role Roles ↭",
                                value: slots_max.slots_hasroles_display,
                                inline: true,
                            },
                            {
                                name: "Occupied Slots ↭",
                                value: `${
                                    slots_used_display
                                        ? slots_used_display
                                        : `\`You don't own a perk role\``
                                }`,
                                inline: true,
                            }
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "edit") {
            if (!perkroleData) {
                error_message = `You don't own a perk role, therefore you cannot edit it.`;
                return error_reply(interaction, error_message);
            }

            const options = {
                name: interaction.options.getString("name"),
                color: interaction.options.getString("color"),
                icon_upload: interaction.options.getAttachment("icon_upload"),
                icon_emoji: interaction.options.getString("icon_emoji"),
            };
            const perkrole_information = {};
            let perkrole_edit_message;

            var validHex_reg = /^#([0-9a-f]{3}){1,2}$/i;
            if (validHex_reg.test(options.color) === false) {
                options.color = null;
            }

            if (options.icon_emoji) {
                perkrole_edit_message = await interaction.reply({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Checking if the emoji is usable for an auto-reaction...**`
                        ),
                    ],
                    fetchReply: true,
                });

                const verifyEmoji = await perkrole_edit_message
                    .react(`${options.icon_emoji}`)
                    .catch(async (error) => {
                        if (error.code === 10014) {
                            perkrole_edit_message.edit({
                                embeds: [
                                    new EmbedBuilder()
                                        .setDescription(
                                            `**Your emoji was not valid!**\nYou need to provide a valid emoji that is from Dank Exclusive or can be used by the bot.`
                                        )
                                        .setColor("Red"),
                                ],
                            });
                            return false;
                        }
                    });

                if (verifyEmoji === false) {
                    return;
                }

                if (verifyEmoji._emoji.id) {
                    if (verifyEmoji._emoji.animated === true) {
                        return perkrole_edit_message.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(
                                        `**Your emoji was not valid!**\nAnimated emojis don't work for role icons.`
                                    )
                                    .setColor("Red"),
                            ],
                        });
                    } else {
                        options.icon_emoji = `https://cdn.discordapp.com/emojis/${verifyEmoji._emoji.id}.webp`;
                    }
                } else {
                    return perkrole_edit_message.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `**Your emoji was not valid!**\nCouldn't find emoji id.`
                                )
                                .setColor("Red"),
                        ],
                    });
                }
            }

            perkrole_information.name =
                options.name || perkrole_discordData.name;
            perkrole_information.color =
                options.color || perkrole_discordData.color;
            if (options.icon_upload) {
                perkrole_information.icon = options.icon_upload.attachment;
            }
            if (options.icon_emoji) {
                perkrole_information.icon = options.icon_emoji;
            }

            perkrole_discordData = await interaction.guild.roles
                .edit(perkroleData.roleId, perkrole_information)
                .catch((error) => {
                    error_message = `${error.rawError.message}`;
                    error_reply(interaction, error_message);
                    return null;
                });

            if (perkrole_discordData === null) return;

            const perkrole_edit_embed = new EmbedBuilder().setDescription(
                `**Update perk role: SUCCESSFUL**\n*I made changes to the properties of your perk role.*\n\nRole: <@&${
                    perkrole_discordData.id
                }>\n\n**Properties**\nColor: \`${
                    perkrole_discordData.color
                }\`\nPosition: \`${perkrole_discordData.rawPosition}\`${
                    options.icon_emoji
                        ? `Icon Emoji: ${options.icon_emoji}`
                        : ""
                }`
            );

            if (options.icon_upload) {
                perkrole_edit_embed.setThumbnail(
                    options.icon_upload.attachment
                );
            }

            if (perkrole_edit_message) {
                return perkrole_edit_message.edit({
                    embeds: [perkrole_edit_embed],
                });
            } else {
                return interaction.reply({ embeds: [perkrole_edit_embed] });
            }
        } else if (interaction.options.getSubcommand() === "useradd") {
            if (!perkroleData) {
                error_message = `You don't own a perk role, therefore you cannot edit its name.`;
                return error_reply(interaction, error_message);
            }

            if (slots_used >= slots_max.slots_max) {
                error_message = `You have reached the maximum slots for your perk role, therefore you cannot add it to anymore users.\n\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                user: interaction.options.getMember("user"),
            };

            if (!options.user) {
                error_message = `That user doesn't exist in the server.`;
                return error_reply(interaction, error_message);
            }

            if (options.user.user.bot === true) {
                error_message = `You cannot add your perk role to a bot.`;
                return error_reply(interaction, error_message);
            }

            if (options.user.id === interaction.user.id) {
                error_message = `You own the role so why give to yourself?`;
                return error_reply(interaction, error_message);
            }

            if (perkroleData.users.includes(options.user.id)) {
                error_message = `That user already exist in one of your perk role user slosts!\n\nUser: ${options.user}`;
                return error_reply(interaction, error_message);
            }

            perkroleData.users.push(options.user.id);
            options.user.roles.add(perkroleData.roleId);

            await PerkroleModel.findOneAndUpdate(
                { userId: interaction.user.id },
                perkroleData
            );

            slots_used = perkroleData.users.length;

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk role add user: SUCCESSFUL**\n*I added your perk role to that user.*\n\nUser: ${options.user}\nRole: <@&${perkrole_discordData.id}>\nRole Id: \`${perkrole_discordData.id}\`\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "userremove") {
            if (!perkroleData) {
                error_message = `You don't own a perk role, therefore you cannot remove it from users.`;
                return error_reply(interaction, error_message);
            }

            if (perkroleData.users.length <= 0) {
                error_message = `You have no users occupying your perk role slots, therefore you can't remove your perk role from users.`;
                return error_reply(interaction, error_message);
            }

            const options = {
                user: interaction.options.getUser("user"),
            };

            if (!perkroleData.users.includes(options.user.id)) {
                error_message = `That user doesn't exist in one of your perk role user slots!\n\nUser: ${options.user}`;
                return error_reply(interaction, error_message);
            }

            if (options.user.id === interaction.user.id) {
                error_message = `Thats your own perk role so you can't remove yourself!`;
                return error_reply(interaction, error_message);
            }

            const user_fetch = await interaction.guild.members.fetch(
                options.user.id
            );
            user_fetch.roles.remove(perkroleData.roleId);
            perkroleData.users.splice(
                perkroleData.users.indexOf(options.user.id),
                1
            );
            await PerkroleModel.findOneAndUpdate(
                { userId: interaction.user.id },
                perkroleData
            );

            slots_used = perkroleData.users.length;

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk role remove user: SUCCESSFUL**\n*I removed your perk role from that user.*\n\nUser: ${options.user}\nRole: <@&${perkrole_discordData.id}>\nRole Id: \`${perkrole_discordData.id}\`\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "selfremove") {
            options = {
                role: interaction.options.getRole("role"),
            };
            
            const user_fetch = await interaction.guild.members.fetch(
                interaction.user.id
            );

            perkroleData = await PerkroleModel.findOne({
                roleId: options.role.id,
            });

            if (!perkroleData) {
                error_message = `This role is not registered as a perk role, if you believe this is a mistake please direct message the bot developer.`;
                return error_reply(interaction, error_message);
            }

            if (perkroleData.userId === interaction.user.id) {
                error_message = `Thats your own perk role so you can't remove it from yourself!`;
                return error_reply(interaction, error_message);
            }

            if (!perkroleData.users.includes(interaction.user.id)) {
                error_message = `You do not have this perk role assigned to you currently, therefore you cannot remove it from yourself.`;
                return error_reply(interaction, error_message);
            }

            user_fetch.roles.add(perkroleData.roleId);
            
            perkroleData.users.splice(
                perkroleData.users.indexOf(interaction.user.id),
                1
            );
            await PerkroleModel.findOneAndUpdate(
                { roleId: perkroleData.roleId },
                perkroleData
            );

            slots_used = perkroleData.users.length;

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Perk channel self remove: SUCCESSFUL**\n*I removed that perk role from you.*\n\n\nRole: <@&${perkroleData.roleId}>\nRole Id: \`${perkroleData.roleId}\`\nOwner: <@${perkroleData.userId}}>`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "sync") {
            if (!perkroleData) {
                error_message = `You don't own a perk role, therefore you cannot use this command.`;
                return error_reply(interaction, error_message);
            }

            const user_fetch = await interaction.guild.members.fetch(
                interaction.user.id
            );
            user_fetch.roles.add(perkroleData.roleId);

            perkroleData.users.forEach(async (userId) => {
                const flaggeduser_fetch = await interaction.guild.members.fetch(
                    userId
                );
                flaggeduser_fetch.roles.add(perkroleData.roleId);
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Sync perk role users: SUCCESSFUL**\n*I synced your perk channel users according what is stored.*\n\nRole: <@&${perkroleData.roleId}>\nRole Id: \`${perkroleData.roleId}\`\nSlots Occupied: \`${slots_used}/${slots_max.slots_max}\``
                    ),
                ],
            });
        }
    },
};
