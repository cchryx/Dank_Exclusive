const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelType,
    PermissionsBitField,
} = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkchannel")
        .setDescription(
            "Perk command: create a private channel and add/remove users"
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription(
                    "Show who is currently who has access to you private channel"
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("userrmove")
                .setDescription(
                    "Choose a user to remove from your private channel"
                )
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription(
                            "Valid user within the server or id for a user that has left"
                        )
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("useradd")
                .setDescription("Choose a user to add to your private channel")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Valid user within the server")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create private channel")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription("Valid channel name")
                        .setRequired(true);
                })
        ),
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        let userData = await user_fetch(interaction.user.id);

        if (interaction.options.getSubcommand() !== "create") {
            if (!userData.privatechannel.id) {
                error_message = `\`You do not have your own channel\`\n\`\`\`fix\n/perkchannel create\`\`\``;
                return error_reply(interaction, error_message);
            }
        }

        let slots_max = 0;
        let slots_used = userData.privatechannel.users.length;
        let hasroles_display;
        let slots_display;

        let hasroles = [];
        Object.keys(guildData.perkchannel_roles).forEach((key) => {
            if (interaction.member.roles.cache.find((r) => r.id === key)) {
                slots_max = slots_max + guildData.perkchannel_roles[key];
                hasroles.push(key);
            }
        });

        if (slots_used > slots_max) {
            const removedusers = userData.privatechannel.users.slice(slots_max);
            removedusers.forEach(async (removedid) => {
                const user = await interaction.guild.members.fetch(removedid);
                user.roles.remove(userData.privatechannel.id);
            });
            userData.privatechannel.users = userData.privatechannel.users.slice(
                0,
                slots_max
            );
            await UserModel.findOneAndUpdate(
                { userid: interaction.user.id },
                userData
            );
            slots_used = userData.privatechannel.users.length;
        }

        let slots_display_i;
        if (slots_used === 0) {
            slots_display = `\`no slots\``;
        } else {
            if (userData.privatechannel.users.length > 10) {
                slots_display_i = userData.privatechannel.users
                    .map((user) => {
                        const slot_location =
                            userData.privatechannel.users.indexOf(user) + 1;
                        return `<@${user}>`;
                    })
                    .join(" ");

                slots_display = `\`You have more than 10 slots, therefore they have been compressed in the embed bellow\``;
            } else {
                slots_display = userData.privatechannel.users
                    .map((user) => {
                        const slot_location =
                            userData.privatechannel.users.indexOf(user) + 1;
                        return `Slot ${slot_location}: <@${user}>`;
                    })
                    .join("\n");
            }
        }

        if (guildData.perkchannel_roles) {
            hasroles_display = Object.keys(guildData.perkchannel_roles)
                .map((key) => {
                    let status = "<a:ravena_uncheck:1002983318565965885>";

                    if (
                        interaction.member.roles.cache.find((r) => r.id === key)
                    ) {
                        status = "<a:ravena_check:1002981211708325950>";
                    }
                    return `${status}<@&${key}>\`+ ${guildData.perkchannel_roles[key]}\``;
                })
                .join("\n");
        } else {
            hasroles_display = `\`server has no perkrole roles\``;
        }

        let allowtocreate = false;
        const allowedroles = [];
        Object.keys(guildData.perkchannel_roles).forEach((key) => {
            if (interaction.member.roles.cache.find((r) => r.id === key)) {
                return (allowtocreate = true);
            }
            allowedroles.push(key);
        });
        const allowedroles_mapped = allowedroles
            .map((element) => {
                return `<@&${element}>\`+ ${guildData.perkchannel_roles[element]}\``;
            })
            .join("\n");

        if (allowtocreate === false) {
            if (userData.privatechannel.id) {
                interaction.guild.channels.delete(
                    userData.privatechannel.id,
                    "Didn't fulfill perkchannel requirements"
                );
            }
            userData.privatechannel.id = null;
            userData.privatechannel.users = [];
            await UserModel.findOneAndUpdate(
                { userid: userData.userid },
                userData
            );

            error_message = `\`You don't fulfill the requirements to have your own channel\`\n\n**Perkchannel roles:**\n${allowedroles_mapped}`;
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "show") {
            const sub_embed = new EmbedBuilder().setDescription(
                `\`\`\`diff\nSubcommands:\n- /perkchannel userremove\n+ /perkchannel useradd\`\`\``
            );
            const show_embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle(
                    "Perk Channels <:discord_hashtag:1005987413161680936>"
                )
                .setDescription(
                    `\`Slots is the number of users you are permitted to add\`\nChannel: <#${
                        userData.privatechannel.id
                    }>\n**Max Slots:** \`${slots_max.toLocaleString()}\`\n**Avaliable Slots:** \`${(
                        slots_max - slots_used
                    ).toLocaleString()}\``
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

            const embeds = [show_embed];

            if (slots_display_i) {
                embeds.push(new EmbedBuilder().setDescription(slots_display_i));
            } else {
                embeds.push(sub_embed);
            }
            return interaction.reply({ embeds: embeds });
        } else if (interaction.options.getSubcommand() === "create") {
            if (!guildData.perkchannel_head) {
                error_message = `\`This server doesn't have a parent channel where the perkchannels can be created under\``;
                return error_reply(interaction, error_message);
            }

            if (userData.privatechannel.id) {
                error_message = `\`You already have your own channel\`\n\`\`\`diff\n+ /perkchannel useradd\n- /perkchannel userremove\n# /perkchannel show\n# /perkchannel edit\n- /perkchannel delete\`\`\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                name: interaction.options.getString("name"),
            };

            const channelinfo = {};
            channelinfo.name = options.name;
            channelinfo.parent = guildData.perkchannel_head;
            channelinfo.type = ChannelType.GuildText;
            const permissionoverwrites = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.UseApplicationCommands,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.UseExternalEmojis,
                        PermissionsBitField.Flags.UseExternalStickers,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
            ];
            if (guildData.roles.bots) {
                permissionoverwrites.push({
                    id: guildData.roles.bots,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.UseApplicationCommands,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.UseExternalEmojis,
                        PermissionsBitField.Flags.UseExternalStickers,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                });
            }
            channelinfo.permissionOverwrites = permissionoverwrites;

            const channelcreated = await interaction.guild.channels
                .create(channelinfo)
                .catch((error) => {
                    error_message = `\`${error.rawError.message}\``;
                    error_reply(interaction, error_message);
                    return false;
                });

            if (channelcreated === false) return;
            channelcreated.send({
                content: `<@${interaction.user.id}>`,
                embeds: [
                    new EmbedBuilder()
                        .setColor("Random")
                        .setDescription(
                            `**Private Channel Created Successfully**\n\nChannel: <#${
                                channelcreated.id
                            }>\nChannel Id: \`${
                                channelcreated.id
                            }\`\nSlots Avaliable: \`${slots_max.toLocaleString()}\`\n\`\`\`diff\n+ /perkchannel useradd\n- /perkchannel userremove\n# /perkchannel show\n# /perkchannel edit\n- /perkchannel delete\`\`\``
                        ),
                ],
            });

            userData.privatechannel.id = channelcreated.id;
            await UserModel.findOneAndUpdate(
                { userid: userData.userid },
                userData
            );

            let newmessage = `<a:ravena_check:1002981211708325950> **Private Channel Created Successfully**\n\nChannel: <#${
                channelcreated.id
            }>\nChannel Id: \`${
                channelcreated.id
            }\`\nSlots Avaliable: \`${slots_max.toLocaleString()}\``;

            const embed = new EmbedBuilder()
                .setColor("Random")
                .setDescription(newmessage);

            return interaction.reply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "useradd") {
        } else if (interaction.options.getSubcommand() === "userremove") {
        }
    },
};
