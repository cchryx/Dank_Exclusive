const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageMentions: { USERS_PATTERN },
} = require("discord.js");

const UserModel = require("../../models/userSchema");
const GuildModel = require("../../models/guildSchema");
const GiveawayModel = require("../../models/giveawaySchema");

const { user_fetch } = require("../../utils/user");
const { error_reply } = require("../../utils/error");
const { giveaway_check_mentioncd } = require("../../utils/giveaway");
const {
    discord_check_role,
    discord_dissect_roles,
} = require("../../utils/discord");
const { guild_fetch } = require("../../utils/guild");
const { time_format } = require("../../utils/time");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Giveaway actions.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("cleanup")
                .setDescription(
                    "Delete all giveawys that have ended from databse."
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a new giveaway.")
                .addStringOption((oi) => {
                    return oi
                        .setName("prize")
                        .setDescription("Giveaway prize.")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("duration")
                        .setDescription(
                            "How long will the giveaway last, how much time do users get to enter (example: 1h2m9s)."
                        )
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("winners")
                        .setDescription(
                            "How many winners can the giveaway have."
                        )
                        .setRequired(true);
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("sponsor")
                        .setDescription("Who donated to this giveaway.")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("globalbypass")
                        .setDescription(
                            "Include global bypass in this giveaway?"
                        )
                        .addChoices(
                            {
                                name: "True",
                                value: "true",
                            },
                            { name: "False", value: "false" }
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("mention")
                        .setDescription(
                            "Which role will be mentioned for this giveaway."
                        )
                        .addChoices(
                            {
                                name: "Massive Giveaway",
                                value: "902635820014505987",
                            },
                            { name: "Giveaway", value: "902412470365347870" },
                            {
                                name: "Nitro Giveaway",
                                value: "932718201723306084",
                            },
                            { name: "Bro Bot", value: "928366279109279806" }
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requiredroles")
                        .setDescription(
                            "Id or mention roles separated by space."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requiredchat")
                        .setDescription(
                            "Amount of messages needed to be sent in a certain channel separated by space. [channel] [messages]"
                        );
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("requiredlevel")
                        .setDescription("Number value.");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("bypassroles")
                        .setDescription(
                            "Id or mention roles separated by space."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("blacklistroles")
                        .setDescription(
                            "Id or mention roles separated by space."
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription(
                            "Message that will be attached to the giveaway."
                        );
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("mention")
                .setDescription("Mention a giveaway")
                .addUserOption((oi) => {
                    return oi
                        .setName("sponsor")
                        .setDescription("Who sponsored to this giveaway.")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("mention")
                        .setDescription(
                            "Which role will be mentioned for this giveaway."
                        )
                        .addChoices(
                            {
                                name: "Massive Giveaway",
                                value: "902635820014505987",
                            },
                            { name: "Giveaway", value: "902412470365347870" },
                            {
                                name: "Nitro Giveaway",
                                value: "932718201723306084",
                            },
                            { name: "Bro Bot", value: "928366279109279806" }
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription(
                            "Message that will be attached to the giveaway."
                        );
                })
        ),
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        const embed_theme = guildData.theme;
        let error_message;

        const checkAccess = await discord_check_role(interaction, [
            "902372521213587456",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "create") {
            const options = {
                type: interaction.options.getString("type"),
                prize: interaction.options.getString("prize"),
                duration: interaction.options.getString("duration"),
                winners: interaction.options.getNumber("winners"),
                sponsor: interaction.options.getMember("sponsor"),
                requiredroles: interaction.options.getString("requiredroles"),
                bypassroles: interaction.options.getString("bypassroles"),
                blacklistroles: interaction.options.getString("blacklistroles"),
                message: interaction.options.getString("message"),
                requiredlevel: interaction.options.getNumber("requiredlevel"),
                mention: interaction.options.getString("mention"),
                globalbypass: interaction.options.getString("globalbypass"),
                requiredchat: interaction.options.getString("requiredchat"),
            };

            // handle winners
            options.winners = Math.floor(options.winners);
            if (options.winners < 1) {
                options.winners *= -1;
            }

            // handle duration
            const timeData = await time_format(interaction, options.duration);
            if (timeData.status === false) {
                return;
            }

            const requiredChat_string = options.requiredchat;
            let requiredChat;
            let requiredChat_raw;
            let requiredChat_arguments;
            let requiredChat_channel;
            let requiredChat_messages;
            if (options.requiredchat) {
                requiredChat_arguments = requiredChat_string.split(" ");
                requiredChat_arguments = requiredChat_arguments.filter(Boolean);
                requiredChat_channel = requiredChat_arguments[0];
                requiredChat_messages = parseInt(requiredChat_arguments[1]);

                if (!requiredChat_messages) {
                    error_message = `Couldn't convert amount of messages to an interger.\nAurgument Syntax: \`[channel] [messages]\``;
                    return error_reply(interaction, error_message);
                }

                if (requiredChat_messages < 1) {
                    options.winners *= -1;
                }

                requiredChat_channel = requiredChat_channel.replace(/\D/g, "");
                const requiredChat_channel_validation =
                    client.channels.cache.get(requiredChat_channel);

                if (!requiredChat_channel_validation) {
                    error_message = `Couldn't find that channel in this server.\nAurgument Syntax: \`[channel] [messages]\``;
                    return error_reply(interaction, error_message);
                }

                requiredChat_raw = {
                    channel: requiredChat_channel,
                    messages: requiredChat_messages,
                };

                requiredChat = {
                    channel: requiredChat_channel,
                    messages: requiredChat_messages,
                    users_progress: {},
                };
            }

            const rolesData = {};
            const rolesData_raw = {};

            if (options.requiredroles) {
                rolesData.required = await discord_dissect_roles(
                    interaction,
                    options.requiredroles
                );
            }

            if (rolesData.required) {
                rolesData.required.display = `${embed_theme.emoji_subpoint}**Required Roles:** ${rolesData.required.mapString}`;
                rolesData_raw.required = rolesData["required"].roles;
            }

            if (options.bypassroles) {
                rolesData.bypass = await discord_dissect_roles(
                    interaction,
                    options.bypassroles
                );
            }

            if (rolesData.bypass) {
                rolesData.bypass.display = `${embed_theme.emoji_subpoint}**Bypass Roles:** ${rolesData.bypass.mapString}`;
                rolesData_raw.bypass = rolesData["bypass"].roles;
            }

            if (options.blacklistroles) {
                rolesData.blacklist = await discord_dissect_roles(
                    interaction,
                    options.blacklistroles
                );
            }

            if (rolesData.blacklist) {
                rolesData.blacklist.display = `${embed_theme.emoji_subpoint}**Blacklisted Roles:** ${rolesData.blacklist.mapString}`;
                rolesData_raw.blacklist = rolesData["blacklist"].roles;
            }

            if (rolesData_raw.required && rolesData_raw.bypass) {
                let repeat = false;
                rolesData_raw.required.forEach((role) => {
                    if (rolesData_raw.bypass.includes(role)) {
                        repeat = true;
                    }
                });

                if (repeat === true) {
                    message = `\`Not allowing repeating roles in required and bypass\``;
                    return error_reply(interaction, message);
                }
            }

            if (rolesData_raw.required && rolesData_raw.blacklist) {
                let repeat = false;
                rolesData_raw.required.forEach((role) => {
                    if (rolesData_raw.blacklist.includes(role)) {
                        repeat = true;
                    }
                });

                if (repeat === true) {
                    message = `\`Not allowing repeating roles in required and blacklist\``;
                    return error_reply(interaction, message);
                }
            }

            if (rolesData_raw.blacklist && rolesData_raw.bypass) {
                let repeat = false;
                rolesData_raw.blacklist.forEach((role) => {
                    if (rolesData_raw.bypass.includes(role)) {
                        repeat = true;
                    }
                });

                if (repeat === true) {
                    message = `\`Not allowing repeating roles in blacklist and bypass\``;
                    return error_reply(interaction, message);
                }
            }

            const embeds = [];

            const giveaway_embed = new EmbedBuilder()
                .setTitle(`${options.prize}`)
                .setColor(embed_theme.color)
                .setDescription(
                    `Click ${embed_theme.emoji_join} to enter\n\n${
                        embed_theme.emoji_mainpoint
                    }**Ending:** <t:${Math.floor(
                        timeData.endTime / 1000
                    )}:R> (\`duration: ${timeData.humanTime}\`)\n${
                        embed_theme.emoji_mainpoint
                    }**Host:** ${interaction.user}\n${
                        embed_theme.emoji_mainpoint
                    }**Donator:** ${options.sponsor}`
                )
                .setImage(embed_theme.dividerurl)
                .setFooter({
                    text: `Winners: ${options.winners.toLocaleString()}`,
                });

            let info_map = [];

            if (options.requiredlevel) {
                info_map.push(
                    `${
                        embed_theme.emoji_subpoint
                    }**Required Level:** \`${options.requiredlevel.toLocaleString()}\``
                );
            }

            if (requiredChat_raw) {
                info_map.push(
                    `${
                        embed_theme.emoji_subpoint
                    }**Required Chat:** \`${requiredChat_messages.toLocaleString()} messages\` in <#${requiredChat_channel}>`
                );
            }

            let hasRoleInformation;
            Object.keys(rolesData_raw).forEach((element) => {
                if (Array.isArray(rolesData_raw[element])) {
                    hasRoleInformation = true;
                }
            });

            if (hasRoleInformation == true || options.requiredlevel) {
                if (Object.keys(rolesData_raw).length > 0) {
                    Object.keys(rolesData_raw).forEach((key) => {
                        if (!rolesData_raw[key]) {
                            return;
                        }
                        return info_map.push(rolesData[key].display);
                    });
                }
            }

            if (info_map.length > 0) {
                info_map = info_map
                    .map((element) => {
                        return element;
                    })
                    .filter(Boolean)
                    .join("\n");

                giveaway_embed.setFields({
                    name: "Information:",
                    value: info_map,
                });
            } else {
                info_map = null;
            }

            const requirements = {
                requiredlevel: null,
                requiredRoles: [],
            };
            if (options.requiredlevel) {
                requirements.requiredlevel = options.requiredlevel;
            }

            if (rolesData_raw.required) {
                requirements.requiredRoles = rolesData_raw.required;
            }

            embeds.push(giveaway_embed);

            if (options.message) {
                const message_embed = new EmbedBuilder()
                    .setColor(embed_theme.color)
                    .setDescription(
                        `**Message:** ${options.message}\n\nBe sure to thank the sponsor in <#908201143660859433>!`
                    )
                    .setFooter({
                        url: options.sponsor.user.displayAvatarURL(),
                        text: `-${options.sponsor.user.tag}`,
                    });
                embeds.push(message_embed);
            }

            const rows = [];
            const row = new ActionRowBuilder();
            const button_join = new ButtonBuilder()
                .setCustomId(`giveaway_join`)
                .setLabel(`0`)
                .setEmoji(`${embed_theme.emoji_join}`)
                .setStyle(embed_theme.button_style);
            const button_end = new ButtonBuilder()
                .setCustomId(`giveaway_end`)
                .setLabel(`End`)
                .setEmoji(`<a:ravena_uncheck:1002983318565965885>`)
                .setStyle(2);
            row.addComponents(button_join, button_end);

            interaction.reply({
                content: "`Giveaway started!`",
                ephemeral: true,
            });

            rows.push(row);

            const mention = `${
                options.mention ? `<@&${options.mention}>` : `\`No mentions\``
            }`;
            const giveaway_message = await interaction.channel.send({
                content: mention,
                embeds: embeds,
                components: rows,
                allowedMentions: { parse: ["users", "roles"] },
            });

            // handle mention
            if (options.mention) {
                const checkMentioncd = await giveaway_check_mentioncd(
                    interaction,
                    options.mention
                );

                if (checkMentioncd === false) {
                    return;
                }
            }

            if (rolesData_raw.required) {
                if (rolesData_raw.required.includes("922663821208879125")) {
                    const vote_row = new ActionRowBuilder();
                    const vote_embed = new EmbedBuilder()
                        .setColor(embed_theme.color)
                        .setDescription(
                            `**How to become a voter?**\n<a:bluearrow:1005191872647536660> Vote Link: [\`https://top.gg/servers/902334382939963402/vote\`](https://top.gg/servers/902334382939963402/vote)\n<a:bluearrow:1005191872647536660> Check out our voter perks by using \`.perks voter\` <:panda_yay:909668976009805824>`
                        );
                    vote_row.addComponents([
                        new ButtonBuilder()
                            .setCustomId(`vote_perks`)
                            .setLabel(`Voting Perks`)
                            .setStyle(embed_theme.button_style),
                        new ButtonBuilder()
                            .setLabel(`Vote here`)
                            .setStyle(5)
                            .setURL(
                                "https://top.gg/servers/902334382939963402/vote"
                            ),
                    ]);

                    await interaction.channel.send({
                        embeds: [vote_embed],
                        components: [vote_row],
                    });
                }
            }

            return GiveawayModel.create({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                messageId: giveaway_message.id,
                hostId: interaction.user.id,
                sponsorId: options.sponsor.id,
                sponsorMessage: options.message,
                winnersAmount: options.winners,
                prize: options.prize,
                duration: timeData.timeMilliseconds,
                endsAt: timeData.endTime,
                informationDisplay: info_map,
                requirements: requirements,
                blacklist: rolesData_raw.blacklist,
                bypass: rolesData_raw.bypass,
                globalBypass: options.globalbypass,
                chatRequirements: requiredChat,
            });
        } else if (interaction.options.getSubcommand() === "mention") {
            const options = {
                message: interaction.options.getString("message"),
                sponsor: interaction.options.getMember("sponsor"),
                mention: interaction.options.getString("mention"),
            };

            const checkMentioncd = await giveaway_check_mentioncd(
                interaction,
                options.mention
            );

            if (checkMentioncd === false) {
                return;
            }

            const mention_embed = new EmbedBuilder()
                .setColor(embed_theme.color)
                .setDescription(
                    `${embed_theme.emoji_mainpoint}**Sponsor:** ${
                        options.sponsor.user
                    }\n${embed_theme.emoji_mainpoint}**Message:** ${
                        options.message ? options.message : `\`none\``
                    }\n${
                        embed_theme.emoji_subpoint
                    }**Thank the sponsor in <#908201143660859433>!**`
                )
                .setThumbnail(
                    "https://images-ext-1.discordapp.net/external/2y7jsoXk5r9GJEvoiA0tHNpYhzD9s7S6zeHEFnaelKQ/%3Fsize%3D1024/https/cdn.discordapp.com/icons/902334382939963402/a_a0b58c0fa37eab6c37f4b6310e300a99.gif?width=299&height=299"
                );

            interaction.reply({
                content: "Successfully mentioned this giveaway.",
                ephemeral: true,
            });

            await interaction.channel.send({
                content: `<@&${options.mention}>`,
                embeds: [mention_embed],
            });
        } else if (interaction.options.getSubcommand() === "cleanup") {
            if (
                !interaction.member.roles.cache.has("938372143853502494") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            const giveaways_ended = await GiveawayModel.find({
                hasEnded: true,
            });

            if (giveaways_ended.length <= 0) {
                error_message = `There are no ended giveaways to be cleared.`;
                return error_reply(interaction, error_message);
            }

            await GiveawayModel.deleteMany({
                hasEnded: true,
            });

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(`#D8CCFF`)
                        .setDescription(
                            `**Clean up giveaway data: SUCCESSFUL**\n*I have deleted giveaways that already ended from the database to free up space.*\nCleared Up: \`${giveaways_ended.length.toLocaleString()} giveaways\``
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "show") {
        }
    },
};
