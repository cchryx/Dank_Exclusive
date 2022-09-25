const { SlashCommandBuilder } = require("@discordjs/builders");
const ms = require("better-ms");
const humanizeDuration = require("humanize-duration");
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
const { guild_checkperm_mod } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

const humantime = humanizeDuration.humanizer({
    language: "shortEn",
    delimiter: " ",
    spacer: "",
    languages: {
        shortEn: {
            y: () => "y",
            mo: () => "mo",
            w: () => "w",
            d: () => "d",
            h: () => "h",
            m: () => "m",
            s: () => "s",
            ms: () => "ms",
        },
    },
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName("heist")
        .setDescription("Heist event related commands")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("timer")
                .setDescription("Set a timer for a heist")
                .addStringOption((oi) => {
                    return oi
                        .setName("time")
                        .setDescription("How long the timer will last")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("amount")
                        .setDescription("Heist amount")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("description")
                        .setDescription("Timer description");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requirements")
                        .setDescription("Timer requirements");
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("sponsor")
                        .setDescription("Timer sponsor");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("lock")
                .setDescription(
                    "Lockview so that only certain roles can view this heist"
                )
                .addStringOption((oi) => {
                    return oi
                        .setName("roles")
                        .setDescription("Which roles can view this channel")
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
        if (
            !interaction.member.roles.cache.has("902358680748568596") === true
        ) {
            message = `\`You don't have the required permissions to preform this action\``;
            return error_reply(interaction, message);
        }
        const dankexData = await GuildModel.findOne({
            guildId: "902334382939963402",
        });
        const embedTheme = dankexData.theme;

        if (interaction.options.getSubcommand() === "timer") {
            let message;

            const options = {
                time: interaction.options.getString("time"),
                amount: interaction.options.getNumber("amount"),
                description: interaction.options.getString("description"),
                requirements: interaction.options.getString("requirements"),
                sponsor: interaction.options.getUser("sponsor"),
            };

            const etime = `time: ` + options.time;
            const timeargs = etime.split(" ");
            timeargs.shift();
            const time = ms.getMilliseconds(timeargs[0]);
            if (!time) {
                message = `\`Couldn't parse ${timeargs[0]}\nExample: 1d1h12m\``;
                return error_reply(interaction, message);
            }
            if (time < 1000) {
                message = `\`Minimum timer is 1s\``;
                return error_reply(interaction, message);
            }
            const endtime = Date.now() + time;

            let display = `${
                embedTheme.emoji_mainpoint
            }**Heist Amount:** **\`⏣ ${options.amount.toLocaleString()}\`**\n${
                embedTheme.emoji_mainpoint
            }**Ending:** <t:${Math.floor(
                endtime / 1000
            )}:R> (\`duration: ${humantime(time)}\`)\n${
                embedTheme.emoji_mainpoint
            }**Requirements:** ${
                options.requirements ? options.requirements : "`none`"
            }\n${embedTheme.emoji_mainpoint}**Sponsor:** ${
                options.sponsor ? options.sponsor : "`none`"
            }\n${embedTheme.emoji_mainpoint}**Host:** ${interaction.user}`;

            if (options.description) {
                display = display + `\n\n` + `${options.description}`;
            }

            const timer_embed = new EmbedBuilder()
                .setTitle(`Timer`)
                .setColor(embedTheme.color)
                .setDescription(display)
                .setImage(embedTheme.dividerurl);

            interaction.reply({
                content: "`Heist timer started!`",
                ephemeral: true,
            });

            const send_msg = await interaction.channel.send({
                content: `<@&902636766786371634>`,
                embeds: [timer_embed],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setStyle(embedTheme.button_style)
                            .setLabel(`1`)
                            .setCustomId("timer_join")
                            .setEmoji(embedTheme.emoji_join)
                    ),
                ],
            });

            return TimerModel.create({
                guildid: interaction.guildId,
                channelid: interaction.channelId,
                messageid: send_msg.id,
                hostid: interaction.user.id,
                duration: time,
                endsAt: endtime,
                mentions: [interaction.user.id],
                description: `**Heist Amount:** **\`⏣ ${options.amount.toLocaleString()}\`**\n${
                    embedTheme.emoji_mainpoint
                }**Requirements:** ${
                    options.requirements ? options.requirements : "`none`"
                }\n${embedTheme.emoji_mainpoint}**Sponsor:** ${
                    options.sponsor ? options.sponsor : "`none`"
                }\n${options.description ? `\n${options.description}` : ""}`,
            });
        } else if (interaction.options.getSubcommand() === "lock") {
            const options = {
                roles: interaction.options.getString("roles"),
            };
            function removeDuplicates(arr) {
                return [...new Set(arr)];
            }
            const roles = [];
            const roles_keepnumbers = options.roles.replace(/\D/g, " ");
            const roles_keepsplit = roles_keepnumbers.split(" ");
            const roles_numbers = removeDuplicates(roles_keepsplit);

            roles_numbers.forEach((element) => {
                if (
                    interaction.guild.roles.cache.find(
                        (role) => role.id === element
                    )
                ) {
                    roles.push(element);
                }
            });

            roles.forEach(async (role) => {
                await interaction.channel.permissionOverwrites
                    .edit(role, {
                        ViewChannel: true,
                    })
                    .catch((error) => {
                        console.log(error);
                        error_message = `\`${error.rawError.message}\``;
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
                    error_message = `\`${error.rawError.message}\``;
                    error_reply(interaction, error_message);
                    return false;
                });
            await interaction.channel.permissionOverwrites
                .edit("933489817319243837", {
                    ViewChannel: true,
                })
                .catch((error) => {
                    console.log(error);
                    error_message = `\`${error.rawError.message}\``;
                    error_reply(interaction, error_message);
                    return false;
                });

            const roles_map = roles
                .map((role) => {
                    return `<@&${role}>`;
                })
                .join("\n");

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FAFFFC")
                        .setDescription(
                            `<a:ravena_check:1002981211708325950> **Channel has been heist locked, only the following roles can now view:**\n${roles_map}`
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
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                },
            ]);

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FAFFFC")
                        .setDescription(
                            ` <a:ravena_check:1002981211708325950> **Channel has been heist unlocked, everyone can now view this channel**`
                        ),
                    new EmbedBuilder()
                        .setColor("#FAFFFC")
                        .setTitle(
                            `**Freeloaders are banned for 21 days <a:cat_sip:979941878403313664>**`
                        )
                        .setDescription(
                            `<a:blue_heart:964357388771663953> Massive giveaways [\`here\`](https://discord.com/channels/902334382939963402/904459344882573372/964348763672043612)\n<a:blue_heart:964357388771663953> Thank you [\`grinders\`](https://discord.com/channels/902334382939963402/904459344882573372/964348763672043612) for making this heist possible`
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
                            `<a:blue_heart:964357388771663953> Massive giveaways [\`here\`](https://discord.com/channels/902334382939963402/904459344882573372/964348763672043612)\n<a:blue_heart:964357388771663953> Thank you [\`grinders\`](https://discord.com/channels/902334382939963402/904459344882573372/964348763672043612) for making this heist possible`
                        ),
                ],
            });
        }
    },
};
