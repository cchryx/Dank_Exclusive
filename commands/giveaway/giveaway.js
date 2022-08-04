const ms = require("better-ms");
const humanizeDuration = require("humanize-duration");
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
const {
    guild_fetch,
    guild_checkperm_giveaway,
    guild_checkrole,
} = require("../../utils/guild");
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
        .setName("giveaway")
        .setDescription("Giveaway stuff")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your current active giveaways")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("start")
                .setDescription("Start a new giveaway")
                .addStringOption((oi) => {
                    return oi
                        .setName("type")
                        .setDescription(
                            "Nitro, Dank Memer, Bro Bot, Xenon, or other"
                        )
                        .setRequired(true)
                        .addChoices(
                            { name: "Dank Memer", value: "dankmemer" },
                            { name: "Nitro", value: "nitro" },
                            { name: "Bro Bot", value: "brobot" },
                            { name: "Xenon", value: "xenon" },
                            { name: "Other", value: "other" }
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("prize")
                        .setDescription("Giveaway prize")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("time")
                        .setDescription(
                            "How long will the giveaway last, how much time do users get to enter (example: 1h2m9s)"
                        )
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("winners")
                        .setDescription(
                            "How many winners can the giveaway have"
                        )
                        .setRequired(true);
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("donator")
                        .setDescription("Who donated to this giveaway")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("mentions")
                        .setDescription(
                            "Id: Roles will get pinged for this giveaway"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("reqroles")
                        .setDescription(
                            "Id: Which roles do you need in order to join the giveaway, sparate by spaces"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("bypassroles")
                        .setDescription(
                            "Id: What roles can bypass this giveaway, sparate by spaces"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("blacklistroles")
                        .setDescription(
                            "Id: What user role is blacklisted to join this giveaway, sparate by spaces"
                        );
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription(
                            "Message that will be attached to the giveaway"
                        );
                })
        ),
    async execute(interaction, client) {
        const guildData = guild_fetch(interaction.guildId);
        requiredperms = ["ManageChannels", "ManageGuild", "Administrator"];
        let message;
        let pass = await guild_checkperm_giveaway(interaction, requiredperms);

        if (!pass === true) {
            message = `\`You don't have the required permissions to preform this action\``;
            return error_reply(interaction, message);
        }
        const embedTheme = {
            color: "#f7cb8d",
            emoji_join: "<:smoothie:1003726574094397560>",
            emoji_mainpoint: "<:mainpoint_summer:1004211052612944014>",
            emoji_subpoint: "<a:subpoint_summer:1003716658277392484>",
            dividerurl:
                "https://media.discordapp.net/attachments/1003715669059178626/1003729430897770506/ezgif.com-gif-maker_14.gif",
            button_style: 4,
        };
        if (interaction.options.getSubcommand() === "start") {
            const options = {
                type: interaction.options.getString("type"),
                prize: interaction.options.getString("prize"),
                time: interaction.options.getString("time"),
                winners: interaction.options.getNumber("winners"),
                donator: interaction.options.getMember("donator"),
                reqrole: interaction.options.getString("reqroles"),
                bypassroles: interaction.options.getString("bypassroles"),
                blacklistroles: interaction.options.getString("blacklistroles"),

                message: interaction.options.getString("message"),
                mentions: interaction.options.getString("mentions"),
            };
            let typeurl;
            if (options.type === "dankmemer") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729888785739907/memer.webp";
            } else if (options.type === "nitro") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729889150632027/EmSIbDzXYAAb4R7.png";
            } else if (options.type === "brobot") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729887531651193/e4ac5faef283425eb128dac16bbeb2c2.png?width=390&height=390";
            } else if (options.type === "xenon") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729888416632902/988082656505909268.gif";
            } else if (options.type === "other") {
                typeurl =
                    "https://cdn.discordapp.com/attachments/1003715669059178626/1003729887988809770/824918033889361941.gif";
            }
            options.winners = parseInt(options.winners);
            if (options.winners < 1) {
                message = `\`The amount of winners should be greater than 0\``;
                return error_reply(interaction, message);
            }
            let mentions;
            if (options.mentions) {
                const mention_args = options.mentions.split(" ");
                mentionedrole = [];
                mention_args.forEach((element) => {
                    if (
                        interaction.guild.roles.cache.find(
                            (role) => role.id === element
                        )
                    ) {
                        const fetchedrole = interaction.guild.roles.cache.find(
                            (role) => role.id === element
                        );
                        mentionedrole.push(fetchedrole);
                    }
                });
                const mentionedrole_map = mentionedrole
                    .map((element) => {
                        return element;
                    })
                    .join(" ");

                if (mentionedrole.length <= 0) {
                    mentions = `\`No mentions for this giveaway\``;
                } else {
                    mentions = mentionedrole_map;
                }
            } else {
                mentions = `\`No mentions for this giveaway\``;
            }
            const etime = `time: ` + options.time;
            const timeargs = etime.split(" ");
            timeargs.shift();
            const time = ms.getMilliseconds(timeargs[0]);
            if (!time) {
                message = `\`Couldn't parse ${timeargs[0]}\nExample: 1d1h12m\``;
                return error_reply(interaction, message);
            }
            const endtime = Date.now() + time;
            const giveaway_embed = new EmbedBuilder()
                .setTitle(`${options.prize}`)
                .setThumbnail(typeurl)
                .setColor(embedTheme.color)
                .setDescription(
                    `Click ${embedTheme.emoji_join} to enter\n\n${
                        embedTheme.emoji_mainpoint
                    }**Ending:** <t:${Math.floor(
                        endtime / 1000
                    )}:R> (\`duration: ${humantime(time)}\`)\n${
                        embedTheme.emoji_mainpoint
                    }**Host:** ${interaction.user}\n${
                        embedTheme.emoji_mainpoint
                    }**Donator:** ${options.donator}`
                )
                .setImage(embedTheme.dividerurl)
                .setFooter({
                    text: `Winners: ${options.winners.toLocaleString()}`,
                });

            const info_object = {};
            const info_arry_raw = {};

            let required_roles;
            if (options.reqrole) {
                required_roles = await guild_checkrole(
                    interaction,
                    options.reqrole
                );
            }
            if (required_roles) {
                info_object.required = `${embedTheme.emoji_subpoint}Required: ${required_roles.mapstring}`;
                info_arry_raw.required = required_roles.roles;
            }

            let bypass_roles;
            if (options.bypassroles) {
                bypass_roles = await guild_checkrole(
                    interaction,
                    options.bypassroles
                );
            }
            if (bypass_roles) {
                info_object.bypass = `${embedTheme.emoji_subpoint}Bypass: ${bypass_roles.mapstring}`;
                info_arry_raw.bypass = bypass_roles.roles;
            }

            let blacklist_roles;
            if (options.blacklistroles) {
                blacklist_roles = await guild_checkrole(
                    interaction,
                    options.blacklistroles
                );
            }
            if (blacklist_roles) {
                info_object.blacklist = `${embedTheme.emoji_subpoint}Blacklisted: ${blacklist_roles.mapstring}`;
                info_arry_raw.blacklist = blacklist_roles.roles;
            }

            if (info_arry_raw.required && info_arry_raw.bypass) {
                let repeat = false;
                info_arry_raw.required.forEach((role) => {
                    if (info_arry_raw.bypass.includes(role)) {
                        repeat = true;
                    }
                });

                if (repeat === true) {
                    message = `\`Not allowing repeating roles in required and bypass\``;
                    return error_reply(interaction, message);
                }
            }

            if (info_arry_raw.required && info_arry_raw.blacklist) {
                let repeat = false;
                info_arry_raw.required.forEach((role) => {
                    if (info_arry_raw.blacklist.includes(role)) {
                        repeat = true;
                    }
                });

                if (repeat === true) {
                    message = `\`Not allowing repeating roles in required and blacklist\``;
                    return error_reply(interaction, message);
                }
            }

            if (info_arry_raw.blacklist && info_arry_raw.bypass) {
                let repeat = false;
                info_arry_raw.blacklist.forEach((role) => {
                    if (info_arry_raw.bypass.includes(role)) {
                        repeat = true;
                    }
                });

                if (repeat === true) {
                    message = `\`Not allowing repeating roles in blacklist and bypass\``;
                    return error_reply(interaction, message);
                }
            }

            let info_map;
            if (Object.keys(info_object).length > 0) {
                info_map = Object.keys(info_object)
                    .map((key) => {
                        return info_object[key];
                    })
                    .join("\n");

                giveaway_embed.setFields({
                    name: "Information:",
                    value: info_map,
                });
            }

            const embeds = [giveaway_embed];
            if (options.message) {
                const message_embed = new EmbedBuilder()
                    .setColor(embedTheme.color)
                    .setDescription(`**Message:** ${options.message}`)
                    .setFooter({
                        url: options.donator.user.displayAvatarURL(),
                        text: `-${options.donator.user.tag}`,
                    });
                embeds.push(message_embed);
            }

            const row = new ActionRowBuilder();
            const button_join = new ButtonBuilder()
                .setCustomId(`giveaway_join`)
                .setLabel(`0`)
                .setEmoji(`${embedTheme.emoji_join}`)
                .setStyle(embedTheme.button_style);
            row.addComponents(button_join);

            interaction.reply({
                content: "Giveaway started!",
                ephemeral: true,
            });

            const send_msg = await interaction.channel.send({
                content: mentions,
                embeds: embeds,
                components: [row],
                allowedMentions: { parse: ["users", "roles"] },
            });

            return GiveawayModel.create({
                guildid: interaction.guildId,
                channelid: interaction.channelId,
                messageid: send_msg.id,
                hostid: interaction.user.id,
                sponsorid: options.donator.id,
                sponsormessage: options.message,
                winnersamount: options.winners,
                prize: options.prize,
                duration: time,
                endsAt: endtime,
                infodisplay: info_map,
                typeurl: typeurl,
                requirements: info_arry_raw.required,
                blacklist: info_arry_raw.blacklist,
                bypass: info_arry_raw.bypass,
            });
        } else if (interaction.options.getSubcommand() === "show") {
        }
    },
};
