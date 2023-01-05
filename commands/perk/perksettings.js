const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, Embed } = require("discord.js");

const GuildModel = require("../../models/guildSchema");

const { discord_check_role } = require("../../utils/discord");
const { error_reply } = require("../../utils/error");
const { guild_fetch } = require("../../utils/guild");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perksettings")
        .setDescription("Server perk settings.")
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("perkset")
                .setDescription("Set a number of perk-slots to role.")
                .addStringOption((oi) => {
                    return oi
                        .setName("category")
                        .setDescription(
                            "Which perk category do you want to set slots to."
                        )
                        .addChoices(
                            {
                                name: "Auto-reaction",
                                value: "autoReaction",
                            },
                            { name: "Role", value: "role" },
                            {
                                name: "Channel",
                                value: "channel",
                            }
                        )
                        .setRequired(true);
                })
                .addNumberOption((oi) => {
                    return oi
                        .setName("slots")
                        .setDescription("Specify an positive interger.")
                        .setRequired(true);
                })
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Specify a role.")
                        .setRequired(true);
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("perkremove")
                .setDescription("Remove a role from a perk category.")
                .addStringOption((oi) => {
                    return oi
                        .setName("category")
                        .setDescription(
                            "Which perk category do you want to set slots to."
                        )
                        .addChoices(
                            {
                                name: "Auto-reaction",
                                value: "autoReaction",
                            },
                            { name: "Role", value: "role" },
                            {
                                name: "Channel",
                                value: "channel",
                            }
                        )
                        .setRequired(true);
                })
                .addRoleOption((oi) => {
                    return oi
                        .setName("role")
                        .setDescription("Specify a role.")
                        .setRequired(true);
                });
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("perkshow")
                .setDescription("Show perk-slots of each category.");
        }),
    cooldown: 10,
    async execute(interaction) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        const checkAccess = await discord_check_role(interaction, [
            "938372143853502494",
        ]);
        if (checkAccess === false) {
            error_message = "You don't have the roles to use this command.";
            return error_reply(interaction, error_message);
        }

        if (interaction.options.getSubcommand() === "perkset") {
            const options = {
                category: interaction.options.getString("category"),
                role: interaction.options.getRole("role"),
                slots: interaction.options.getNumber("slots"),
            };

            options.slots = Math.floor(options.slots);
            if (options.slots < 1) {
                options.slots *= -1;
            }

            guildData.perk[options.category][options.role.id] = options.slots;

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Set perk slots: SUCCESSFUL**\n\nCategory: \`${options.category.toLowerCase()}\`\nRole: ${
                            options.role
                        }\nSlots: \`${options.slots.toLocaleString()}\``
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "perkremove") {
            const options = {
                category: interaction.options.getString("category"),
                role: interaction.options.getRole("role"),
            };

            if (
                !guildData.perk[options.category].hasOwnProperty(
                    options.role.id
                )
            ) {
                error_message = `${
                    options.role
                } doesn't have any set slots in the perk category \`${options.category.toLowerCase()}\`.`;
                return error_reply(interaction, error_message);
            }

            delete guildData.perk[options.category][options.role.id];

            await GuildModel.findOneAndUpdate(
                { guildId: guildData.guildId },
                guildData
            );

            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Remove perk slots: SUCCESSFUL**\n\nCategory: \`${options.category.toLowerCase()}\`\nRole: ${
                            options.role
                        }`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "perkshow") {
            const perksettings_embed = new EmbedBuilder()
                .setTitle("Perk Settings")
                .setDescription("*Here lies all the perk settings.*");
            const perksettings_display = [];

            for (const category in guildData.perk) {
                if (category === "placement") continue;
                perksettings_display.push({
                    name: category.toLowerCase(),
                    value:
                        Object.keys(guildData.perk[category])
                            .map((roleId) => {
                                return `\`+ ${guildData.perk[category][roleId]}\` <@&${roleId}>`;
                            })
                            .join("\n") || "`No perks set`",
                    inline: true,
                });
            }
            perksettings_embed.setFields(perksettings_display);

            return interaction.reply({ embeds: [perksettings_embed] });
        }
    },
};
