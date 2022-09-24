const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { error_reply } = require("../../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donate")
        .setDescription("Mentions a staff member to handle donations")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("guide")
                .setDescription(
                    "Guide that is channel specified, and tell you how to donate for heists, giveaways, and events."
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("giveaway")
                .setDescription(
                    "Mentions a staff member to handle giveaway donations"
                )
                .addStringOption((oi) => {
                    return oi
                        .setName("prize")
                        .setDescription("Giveaway prizes")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("duration")
                        .setDescription("Giveaway duration")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("winners")
                        .setDescription("Giveaway winners")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requirements")
                        .setDescription("Giveaway requirements");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription("Giveaway message");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("specifications")
                        .setDescription(
                            "Giveaway specifications that may include how you want the giveaway to be handled"
                        );
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("event")
                .setDescription(
                    "Mentions a staff member to handle event donations"
                )
                .addStringOption((oi) => {
                    return oi
                        .setName("prize")
                        .setDescription("Event prizes")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("event")
                        .setDescription("Event")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requirements")
                        .setDescription("Event requirements");
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
            subcommand
                .setName("heist")
                .setDescription(
                    "Mentions a staff member to handle heist donations"
                )
                .addNumberOption((oi) => {
                    return oi
                        .setName("amount")
                        .setDescription("Giveaway prizes")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("requirements")
                        .setDescription("Heist requirements");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("message")
                        .setDescription("Heist message");
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("specifications")
                        .setDescription(
                            "Giveaway specifications that may include how you want the heist to be handled"
                        );
                })
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        if (interaction.options.getSubcommand() === "guide") {
            const donate_embed = new EmbedBuilder()
                .setColor("#deebff")
                .setThumbnail(
                    `https://images-ext-1.discordapp.net/external/2y7jsoXk5r9GJEvoiA0tHNpYhzD9s7S6zeHEFnaelKQ/%3Fsize%3D1024/https/cdn.discordapp.com/icons/902334382939963402/a_a0b58c0fa37eab6c37f4b6310e300a99.gif?width=299&height=299`
                );

            if (interaction.channelId === "902344172294537257") {
                donate_embed
                    .setTitle(`How to donate for a giveaway`)
                    .setDescription(
                        `\`\`\`/donate giveaway\`\`\`\n<:yellowdot:959974563582718032> The minimum donation is **1 million (dank)**, **10 million (bro)**\n<:yellowdot:959974563582718032> Dank items we will use dank memer's trading price\n<:yellowdot:959974563582718032> Bro items we will use heist circle's item values instead\n<:yellowdot:959974563582718032> 2+ flashes will be done in <#908201143660859433> instead of giveaway channels\n<:yellowdot:959974563582718032> Wait patiently for a <@&902372521213587456> to take your donations`
                    );

                interaction.reply({
                    embeds: [donate_embed],
                });
            } else if (interaction.channelId === "902358264816209950") {
                donate_embed
                    .setTitle(`How to donate for a heist`)
                    .setDescription(
                        `\`\`\`/donate heist\`\`\`\n<:yellowdot:959974563582718032> The minimum donation is **1 million (dank)**, **10 million (bro)**\n<:yellowdot:959974563582718032> Wait patiently for a <@&902358680748568596> to take your donations`
                    );

                interaction.reply({
                    embeds: [donate_embed],
                });
            } else if (interaction.channelId === "902733255139282974") {
                donate_embed
                    .setTitle(`How to donate for an event`)
                    .setDescription(
                        `\`\`\`/donate event\`\`\`\n<:yellowdot:959974563582718032> The minimum donation is **1 million (dank)**\n<:yellowdot:959974563582718032> Dank items we will use dank memer's trading price\n<:yellowdot:959974563582718032> Wait patiently for an <@&904459850812100649> to take your donations`
                    );

                interaction.reply({
                    embeds: [donate_embed],
                });
            } else {
                error_message = `No donation guides for this channel`;
                return error_reply(interaction, error_message);
            }
        } else if (interaction.options.getSubcommand() === "giveaway") {
            if (interaction.channelId !== "902344172294537257") {
                error_message = `You are only allowed to use this command in <#902344172294537257>`;
                return error_reply(interaction, error_message);
            }
            const options = {
                requirements: interaction.options.getString("requirements"),
                prize: interaction.options.getString("prize"),
                duration: interaction.options.getString("duration"),
                winners: interaction.options.getNumber("winners"),
                message: interaction.options.getString("message"),
                specifications: interaction.options.getString("specifications"),
            };

            const gdonate_embed = new EmbedBuilder()
                .setTitle("New Giveaway Donation")
                .setColor("#deebff")
                .setDescription(
                    `<:aqua_dash:959862042515341423> **Sponsor:** ${
                        interaction.user
                    }\n<:aqua_dash:959862042515341423> **Duration:** \`${
                        options.duration
                    }\`\n<:aqua_dash:959862042515341423> **Winners:** \`${
                        options.winners
                    }\`\n<:aqua_dash:959862042515341423> **Prizes:** \`${
                        options.prize
                    }\`\n<:aqua_dash:959862042515341423> **Requirements:** \`${
                        options.requirements || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Specifications:** \`${
                        options.specifications || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Message:** \`${
                        options.message || "none"
                    }\``
                )
                .setThumbnail(`${interaction.user.displayAvatarURL()}`);

            interaction.reply({
                content: `Giveaway donation request submitted, please wait for a giveaway manager to respond to this request.`,
                ephemeral: true,
            });
            interaction.channel.send({
                content: `<@&902372521213587456>`,
                embeds: [gdonate_embed],
            });
        } else if (interaction.options.getSubcommand() === "event") {
            if (interaction.channelId !== "902733255139282974") {
                error_message = `You are only allowed to use this command in <#902733255139282974>`;
                return error_reply(interaction, error_message);
            }

            const options = {
                requirements: interaction.options.getString("requirements"),
                prize: interaction.options.getString("prize"),
                event: interaction.options.getString("event"),
                message: interaction.options.getString("message"),
                specifications: interaction.options.getString("specifications"),
            };

            const edonate_embed = new EmbedBuilder()
                .setTitle("New Event Donation")
                .setColor("#deebff")
                .setDescription(
                    `<:aqua_dash:959862042515341423> **Sponsor:** ${
                        interaction.user
                    }\n<:aqua_dash:959862042515341423> **Event:** \`${
                        options.event
                    }\`\n<:aqua_dash:959862042515341423> **Prizes:** \`${
                        options.prize
                    }\`\n<:aqua_dash:959862042515341423> **Requirements:** \`${
                        options.requirements || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Specifications:** \`${
                        options.specifications || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Message:** \`${
                        options.message || "none"
                    }\``
                )
                .setThumbnail(`${interaction.user.displayAvatarURL()}`);

            interaction.reply({
                content: `Event donation request submitted, please wait for an event manager to respond to this request.`,
                ephemeral: true,
            });
            interaction.channel.send({
                content: `<@&904459850812100649>`,
                embeds: [edonate_embed],
            });
        } else if (interaction.options.getSubcommand() === "heist") {
            if (interaction.channelId !== "902358264816209950") {
                error_message = `You are only allowed to use this command in <#902358264816209950>`;
                return error_reply(interaction, error_message);
            }

            const options = {
                requirements: interaction.options.getString("requirements"),
                amount: interaction.options.getNumber("amount"),
                message: interaction.options.getString("message"),
                specifications: interaction.options.getString("specifications"),
            };

            const hdonate_embed = new EmbedBuilder()
                .setTitle("New Heist Donation")
                .setColor("#deebff")
                .setDescription(
                    `<:aqua_dash:959862042515341423> **Sponsor:** ${
                        interaction.user
                    }\n<:aqua_dash:959862042515341423> **Amount:** \`${options.amount.toLocaleString()}\`\n<:aqua_dash:959862042515341423> **Requirements:** \`${
                        options.requirements || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Specifications:** \`${
                        options.specifications || "none"
                    }\`\n<:aqua_dash:959862042515341423> **Message:** \`${
                        options.message || "none"
                    }\``
                )
                .setThumbnail(`${interaction.user.displayAvatarURL()}`);

            interaction.reply({
                content: `Heist donation request submitted, please wait for an heist manager to respond to this request.`,
                ephemeral: true,
            });
            interaction.channel.send({
                content: `<@&902358680748568596>`,
                embeds: [hdonate_embed],
            });
        }
    },
};
