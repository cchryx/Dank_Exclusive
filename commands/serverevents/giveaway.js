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

const jsoncooldowns = require("../../giveaway-cooldowns.json");
const fs = require("fs");

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
                        )
                        .addChoices(
                            {
                                name: "Massive Giveaway",
                                value: "giveaway_massive",
                            },
                            { name: "Giveaway", value: "giveaway" },
                            { name: "Nitro Giveaway", value: "giveaway_nitro" }
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
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("mention")
                .setDescription("Mention a giveaway")
                .addUserOption((oi) => {
                    return oi
                        .setName("sponsor")
                        .setDescription("Who sponsored to this giveaway")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("mentions")
                        .setDescription(
                            "Roles will get pinged for this giveaway"
                        )
                        .addChoices(
                            {
                                name: "Massive Giveaway",
                                value: "giveaway_massive",
                            },
                            { name: "Giveaway", value: "giveaway" },
                            { name: "Nitro Giveaway", value: "giveaway_nitro" }
                        )
                        .setRequired(true);
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
        const guildData = await guild_fetch(interaction.guildId);
        requiredperms = ["ManageChannels", "ManageGuild", "Administrator"];
        let message;
        let pass = await guild_checkperm_giveaway(interaction, requiredperms);

        if (!pass === true) {
            message = `\`You don't have the required permissions to preform this action\``;
            return error_reply(interaction, message);
        }
        const embedTheme = guildData.theme;
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

            let cooldown;
            if (options.mentions) {
                const userID = interaction.user.id;
                if (!jsoncooldowns.hasOwnProperty(userID)) {
                    jsoncooldowns[userID] = {};
                }

                if (options.mentions === "giveaway") {
                    let readytimestamp =
                        jsoncooldowns[userID][options.mentions];

                    if (!readytimestamp) {
                        readytimestamp = 0;
                    }

                    const timeleft = new Date(readytimestamp);
                    let check =
                        timeleft - Date.now() >= timeleft ||
                        timeleft - Date.now() <= 0;

                    if (!check) {
                        const cooldown_embed =
                            new EmbedBuilder().setDescription(
                                `\`You are on cooldown for mentioning giveaways, please wait for cooldown to end or don't add mentions when using this command\`\n\`Other mentions may work if they are not on cooldown\`\nReady: <t:${Math.floor(
                                    readytimestamp / 1000
                                )}:R>\nMention: <@&${
                                    guildData.giveaway.mentions[
                                        options.mentions
                                    ]
                                }>`
                            );

                        return interaction.reply({
                            embeds: [cooldown_embed],
                            ephemeral: true,
                        });
                    } else {
                        cooldown = 180;
                        const cooldown_amount = cooldown * 1000;
                        const timpstamp = Date.now() + cooldown_amount;
                        jsoncooldowns[interaction.user.id].giveaway = timpstamp;
                        fs.writeFile(
                            "./giveaway-cooldowns.json",
                            JSON.stringify(jsoncooldowns),
                            (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            }
                        );
                    }
                } else if (options.mentions === "giveaway_massive") {
                    let readytimestamp =
                        jsoncooldowns[userID][options.mentions];

                    if (!readytimestamp) {
                        readytimestamp = 0;
                    }

                    const timeleft = new Date(readytimestamp);
                    let check =
                        timeleft - Date.now() >= timeleft ||
                        timeleft - Date.now() <= 0;

                    if (!check) {
                        const cooldown_embed =
                            new EmbedBuilder().setDescription(
                                `\`You are on cooldown for mentioning giveaways, please wait for cooldown to end or don't add mentions when using this command\`\n\`Other mentions may work if they are not on cooldown\`\nReady: <t:${Math.floor(
                                    readytimestamp / 1000
                                )}:R>\nMention: <@&${
                                    guildData.giveaway.mentions[
                                        options.mentions
                                    ]
                                }>`
                            );

                        return interaction.reply({
                            embeds: [cooldown_embed],
                            ephemeral: true,
                        });
                    } else {
                        cooldown = 300;
                        const cooldown_amount = cooldown * 1000;
                        const timpstamp = Date.now() + cooldown_amount;
                        jsoncooldowns[interaction.user.id].giveaway_massive =
                            timpstamp;
                        fs.writeFile(
                            "./giveaway-cooldowns.json",
                            JSON.stringify(jsoncooldowns),
                            (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            }
                        );
                    }
                } else if (options.mentions === "giveaway_nitro") {
                    let readytimestamp =
                        jsoncooldowns[userID][options.mentions];

                    if (!readytimestamp) {
                        readytimestamp = 0;
                    }

                    const timeleft = new Date(readytimestamp);
                    let check =
                        timeleft - Date.now() >= timeleft ||
                        timeleft - Date.now() <= 0;

                    if (!check) {
                        const cooldown_embed =
                            new EmbedBuilder().setDescription(
                                `\`You are on cooldown for mentioning giveaways, please wait for cooldown to end or don't add mentions when using this command\`\n\`Other mentions may work if they are not on cooldown\`\nReady: <t:${Math.floor(
                                    readytimestamp / 1000
                                )}:R>\nMention: <@&${
                                    guildData.giveaway.mentions[
                                        options.mentions
                                    ]
                                }>`
                            );

                        return interaction.reply({
                            embeds: [cooldown_embed],
                            ephemeral: true,
                        });
                    } else {
                        cooldown = 300;
                        const cooldown_amount = cooldown * 1000;
                        const timpstamp = Date.now() + cooldown_amount;
                        jsoncooldowns[interaction.user.id].giveaway_nitro =
                            timpstamp;
                        fs.writeFile(
                            "./giveaway-cooldowns.json",
                            JSON.stringify(jsoncooldowns),
                            (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            }
                        );
                    }
                }

                options.mentions =
                    guildData.giveaway.mentions[options.mentions];
            }

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
            if (time < 1000) {
                message = `\`Minimum timer is 1s\``;
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

            const rows = [];
            const row = new ActionRowBuilder();
            const button_join = new ButtonBuilder()
                .setCustomId(`giveaway_join`)
                .setLabel(`0`)
                .setEmoji(`${embedTheme.emoji_join}`)
                .setStyle(embedTheme.button_style);
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

            const send_msg = await interaction.channel.send({
                content: mentions,
                embeds: embeds,
                components: rows,
                allowedMentions: { parse: ["users", "roles"] },
            });

            if (required_roles) {
                if (required_roles.roles.includes("922663821208879125")) {
                    const vote_row = new ActionRowBuilder();
                    const vote_embed = new EmbedBuilder()
                        .setColor(embedTheme.color)
                        .setDescription(
                            `**How to become a voter?**\n<a:bluearrow:1005191872647536660> Vote Link: [\`https://top.gg/servers/902334382939963402/vote\`](https://top.gg/servers/902334382939963402/vote)\n<a:bluearrow:1005191872647536660> Check out our voter perks by using \`.voter\` <:panda_yay:909668976009805824>`
                        );
                    vote_row.addComponents([
                        new ButtonBuilder()
                            .setCustomId(`vote_perks`)
                            .setLabel(`Voting Perks`)
                            .setEmoji(`<a:dankex:992270290027556885>`)
                            .setStyle(embedTheme.button_style),
                        new ButtonBuilder()
                            .setLabel(`Vote here`)
                            .setEmoji(`<a:dankex:992270290027556885>`)
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
        } else if (interaction.options.getSubcommand() === "mention") {
            if (
                !interaction.member.roles.cache.has("902372521213587456") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            if (
                interaction.channelId !== "902344036659118130" ||
                interaction.channelId !== "902344122650734622" ||
                interaction.channelId !== "902344060281430016" ||
                interaction.channelId !== "960370004384165908"
            ) {
                error_message = `You are only allowed to use this command in <#902344036659118130>, <#902344122650734622>, <#902344060281430016>, and <#960370004384165908>`;
                return error_reply(interaction, error_message);
            }

            const options = {
                message: interaction.options.getString("message"),
                sponsor: interaction.options.getMember("sponsor"),
                mentions: interaction.options.getString("mentions"),
            };

            let cooldown;
            if (options.mentions) {
                const userID = interaction.user.id;
                if (!jsoncooldowns.hasOwnProperty(userID)) {
                    jsoncooldowns[userID] = {};
                }

                if (options.mentions === "giveaway") {
                    let readytimestamp =
                        jsoncooldowns[userID][options.mentions];

                    if (!readytimestamp) {
                        readytimestamp = 0;
                    }

                    const timeleft = new Date(readytimestamp);
                    let check =
                        timeleft - Date.now() >= timeleft ||
                        timeleft - Date.now() <= 0;

                    if (!check) {
                        const cooldown_embed =
                            new EmbedBuilder().setDescription(
                                `\`You are on cooldown for mentioning giveaways, please wait for cooldown to end or don't add mentions when using this command\`\n\`Other mentions may work if they are not on cooldown\`\nReady: <t:${Math.floor(
                                    readytimestamp / 1000
                                )}:R>\nMention: <@&${
                                    guildData.giveaway.mentions[
                                        options.mentions
                                    ]
                                }>`
                            );

                        return interaction.reply({
                            embeds: [cooldown_embed],
                            ephemeral: true,
                        });
                    } else {
                        cooldown = 180;
                        const cooldown_amount = cooldown * 1000;
                        const timpstamp = Date.now() + cooldown_amount;
                        jsoncooldowns[interaction.user.id].giveaway = timpstamp;
                        fs.writeFile(
                            "./giveaway-cooldowns.json",
                            JSON.stringify(jsoncooldowns),
                            (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            }
                        );
                    }
                } else if (options.mentions === "giveaway_massive") {
                    let readytimestamp =
                        jsoncooldowns[userID][options.mentions];

                    if (!readytimestamp) {
                        readytimestamp = 0;
                    }

                    const timeleft = new Date(readytimestamp);
                    let check =
                        timeleft - Date.now() >= timeleft ||
                        timeleft - Date.now() <= 0;

                    if (!check) {
                        const cooldown_embed =
                            new EmbedBuilder().setDescription(
                                `\`You are on cooldown for mentioning giveaways, please wait for cooldown to end or don't add mentions when using this command\`\n\`Other mentions may work if they are not on cooldown\`\nReady: <t:${Math.floor(
                                    readytimestamp / 1000
                                )}:R>\nMention: <@&${
                                    guildData.giveaway.mentions[
                                        options.mentions
                                    ]
                                }>`
                            );

                        return interaction.reply({
                            embeds: [cooldown_embed],
                            ephemeral: true,
                        });
                    } else {
                        cooldown = 300;
                        const cooldown_amount = cooldown * 1000;
                        const timpstamp = Date.now() + cooldown_amount;
                        jsoncooldowns[interaction.user.id].giveaway_massive =
                            timpstamp;
                        fs.writeFile(
                            "./giveaway-cooldowns.json",
                            JSON.stringify(jsoncooldowns),
                            (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            }
                        );
                    }
                } else if (options.mentions === "giveaway_nitro") {
                    let readytimestamp =
                        jsoncooldowns[userID][options.mentions];

                    if (!readytimestamp) {
                        readytimestamp = 0;
                    }

                    const timeleft = new Date(readytimestamp);
                    let check =
                        timeleft - Date.now() >= timeleft ||
                        timeleft - Date.now() <= 0;

                    if (!check) {
                        const cooldown_embed =
                            new EmbedBuilder().setDescription(
                                `\`You are on cooldown for mentioning giveaways, please wait for cooldown to end or don't add mentions when using this command\`\n\`Other mentions may work if they are not on cooldown\`\nReady: <t:${Math.floor(
                                    readytimestamp / 1000
                                )}:R>\nMention: <@&${
                                    guildData.giveaway.mentions[
                                        options.mentions
                                    ]
                                }>`
                            );

                        return interaction.reply({
                            embeds: [cooldown_embed],
                            ephemeral: true,
                        });
                    } else {
                        cooldown = 300;
                        const cooldown_amount = cooldown * 1000;
                        const timpstamp = Date.now() + cooldown_amount;
                        jsoncooldowns[interaction.user.id].giveaway_nitro =
                            timpstamp;
                        fs.writeFile(
                            "./giveaway-cooldowns.json",
                            JSON.stringify(jsoncooldowns),
                            (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            }
                        );
                    }
                }

                options.mentions =
                    guildData.giveaway.mentions[options.mentions];
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

            const mention_embed = new EmbedBuilder()
                .setColor(embedTheme.color)
                .setDescription(
                    `${embedTheme.emoji_mainpoint}**Sponsor:** ${
                        options.sponsor.user
                    }\n${embedTheme.emoji_mainpoint}**Message:** ${
                        options.message ? options.message : `\`none\``
                    }\n${
                        embedTheme.emoji_subpoint
                    }**Thank the sponsor in <#908201143660859433>**`
                )
                .setThumbnail(
                    "https://images-ext-1.discordapp.net/external/2y7jsoXk5r9GJEvoiA0tHNpYhzD9s7S6zeHEFnaelKQ/%3Fsize%3D1024/https/cdn.discordapp.com/icons/902334382939963402/a_a0b58c0fa37eab6c37f4b6310e300a99.gif?width=299&height=299"
                );

            interaction.reply({
                content: "Successfully mentioned this giveaway.",
                ephemeral: true,
            });

            await interaction.channel.send({
                content: mentions,
                embeds: [mention_embed],
            });
        }
    },
};
