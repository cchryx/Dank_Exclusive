const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const {
    dono_set,
    dono_fetch,
    dono_add,
    dono_remove,
} = require("../../utils/donations");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donation")
        .setDescription("Add, remove, set a user's donations")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your donations")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("User's donations");
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("dankmemer")
                .setDescription(
                    "Add, remove, set a user's Dank Memer donations"
                )
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("User's donations you want to edit")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("action")
                        .setDescription("Action you want to execute")
                        .setRequired(true)
                        .addChoices(
                            { name: "set", value: "set" },
                            { name: "add", value: "add" },
                            { name: "remove", value: "remove" }
                        );
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("amount")
                        .setDescription("Specify a number")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("investment")
                .setDescription(
                    "Add, remove, set a user's investment donations"
                )
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("User's donations you want to edit")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("action")
                        .setDescription("Action you want to execute")
                        .setRequired(true)
                        .addChoices(
                            { name: "set", value: "set" },
                            { name: "add", value: "add" },
                            { name: "remove", value: "remove" }
                        );
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("amount")
                        .setDescription("Specify a number")
                        .setRequired(true);
                })
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("brobot")
                .setDescription("Add, remove, set a user's Bro Bot donations")
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription("User's donations you want to edit")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("action")
                        .setDescription("Action you want to execute")
                        .setRequired(true)
                        .addChoices(
                            { name: "set", value: "set" },
                            { name: "add", value: "add" },
                            { name: "remove", value: "remove" }
                        );
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("amount")
                        .setDescription("Specify a number")
                        .setRequired(true);
                })
        ),
    cooldown: 10,
    async execute(interaction, client) {
        let error_message;
        if (interaction.options.getSubcommand() === "dankmemer") {
            const donation_roles = [
                {
                    role: "985204839376121916",
                    amount: 2 * 1000 * 1000 * 1000,
                },
                {
                    role: "904228574398136320",
                    amount: 1 * 1000 * 1000 * 1000,
                },
                {
                    role: "904232915003666463",
                    amount: 750 * 1000 * 1000,
                },
                {
                    role: "904228379149094953",
                    amount: 500 * 1000 * 1000,
                },
                {
                    role: "904228143072686150",
                    amount: 250 * 1000 * 1000,
                },
                {
                    role: "904227996007796766",
                    amount: 100 * 1000 * 1000,
                },
                {
                    role: "904227500228481106",
                    amount: 50 * 1000 * 1000,
                },
                {
                    role: "904227413679018044",
                    amount: 25 * 1000 * 1000,
                },
                {
                    role: "904227284079235112",
                    amount: 10 * 1000 * 1000,
                },
            ];
            if (
                !interaction.member.roles.cache.has("1016888202725965864") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                user: interaction.options.getMember("user"),
                action: interaction.options.getString("action"),
                amount: interaction.options.getNumber("amount"),
            };

            if (!options.user) {
                error_message = `\`User isn't in this server\``;
                return error_reply(interaction, error_message);
            }

            const donationData = await dono_fetch(options.user.id);

            async function donation_role_check(amount) {
                let role_message = `\`no roles were edited\``;
                const donations_rolesadded = [];
                const donations_rolesremoved = [];
                donation_roles.forEach((role) => {
                    if (
                        amount >= role.amount &&
                        options.user.roles.cache.has(role.role) === false
                    ) {
                        options.user.roles.add(role.role);
                        donations_rolesadded.push(role.role);
                    } else if (
                        amount < role.amount &&
                        options.user.roles.cache.has(role.role) === true
                    ) {
                        donations_rolesremoved.push(role.role);
                        options.user.roles.remove(role.role);
                    }
                });

                if (donations_rolesadded.length > 0) {
                    const role_added = donations_rolesadded
                        .map((role) => {
                            return `<@&${role}>`;
                        })
                        .join("\n");

                    if (role_message === `\`no roles were edited\``) {
                        role_message = `**Roles Added:**\n${role_added}`;
                    }
                }

                if (donations_rolesremoved.length > 0) {
                    const role_removed = donations_rolesremoved
                        .map((role) => {
                            return `<@&${role}>`;
                        })
                        .join("\n");

                    if (role_message === `\`no roles were edited\``) {
                        role_message = `**Roles Removed:**\n${role_removed}`;
                    }
                }

                return role_message;
            }

            let description;
            let donation_roles_edit;
            if (options.action === "set") {
                await dono_set(options.user.id, "dankmemer", options.amount);
                description = `**Set:** \`⏣ ${options.amount.toLocaleString()}\`\n**Total Donations:** \`⏣ ${options.amount.toLocaleString()}\``;
                donation_roles_edit = await donation_role_check(options.amount);
            } else if (options.action === "add") {
                await dono_add(options.user.id, "dankmemer", options.amount);
                description = `**Added:** \`⏣ ${options.amount.toLocaleString()}\`\n**Total Donations:** \`⏣ ${
                    isNaN(options.amount + donationData.dankmemer)
                        ? options.amount.toLocaleString()
                        : (
                              options.amount + donationData.dankmemer
                          ).toLocaleString()
                }\``;
                donation_roles_edit = await donation_role_check(
                    options.amount + donationData.dankmemer || options.amount
                );
            } else if (options.action === "remove") {
                await dono_remove(options.user.id, "dankmemer", options.amount);
                description = `**Removed:** \`⏣ ${options.amount.toLocaleString()}\`\n**Total Donations:** \`⏣ ${
                    isNaN(donationData.dankmemer - options.amount)
                        ? options.amount.toLocaleString()
                        : (
                              donationData.dankmemer - options.amount
                          ).toLocaleString()
                }\``;
                donation_roles_edit = await donation_role_check(
                    donationData.dankmemer - options.amount || options.amount
                );
            }

            const donation_embed = new EmbedBuilder()
                .setColor("#FFFEFC")
                .setDescription(
                    `**User:** ${options.user}\n${description}\n\n${donation_roles_edit}`
                );

            interaction.reply({ embeds: [donation_embed] });
            const channel = client.channels.cache
                .get("1003661988351709244")
                .send({ embeds: [donation_embed] });
        } else if (interaction.options.getSubcommand() === "investment") {
            const donation_roles = [
                {
                    role: "933489998169268264",
                    amount: 100,
                },
                {
                    role: "933489867403448330",
                    amount: 75,
                },
                {
                    role: "933489817319243837",
                    amount: 50,
                },
                {
                    role: "911955871624478802",
                    amount: 25,
                },
                {
                    role: "932412398499921990",
                    amount: 15,
                },
                {
                    role: "911955198631628851",
                    amount: 10,
                },
            ];
            if (
                !interaction.member.roles.cache.has("938372143853502494") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                user: interaction.options.getMember("user"),
                action: interaction.options.getString("action"),
                amount: interaction.options.getNumber("amount"),
            };

            if (!options.user) {
                error_message = `\`User isn't in this server\``;
                return error_reply(interaction, error_message);
            }

            const donationData = await dono_fetch(options.user.id);

            async function donation_role_check(amount) {
                let role_message = `\`no roles were edited\``;
                const donations_rolesadded = [];
                const donations_rolesremoved = [];
                donation_roles.forEach((role) => {
                    if (
                        amount >= role.amount &&
                        options.user.roles.cache.has(role.role) === false
                    ) {
                        options.user.roles.add(role.role);
                        donations_rolesadded.push(role.role);
                    } else if (
                        amount < role.amount &&
                        options.user.roles.cache.has(role.role) === true
                    ) {
                        donations_rolesremoved.push(role.role);
                        options.user.roles.remove(role.role);
                    }
                });

                if (donations_rolesadded.length > 0) {
                    const role_added = donations_rolesadded
                        .map((role) => {
                            return `<@&${role}>`;
                        })
                        .join("\n");

                    if (role_message === `\`no roles were edited\``) {
                        role_message = `**Roles Added:**\n${role_added}`;
                    }
                }

                if (donations_rolesremoved.length > 0) {
                    const role_removed = donations_rolesremoved
                        .map((role) => {
                            return `<@&${role}>`;
                        })
                        .join("\n");

                    if (role_message === `\`no roles were edited\``) {
                        role_message = `**Roles Removed:**\n${role_removed}`;
                    }
                }

                return role_message;
            }

            let description;
            let donation_roles_edit;
            if (options.action === "set") {
                await dono_set(options.user.id, "investment", options.amount);
                description = `**Set:** \`$ ${options.amount.toLocaleString()}\`\n**Total Donations:** \`$ ${options.amount.toLocaleString()}\``;
                donation_roles_edit = await donation_role_check(options.amount);
            } else if (options.action === "add") {
                await dono_add(options.user.id, "investment", options.amount);
                description = `**Added:** \`$ ${options.amount.toLocaleString()}\`\n**Total Donations:** \`$ ${
                    isNaN(options.amount + donationData.investment)
                        ? options.amount.toLocaleString()
                        : (
                              options.amount + donationData.investment
                          ).toLocaleString()
                }\``;
                donation_roles_edit = await donation_role_check(
                    options.amount + donationData.investment || options.amount
                );
            } else if (options.action === "remove") {
                await dono_remove(
                    options.user.id,
                    "investment",
                    options.amount
                );
                description = `**Removed:** \`$ ${options.amount.toLocaleString()}\`\n**Total Donations:** \`$ ${
                    isNaN(donationData.investment - options.amount)
                        ? options.amount.toLocaleString()
                        : (
                              donationData.investment - options.amount
                          ).toLocaleString()
                }\``;
                donation_roles_edit = await donation_role_check(
                    donationData.investment - options.amount || options.amount
                );
            }

            const donation_embed = new EmbedBuilder()
                .setColor("#FFFEFC")
                .setDescription(
                    `**User:** ${options.user}\n${description}\n\n${donation_roles_edit}`
                );

            interaction.reply({ embeds: [donation_embed] });
            const channel = client.channels.cache
                .get("1003661988351709244")
                .send({ embeds: [donation_embed] });
        } else if (interaction.options.getSubcommand() === "brobot") {
            const donation_roles = [
                {
                    role: "940020072754331688",
                    amount: 10 * 1000 * 1000 * 1000,
                },
                {
                    role: "1023282518872563804",
                    amount: 5 * 1000 * 1000 * 1000,
                },
                {
                    role: "959657351709868042",
                    amount: 1 * 1000 * 1000 * 1000,
                },
                {
                    role: "940020773022740581",
                    amount: 500 * 1000 * 1000,
                },
                {
                    role: "940020450585608252",
                    amount: 250 * 1000 * 1000,
                },
            ];
            if (
                !interaction.member.roles.cache.has("959926844176613396") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                user: interaction.options.getMember("user"),
                action: interaction.options.getString("action"),
                amount: interaction.options.getNumber("amount"),
            };

            if (!options.user) {
                error_message = `\`User isn't in this server\``;
                return error_reply(interaction, error_message);
            }

            const donationData = await dono_fetch(options.user.id);

            async function donation_role_check(amount) {
                let role_message = `\`no roles were edited\``;
                const donations_rolesadded = [];
                const donations_rolesremoved = [];
                donation_roles.forEach((role) => {
                    if (
                        amount >= role.amount &&
                        options.user.roles.cache.has(role.role) === false
                    ) {
                        options.user.roles.add(role.role);
                        donations_rolesadded.push(role.role);
                    } else if (
                        amount < role.amount &&
                        options.user.roles.cache.has(role.role) === true
                    ) {
                        donations_rolesremoved.push(role.role);
                        options.user.roles.remove(role.role);
                    }
                });

                if (donations_rolesadded.length > 0) {
                    const role_added = donations_rolesadded
                        .map((role) => {
                            return `<@&${role}>`;
                        })
                        .join("\n");

                    if (role_message === `\`no roles were edited\``) {
                        role_message = `**Roles Added:**\n${role_added}`;
                    }
                }

                if (donations_rolesremoved.length > 0) {
                    const role_removed = donations_rolesremoved
                        .map((role) => {
                            return `<@&${role}>`;
                        })
                        .join("\n");

                    if (role_message === `\`no roles were edited\``) {
                        role_message = `**Roles Removed:**\n${role_removed}`;
                    }
                }

                return role_message;
            }

            let description;
            let donation_roles_edit;
            if (options.action === "set") {
                await dono_set(options.user.id, "brobot", options.amount);
                description = `**Set:** \`💵 ${options.amount.toLocaleString()}\`\n**Total Donations:** \`💵 ${options.amount.toLocaleString()}\``;
                donation_roles_edit = await donation_role_check(options.amount);
            } else if (options.action === "add") {
                await dono_add(options.user.id, "brobot", options.amount);
                description = `**Added:** \`💵 ${options.amount.toLocaleString()}\`\n**Total Donations:** \`💵 ${
                    isNaN(options.amount + donationData.brobot)
                        ? options.amount.toLocaleString()
                        : (
                              options.amount + donationData.brobot
                          ).toLocaleString()
                }\``;
                donation_roles_edit = await donation_role_check(
                    options.amount + donationData.brobot || options.amount
                );
            } else if (options.action === "remove") {
                await dono_remove(options.user.id, "brobot", options.amount);
                description = `**Removed:** \`💵 ${options.amount.toLocaleString()}\`\n**Total Donations:** \`💵 ${
                    isNaN(donationData.brobot - options.amount)
                        ? options.amount.toLocaleString()
                        : (
                              donationData.brobot - options.amount
                          ).toLocaleString()
                }\``;
                donation_roles_edit = await donation_role_check(
                    donationData.brobot - options.amount || options.amount
                );
            }

            const donation_embed = new EmbedBuilder()
                .setColor("#FFFEFC")
                .setDescription(
                    `**Edited by:** ${interaction.user}\n**User:** ${options.user}\n${description}\n\n${donation_roles_edit}`
                );

            interaction.reply({ embeds: [donation_embed] });
            const channel = client.channels.cache
                .get("1003661988351709244")
                .send({ embeds: [donation_embed] });
        } else if (interaction.options.getSubcommand() === "show") {
            const donation_icon = {
                dankmemer: "⏣",
                investment: "$",
                brobot: "💵",
            };
            const options = {
                user: interaction.options.getMember("user"),
            };
            const target = options.user || interaction.user;
            const donationData = await dono_fetch(target.id);

            let donations_map = Object.keys(donationData)
                .map((key) => {
                    return `**${key}:** \`${donation_icon[key]} ${donationData[
                        key
                    ].toLocaleString()}\``;
                })
                .join("\n");

            if (Object.keys(donationData) <= 0) {
                donations_map = `\`no record of donations\``;
            }

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FFFEFC")
                        .setDescription(
                            `**User:** ${target}\n\n__**Donations:**__\n${donations_map}`
                        ),
                ],
            });
        }
    },
};
