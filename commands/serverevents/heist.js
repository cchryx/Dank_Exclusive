const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    PermissionsBitField,
} = require("discord.js");

const TimerModel = require("../../models/timerSchema");
const GuildModel = require("../../models/guildSchema");

const { error_reply } = require("../../utils/error");
const { time_format } = require("../../utils/time");
const { guild_fetch } = require("../../utils/guild");
const {
    discord_check_role,
    discord_dissect_roles,
} = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("heist")
        .setDescription("Heist event related commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("timer")
                .setDescription("Set a timer for a heist.")
                .addStringOption((oi) => {
                    return oi
                        .setName("duration")
                        .setDescription("How long the timer will last.")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("amount")
                        .setDescription("Heist amount.")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("description")
                        .setDescription("Timer description.");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requirements")
                        .setDescription("Timer requirements.");
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("sponsor")
                        .setDescription("Timer sponsor.");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("lock")
                .setDescription(
                    "Lockview so that only certain roles can view this heist."
                )
                .addStringOption((oi) => {
                    return oi
                        .setName("roles")
                        .setDescription("Which roles can view this channel.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("unlock").setDescription("Reset heist lock")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("message")
                .setDescription("Message at the end of a heist")
        ),
    cooldown: 10,
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        const embed_theme = guildData.theme;
        let error_message;

        const checkAccess = await discord_check_role(interaction, [
            "902358680748568596",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "timer") {
            const options = {
                duration: interaction.options.getString("duration"),
                amount: interaction.options.getNumber("amount"),
                description: interaction.options.getString("description"),
                requirements: interaction.options.getString("requirements"),
                sponsor: interaction.options.getUser("sponsor"),
            };

            // handle duration
            const timeData = await time_format(interaction, options.duration);
            if (timeData.status === false) {
                return;
            }

            const heist_timer_description = `${
                guildData.theme.emoji_mainpoint
            }**Heist Amount:** **\`⏣ ${options.amount.toLocaleString()}\`**\n${
                guildData.theme.emoji_mainpoint
            }**Requirements:** ${
                options.requirements ? options.requirements : "`none`"
            }\n${guildData.theme.emoji_mainpoint}**Sponsor:** ${
                options.sponsor ? options.sponsor : "`none`"
            }${options.description ? `\n\n${options.description}` : ""}`;

            interaction.reply({
                content: "`Heist timer started!`",
                ephemeral: true,
            });

            const heist_timer_message = await interaction.channel.send({
                content: `${
                    guildData.miscData.roles.heistPing
                        ? `<@&${guildData.miscData.roles.heistPing}>`
                        : `\`no mentions\``
                }`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Timer`)
                        .setColor(guildData.theme.color)
                        .setDescription(
                            `${
                                embed_theme.emoji_mainpoint
                            }**Ending:** <t:${Math.floor(
                                timeData.endTime / 1000
                            )}:R> (\`duration: ${timeData.humanTime}\`)\n${
                                embed_theme.emoji_mainpoint
                            }**Host:** ${
                                interaction.user
                            }\n\n${heist_timer_description}`
                        )
                        .setImage(guildData.theme.dividerurl),
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setStyle(guildData.theme.button_style)
                            .setLabel(`1`)
                            .setCustomId("timer_join")
                            .setEmoji(guildData.theme.emoji_join)
                    ),
                ],
            });

            return TimerModel.create({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                messageId: heist_timer_message.id,
                hostId: interaction.user.id,
                duration: timeData.timeMilliseconds,
                endsAt: timeData.endTime,
                description: heist_timer_description,
                users: [interaction.user.id],
            });
        } else if (interaction.options.getSubcommand() === "lock") {
            const options = {
                roles: interaction.options.getString("roles"),
            };

            const rolesData = await discord_dissect_roles(
                interaction,
                options.roles
            );

            if (rolesData.length <= 0) {
                error_message = `Couldn't identify any roles to view  lock.`;
                return error_reply(interaction, error_message);
            }

            rolesData.roles.forEach(async (role) => {
                await interaction.channel.permissionOverwrites
                    .edit(role, {
                        ViewChannel: true,
                    })
                    .catch((error) => {
                        console.log(error);
                        error_message = `${error.rawError.message}`;
                        error_reply(interaction, error_message);
                        return false;
                    });
            });
            await interaction.channel.permissionOverwrites
                .edit(interaction.guild.id, {
                    ViewChannel: false,
                })
                .catch((error) => {
                    console.log(error);
                    error_message = `${error.rawError.message}`;
                    error_reply(interaction, error_message);
                    return false;
                });
            await interaction.channel.permissionOverwrites
                .edit("933489817319243837", {
                    ViewChannel: true,
                })
                .catch((error) => {
                    console.log(error);
                    error_message = `${error.rawError.message}`;
                    error_reply(interaction, error_message);
                    return false;
                });
            await interaction.channel.permissionOverwrites
                .edit("902358680748568596", {
                    ViewChannel: true,
                    SendMessages: true,
                    AddReactions: true,
                    UseApplicationCommands: true,
                })
                .catch((error) => {
                    console.log(error);
                    error_message = `${error.rawError.message}`;
                    error_reply(interaction, error_message);
                    return false;
                });

            const rolesData_map = rolesData.roles
                .map((role) => {
                    return `<@&${role}>`;
                })
                .join("\n");

            interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Heist lock channel: SUCCESSFUL**\n*The roles below can still view this channel.*\n\n${rolesData_map}`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "unlock") {
            interaction.channel.permissionOverwrites.set([
                {
                    id: "955249569254473779",
                    deny: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.SendMessagesInThreads,
                        PermissionsBitField.Flags.CreatePublicThreads,
                        PermissionsBitField.Flags.CreatePrivateThreads,
                        PermissionsBitField.Flags.AddReactions,
                        PermissionsBitField.Flags.CreateInstantInvite,
                    ],
                },
                {
                    id: "934672804413067274",
                    deny: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.SendMessagesInThreads,
                        PermissionsBitField.Flags.CreatePublicThreads,
                        PermissionsBitField.Flags.CreatePrivateThreads,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
                {
                    id: "902358680748568596",
                    allow: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.AddReactions,
                        PermissionsBitField.Flags.UseApplicationCommands,
                    ],
                },
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                },
            ]);

            interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Heist unlock channel: SUCCESSFUL**\n*Permissions of this channel has been reset, everyone can view this channel now.*`
                    ),
                    new EmbedBuilder()
                        .setColor("#FAFFFC")
                        .setTitle(
                            `**Freeloaders are banned for 21 days <a:cat_sip:979941878403313664>**`
                        )
                        .setDescription(
                            `<a:blue_heart:964357388771663953> Massive giveaways [\`here\`](https://canary.discord.com/channels/902334382939963402/902699081049182309)\n<a:blue_heart:964357388771663953> Thank you [\`grinders\`](https://discord.com/channels/902334382939963402/904459344882573372/964348763672043612) for making this heist possible`
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "message") {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FAFFFC")
                        .setTitle(
                            `**Freeloaders are banned for 21 days <a:cat_sip:979941878403313664>**`
                        )
                        .setDescription(
                            `<a:blue_heart:964357388771663953> Massive giveaways [\`here\`](https://canary.discord.com/channels/902334382939963402/902699081049182309)\n<a:blue_heart:964357388771663953> Thank you [\`grinders\`](https://discord.com/channels/902334382939963402/904459344882573372/964348763672043612) for making this heist possible`
                        ),
                ],
            });
        }
    },
};
