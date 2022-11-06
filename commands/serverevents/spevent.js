const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const GuildModel = require("../../models/guildSchema");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("spevent")
        .setDescription("Special event related commands")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("createtoken")
                .setDescription("Create special event token")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription("Name of special event token")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("icon")
                        .setDescription("Icon of special event token")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("deletetoken")
                .setDescription("Delete a special event token")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription("Name of special event token")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("showtokens")
                .setDescription("Show special event tokens")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("updatetoken")
                .setDescription("Update a special event token")
                .addStringOption((oi) => {
                    return oi
                        .setName("name")
                        .setDescription("Name of special event token")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("icon")
                        .setDescription("New icon of special event token")
                        .setRequired(true);
                })
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const dankexData = await GuildModel.findOne({
            guildid: "902334382939963402",
        });
        const embedTheme = dankexData.theme;
        const tokens = Object.keys(dankexData.speventtokens);
        if (
            interaction.options.getSubcommand() !== "showtokens" &&
            !interaction.member.roles.cache.has("938372143853502494") === true
        ) {
            error_message = `\`You don't have the required permissions to preform this action\``;
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "createtoken") {
            const options = {
                icon: interaction.options.getString("icon"),
                name: interaction.options.getString("name"),
            };

            if (tokens.includes(options.name)) {
                error_message = `\`Special event token already exists:\`\n\n**Name:** \`${
                    options.name
                }\`\n**Icon:** ${dankexData.speventtokens[options.name].icon}`;
                return error_reply(interaction, error_message);
            }

            const embed = new EmbedBuilder()
                .setColor(embedTheme.color)
                .setDescription("Checking if your emoji is valid...");

            const createtoken_msg = await interaction.reply({
                embeds: [embed],
                fetchReply: true,
            });

            dankexData.speventtokens[options.name] = { icon: "" };
            const verifyemoji = await createtoken_msg
                .react(`${options.icon}`)
                .catch(async (error) => {
                    if (error.code === 10014) {
                        dankexData.speventtokens[options.name].icon = "⬛";
                        return false;
                    }
                });

            if (verifyemoji !== false) {
                if (verifyemoji._emoji.id) {
                    if (verifyemoji._emoji.animated === true) {
                        emoji = `<a:${verifyemoji._emoji.name}:${verifyemoji._emoji.id}>`;
                    } else {
                        emoji = `<:${verifyemoji._emoji.name}:${verifyemoji._emoji.id}>`;
                    }
                } else {
                    emoji = `${verifyemoji._emoji.name}`;
                }
                dankexData.speventtokens[options.name].icon = options.icon;
            }

            await GuildModel.findOneAndUpdate(
                { guildid: "902334382939963402" },
                dankexData
            );
            message = `<a:ravena_check:1002981211708325950> **Token created successfully**\nName: \`${
                options.name
            }\`\nIcon: ${dankexData.speventtokens[options.name].icon}`;
            embed.setColor("Green").setDescription(message);
            return createtoken_msg.edit({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "showtokens") {
            const tokensdisplay = tokens
                .map((token) => {
                    return `${dankexData.speventtokens[token].icon} \`${token}\``;
                })
                .join("\n");

            const showtokens_embed = new EmbedBuilder()
                .setTitle("Special Event Tokens")
                .setColor(embedTheme.color)
                .setDescription(`${tokensdisplay}`);

            return interaction.reply({ embeds: [showtokens_embed] });
        } else if (interaction.options.getSubcommand() === "deletetoken") {
            const options = {
                name: interaction.options.getString("name"),
            };

            if (!tokens.includes(options.name)) {
                error_message = `\`Special event token doesn't exist:\`\n\n**Name:** \`${options.name}\``;
                return error_reply(interaction, error_message);
            }

            const deletetoken_embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(
                    `<a:ravena_check:1002981211708325950> **Token deleted successfully**\nName: \`${
                        options.name
                    }\`\nIcon: ${dankexData.speventtokens[options.name].icon}`
                );

            delete dankexData.speventtokens[options.name];

            await GuildModel.findOneAndUpdate(
                { guildid: "902334382939963402" },
                dankexData
            );

            interaction.reply({ embeds: [deletetoken_embed] });
        } else if (interaction.options.getSubcommand() === "updatetoken") {
            const options = {
                name: interaction.options.getString("name"),
                icon: interaction.options.getString("icon"),
            };

            if (!tokens.includes(options.name)) {
                error_message = `\`Special event token doesn't exist:\`\n\n**Name:** \`${options.name}\``;
                return error_reply(interaction, error_message);
            }

            const embed = new EmbedBuilder()
                .setColor(embedTheme.color)
                .setDescription("Checking if your emoji is valid...");

            const createtoken_msg = await interaction.reply({
                embeds: [embed],
                fetchReply: true,
            });

            const verifyemoji = await createtoken_msg
                .react(`${options.icon}`)
                .catch(async (error) => {
                    if (error.code === 10014) {
                        return false;
                    }
                });

            if (verifyemoji !== false) {
                if (verifyemoji._emoji.id) {
                    if (verifyemoji._emoji.animated === true) {
                        emoji = `<a:${verifyemoji._emoji.name}:${verifyemoji._emoji.id}>`;
                    } else {
                        emoji = `<:${verifyemoji._emoji.name}:${verifyemoji._emoji.id}>`;
                    }
                } else {
                    emoji = `${verifyemoji._emoji.name}`;
                }
                dankexData.speventtokens[options.name].icon = options.icon;
            }

            await GuildModel.findOneAndUpdate(
                { guildid: "902334382939963402" },
                dankexData
            );
            message = `<a:ravena_check:1002981211708325950> **Token created successfully**\nName: \`${
                options.name
            }\`\nIcon: ${dankexData.speventtokens[options.name].icon}`;
            embed.setColor("Green").setDescription(message);
            return createtoken_msg.edit({ embeds: [embed] });
        }
    },
};
