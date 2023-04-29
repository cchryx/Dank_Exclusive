const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    PermissionsBitField,
} = require("discord.js");

const GuildModel = require("../../models/guildSchema");
const { guild_checkperm_mod } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");
const { discord_dissect_roles } = require("../../utils/discord");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("event")
        .setDescription("Event related commands")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("start")
                .setDescription("Ping and start an event")
                .addStringOption((oi) => {
                    return oi
                        .setName("event")
                        .setDescription("Event that is taking place")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("prize")
                        .setDescription("Event prizes")
                        .setRequired(true);
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("sponsor")
                        .setDescription("Sponsor of the event");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription("Event message");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("specifications")
                        .setDescription(
                            "Event specifications that may include how you want the event to be handled"
                        );
                })
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("end").setDescription("Stop the ongoing event")
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
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const dankexData = await GuildModel.findOne({
            guildid: "902334382939963402",
        });
        const embedTheme = dankexData.theme;

        if (interaction.options.getSubcommand() === "start") {
            if (dankexData.miscData.event.ongoing === true) {
                error_message = `There is an ongoing event. Please check <#902732993188200498> and if the event already ended, please run \`/event end\`.`;
                return error_reply(interaction, error_message);
            }

            if (
                !interaction.member.roles.cache.has("904459850812100649") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            if (interaction.channelId !== "902733103380975616") {
                error_message = `You are only allowed to use this command in <#902733103380975616>`;
                return error_reply(interaction, error_message);
            }

            const options = {
                event: interaction.options.getString("event"),
                prize: interaction.options.getString("prize"),
                message: interaction.options.getString("message"),
                specifications: interaction.options.getString("specifications"),
                sponsor: interaction.options.getMember("sponsor"),
            };

            const event_embed = new EmbedBuilder()
                .setTitle(`Event Time!`)
                .setColor(embedTheme.color)
                .setImage(embedTheme.dividerurl)
                .setDescription(
                    `${embedTheme.emoji_mainpoint}**Event:** \`${
                        options.event
                    }\`\n${embedTheme.emoji_mainpoint}**Prize:** \`${
                        options.prize
                    }\`\n${embedTheme.emoji_mainpoint}**Specifications:** ${
                        options.specifications
                            ? options.specifications
                            : "`none`"
                    }`
                )
                .setThumbnail(
                    "https://images-ext-1.discordapp.net/external/2y7jsoXk5r9GJEvoiA0tHNpYhzD9s7S6zeHEFnaelKQ/%3Fsize%3D1024/https/cdn.discordapp.com/icons/902334382939963402/a_a0b58c0fa37eab6c37f4b6310e300a99.gif?width=299&height=299"
                )
                .setFields({
                    name: `Information:`,
                    value: `${embedTheme.emoji_subpoint}**Host:** ${
                        interaction.user
                    }\n${embedTheme.emoji_subpoint}**Channel:** ${
                        options.event.toLowerCase().includes("mafia")
                            ? "<#1097745904192200815>"
                            : "<#902732993188200498>"
                    }\n${embedTheme.emoji_subpoint}**Sponsor:** ${
                        options.sponsor ? options.sponsor : interaction.user
                    }\n${embedTheme.emoji_subpoint}**Message:** ${
                        options.message ? options.message : "`none`"
                    }`,
                });

            interaction.reply({
                content:
                    "Event started. To end an event, an <@&904459850812100649> must run `/event end` in <#902732993188200498> when this event ends.",
                ephemeral: true,
            });

            let content = ``;
            if (options.event.toLowerCase().includes("minigame")) {
                content += `<@&902413856104648754>`;
            }

            if (options.event.toLowerCase().includes("rumble")) {
                content += `\n<@&954577139208957983>`;
            }

            if (options.event.toLowerCase().includes("xenon")) {
                content += `\n<@&1010047390939619348>`;
            }

            if (options.event.toLowerCase().includes("mafia")) {
                content += `\n<@&1017619948232785964>`;
            }

            if (content === "") {
                content = "<@&902413856104648754>";
            }

            await interaction.channel.send({
                content: content,
                embeds: [event_embed],
            });

            dankexData.miscData.event.ongoing = true;
            return GuildModel.findOneAndUpdate(
                {
                    guildid: "902334382939963402",
                },
                dankexData
            );
        } else if (interaction.options.getSubcommand() === "end") {
            if (dankexData.miscData.event.ongoing === false) {
                error_message = `There is no ongoing event. You can start a new event by running \`/event start\` in <#902733103380975616>.`;
                return error_reply(interaction, error_message);
            }

            if (
                !interaction.member.roles.cache.has("904459850812100649") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            if (interaction.channelId !== "902732993188200498") {
                error_message = `You are only allowed to use this command in <#902732993188200498>`;
                return error_reply(interaction, error_message);
            }

            const event_embed = new EmbedBuilder()
                .setTitle(`Event Ended!`)
                .setColor(embedTheme.color)
                .setDescription(
                    `${
                        embedTheme.emoji_mainpoint
                    }**Event Ended:** <t:${Math.floor(Date.now() / 1000)}:R>\n${
                        embedTheme.emoji_mainpoint
                    }**Event Announcements:** <#902733103380975616>\n${
                        embedTheme.emoji_subpoint
                    }**Thank the sponsor in <#908201143660859433>**`
                )
                .setThumbnail(
                    "https://images-ext-1.discordapp.net/external/2y7jsoXk5r9GJEvoiA0tHNpYhzD9s7S6zeHEFnaelKQ/%3Fsize%3D1024/https/cdn.discordapp.com/icons/902334382939963402/a_a0b58c0fa37eab6c37f4b6310e300a99.gif?width=299&height=299"
                );

            await interaction.reply({
                embeds: [event_embed],
            });

            dankexData.miscData.event.ongoing = false;
            return GuildModel.findOneAndUpdate(
                {
                    guildid: "902334382939963402",
                },
                dankexData
            );
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
                .edit("904459850812100649", {
                    MentionEveryone: true,
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
                        `**Event lock channel: SUCCESSFUL**\n*The roles below can still view this channel.*\n\n${rolesData_map}`
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
                    id: "904459850812100649",
                    allow: [
                        PermissionsBitField.Flags.MentionEveryone,
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
                        `**Event unlock channel: SUCCESSFUL**\n*Permissions of this channel has been reset, everyone can view this channel now.*`
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
        }
    },
};
