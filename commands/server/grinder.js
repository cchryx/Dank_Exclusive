const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelType,
    PermissionsBitField,
    Message,
} = require("discord.js");

const GrinderModel = require("../../models/grinderSchema");

const { discord_check_role } = require("../../utils/discord");
const { error_reply } = require("../../utils/error");
const { grinders_map } = require("../../utils/grinder");
const { guild_fetch } = require("../../utils/guild");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("grinder")
        .setDescription("Grinder related commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a grinder permit.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Specify user within server.")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("payments")
                        .setDescription(
                            "How many days of payment did they pay."
                        )
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show a grinder permit.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Specify user within server.");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("display")
                .setDescription(
                    "Show all active grinders and when their payments will be due."
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("addpayments")
                .setDescription("Add payments to a grinder.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Specify user within server.")
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("payments")
                        .setDescription("Specify an number.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("kick")
                .setDescription("Delete a grinder permit.")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("Specify user server.")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("refresh")
                .setDescription("Refresh grinder board.")
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        const paymentIncrement = 3 * 1000 * 1000;
        const guildData = await guild_fetch(interaction.guildId);
        let grinderData;
        const checkAccess = await discord_check_role(interaction, [
            "938372143853502494",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "create") {
            let paymentDue;
            const options = {
                user: interaction.options.getMember("user"),
                payments: interaction.options.getNumber("payments"),
            };

            if (!options.user) {
                error_message = "User doesn't exist within the server.";
                return error_reply(interaction, error_message);
            }

            grinderData = await GrinderModel.findOne({
                userId: options.user.id,
            });

            if (grinderData) {
                error_message =
                    "Grinder permit for this user has already been created.";
                return error_reply(interaction, error_message);
            }

            options.payments = Math.round(options.payments);
            if (options.payments < 0) {
                error_message = "Specify a positive integer.";
                return error_reply(interaction, error_message);
            }

            paymentDue = Date.now() + options.payments * 86400000;

            interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Create grinder permit: SUCCESSFUL**\n*I created a grinder permit fo this user. Note when your next payment will be due.*${
                            guildData.miscData.roles.grinder
                                ? `\n*This user also has been granted the role: <@&${guildData.miscData.roles.grinder}>*`
                                : ""
                        }\n\nUser: ${
                            options.user
                        }\nPayments: \`${options.payments.toLocaleString()}\` \`⏣ ${(
                            options.payments * paymentIncrement
                        ).toLocaleString()}\`\nNext Payment: <t:${Math.floor(
                            paymentDue / 1000
                        )}:D> <t:${Math.floor(paymentDue / 1000)}:R>`
                    ),
                ],
            });

            if (guildData.miscData.roles.grinder) {
                interaction.guild.members.cache
                    .get(options.user.id)
                    .roles.add(guildData.miscData.roles.grinder);
            }

            return await GrinderModel.create({
                userId: options.user.id,
                payments: options.payments,
            });
        } else if (interaction.options.getSubcommand() === "show") {
            const options = {
                user: interaction.options.getUser("user"),
            };
            const target = options.user || interaction.user;

            grinderData = await GrinderModel.findOne({
                userId: target.id,
            });

            if (!grinderData) {
                error_message = "This user doesn't have a grinder permit.";
                return error_reply(interaction, error_message);
            }

            const paymentDue =
                grinderData.initialDate + grinderData.payments * 86400000;

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: `${target.tag || target.user.tag}`,
                            iconURL: target.displayAvatarURL(),
                        })
                        .setDescription(
                            `**Grinder Permit**\n*Here lies this user's grinder permit.*\n\nUser: ${target}\nTotal Contributions: \`⏣ ${(
                                grinderData.payments * paymentIncrement
                            ).toLocaleString()}\`\nPayments: \`${grinderData.payments.toLocaleString()}\`\n\nNext Payment: <t:${Math.floor(
                                paymentDue / 1000
                            )}:D> <t:${Math.floor(
                                paymentDue / 1000
                            )}:R>\nInitial Date: <t:${Math.floor(
                                grinderData.initialDate / 1000
                            )}:D> <t:${Math.floor(
                                grinderData.initialDate / 1000
                            )}:R>`
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "addpayments") {
            const options = {
                user: interaction.options.getMember("user"),
                payments: interaction.options.getNumber("payments"),
            };

            if (!options.user) {
                error_message = "User doesn't exist within the server.";
                return error_reply(interaction, error_message);
            }

            grinderData = await GrinderModel.findOne({
                userId: options.user.id,
            });

            if (!grinderData) {
                error_message = "Grinder permit for this user doesn't exist.";
                return error_reply(interaction, error_message);
            }

            options.payments = Math.round(options.payments);
            if (options.payments < 1) {
                error_message =
                    "Need at least 1 payment to add to grinder permit.";
                return error_reply(interaction, error_message);
            }

            grinderData.payments += options.payments;

            const paymentDue =
                grinderData.initialDate + grinderData.payments * 86400000;

            interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Add grinder payments: SUCCESSFUL**\n*I added payments to this user.*\n\nUser: ${
                            options.user
                        }\nPayments Added: \`${options.payments.toLocaleString()}\` \`⏣ ${(
                            options.payments * paymentIncrement
                        ).toLocaleString()}\`\n\nPayments: \`${grinderData.payments.toLocaleString()}\` \`⏣ ${(
                            grinderData.payments * paymentIncrement
                        ).toLocaleString()}\`\nNext Payment: <t:${Math.floor(
                            paymentDue / 1000
                        )}:D> <t:${Math.floor(paymentDue / 1000)}:R>`
                    ),
                ],
            });

            return await GrinderModel.findOneAndUpdate(
                { userId: grinderData.userId },
                grinderData
            );
        } else if (interaction.options.getSubcommand() === "display") {
            await grinders_map(interaction.channel);
        } else if (interaction.options.getSubcommand() === "kick") {
            const options = {
                user: interaction.options.getMember("user"),
            };

            grinderData = await GrinderModel.findOne({
                userId: options.user.id,
            });

            if (!grinderData) {
                error_message = "This user doesn't have a grinder permit.";
                return error_reply(interaction, error_message);
            }

            await GrinderModel.deleteOne({
                userId: options.user.id,
            });

            if (guildData.miscData.roles.grinder) {
                interaction.guild.members.cache
                    .get(options.user.id)
                    .roles.remove(guildData.miscData.roles.grinder);
            }

            if (guildData.miscData.channels.grindersnotice) {
                const grindernotice_channel = client.channels.cache.get(
                    guildData.miscData.channels.grindersnotice
                );

                grindernotice_channel.send({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `${options.user} has been kick from the grinder team by ${interaction.user}`
                        ),
                    ],
                });
            }

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Kick user from grinder team: SUCCESSFUL**\n*I kicked that user from the grinder team.*\n\nUser: ${options.user}`
                    ),
                ],
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "refresh") {
            if (!guildData.miscData.channels.grindersnotice) {
                error_message = "Grinder notice channel not set.";
                return error_reply(interaction, error_message);
            }

            const grindernotice_channel = client.channels.cache.get(
                guildData.miscData.channels.grindersnotice
            );

            let deleted;
            do {
                deleted = await grindernotice_channel.bulkDelete(100);
            } while (deleted.size != 0);

            await grinders_map(grindernotice_channel);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Refresh grinders notice board: SUCCESSFUL**\n*I refreshed the grinders notice board in <#${guildData.miscData.channels.grindersnotice}>.*`
                    ),
                ],
            });
        }
    },
};
