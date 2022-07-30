const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkar")
        .setDescription("Perk command: add/edit your autoreaction")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your current autoreactions")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Choose an autoreaction to remove")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Choose add an autoreaction")
                .addStringOption((oi) => {
                    return oi
                        .setName("emoji")
                        .setDescription(
                            "A valid role that exists in this server"
                        )
                        .setRequired(true);
                })
        ),
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        let userData = await user_fetch(interaction.user.id);
        if (interaction.options.getSubcommand() === "show") {
            let slots_max = 0;
            let slots_used = userData.autoreaction.length;
            let hasroles_display;
            let slots_display;

            let hasroles = [];
            Object.keys(guildData.perkar_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    slots_max = slots_max + guildData.perkar_roles[key];
                    hasroles.push(key);
                }
            });

            if (slots_used > slots_max) {
                userData.autoreaction = userData.autoreaction.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                slots_used = userData.autoreaction.length;
            }

            if (slots_used === 0) {
                slots_display = `\`no slots\``;
            } else {
                slots_display = userData.autoreaction
                    .map((emoji) => {
                        const slot_location =
                            userData.autoreaction.indexOf(emoji) + 1;
                        return `Slot ${slot_location}: ${emoji}`;
                    })
                    .join("\n");
            }

            if (guildData.perkar_roles) {
                hasroles_display = Object.keys(guildData.perkar_roles)
                    .map((key) => {
                        let status = "<a:ravena_uncheck:1002983318565965885>";

                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === key
                            )
                        ) {
                            status = "<a:ravena_check:1002981211708325950>";
                        }
                        return `${status}<@&${key}>\`+ ${guildData.perkar_roles[key]}\``;
                    })
                    .join("\n");
            } else {
                hasroles_display = `\`server has no perk autoreaction roles\``;
            }

            const sub_embed = new EmbedBuilder().setDescription(
                `\`\`\`diff\nSubcommands:\n- /perkar remove\n+ /perkar add\`\`\``
            );
            const show_embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Perk Autoreactions")
                .setDescription(
                    `**Max Slots:** \`${slots_max.toLocaleString()}\`\n**Avaliable Slots:** \`${
                        slots_max - slots_used
                    }\``
                )
                .addFields(
                    {
                        name: "Your Slots ↭",
                        value: `${slots_display}`,
                        inline: true,
                    },
                    {
                        name: "Autoreaction Roles ↭",
                        value: `${hasroles_display}`,
                        inline: true,
                    }
                );

            return interaction.reply({ embeds: [show_embed, sub_embed] });
        } else if (interaction.options.getSubcommand() === "add") {
            const options = {
                emoji: interaction.options.getString("emoji"),
            };
            let slots_max = 0;
            let slots_used = userData.autoreaction.length;
            let slots_display;
            let hasroles_display;
            let message;

            let hasroles = [];
            Object.keys(guildData.perkar_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    slots_max = slots_max + guildData.perkar_roles[key];
                    hasroles.push(key);
                }
            });

            if (slots_used === 0) {
                slots_display = `\`no slots\``;
            } else {
                slots_display = userData.autoreaction
                    .map((emoji) => {
                        const slot_location =
                            userData.autoreaction.indexOf(emoji) + 1;
                        return `Slot ${slot_location}: ${emoji}`;
                    })
                    .join("\n");
            }

            if (guildData.perkar_roles) {
                hasroles_display = Object.keys(guildData.perkar_roles)
                    .map((key) => {
                        let status = "<a:ravena_uncheck:1002983318565965885>";

                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === key
                            )
                        ) {
                            status = "<a:ravena_check:1002981211708325950>";
                        }
                        return `${status}<@&${key}>\`+ ${guildData.perkar_roles[key]}\``;
                    })
                    .join("\n");
            } else {
                hasroles_display = `\`server has no perk autoreaction roles\``;
            }

            if (slots_used >= slots_max) {
                userData.autoreaction = userData.autoreaction.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                slots_used = userData.autoreaction.length;

                const sub_embed = new EmbedBuilder().setDescription(
                    `\`\`\`diff\nSubcommands:\n- /perkar remove\n# /perkar show\`\`\``
                );
                message = `**You have reached you max amount of autoreaction slots of \`${slots_max}\`, so you aren't able to add more**`;
                const error_embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(message)
                    .addFields(
                        {
                            name: "Your Slots ↭",
                            value: `**Max Slots:** \`${slots_max.toLocaleString()}\`\n**Avaliable Slots:** \`${
                                slots_max - slots_used
                            }\``,
                            inline: true,
                        },
                        {
                            name: "Autoreaction Roles ↭",
                            value: `${hasroles_display}`,
                            inline: true,
                        }
                    );
                return interaction.reply({
                    embeds: [error_embed, sub_embed],
                    ephemeral: true,
                });
            }

            let emoji = options.emoji;

            if (userData.autoreaction.includes(`${options.emoji}`)) {
                message = `**That emoji already exits in one of your autoreaction slots**\nEmoji: ${options.emoji}`;
                const error_embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(message);
                return interaction.reply({
                    embeds: [error_embed],
                    ephemeral: true,
                });
            }

            const embed = new EmbedBuilder()
                .setColor("Random")
                .setDescription("Checking if your emoji is valid...");

            const verify_msg = await interaction.reply({
                embeds: [embed],
                fetchReply: true,
            });

            const verifyemoji = await verify_msg
                .react(`${emoji}`)
                .catch(async (error) => {
                    if (error.code === 10014) {
                        message =
                            "**You emoji was not valid**\n`You need to provide a valid emoji that is from Dank Exclusive or can be used by the bot`";
                        embed.setColor("Red").setDescription(message);
                        verify_msg.edit({ embeds: [embed] });
                        return false;
                    }
                });

            if (verifyemoji !== false) {
                if (verifyemoji._emoji.id) {
                    emoji = `<a:${verifyemoji._emoji.name}:${verifyemoji._emoji.id}>`;
                } else {
                    emoji = `${verifyemoji._emoji.name}`;
                }
                userData.autoreaction.push(emoji);
                slots_used = slots_used + 1;

                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                message = `**Autoreaction updated successfully**\nEmoji: ${emoji}\nAvaliable Slots: ${
                    slots_max - slots_used
                }`;
                embed.setColor("Green").setDescription(message);
                return verify_msg.edit({ embeds: [embed] });
            }
        } else if (interaction.options.getSubcommand() === "remove") {
            let slots_max = 0;
            let slots_used = userData.autoreaction.length;
            let slots_display;

            let hasroles = [];
            Object.keys(guildData.perkar_roles).forEach((key) => {
                if (interaction.member.roles.cache.find((r) => r.id === key)) {
                    slots_max = slots_max + guildData.perkar_roles[key];
                    hasroles.push(key);
                }
            });

            if (slots_used > slots_max) {
                userData.autoreaction = userData.autoreaction.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                slots_used = userData.autoreaction.length;
            }

            if (slots_used === 0) {
                slots_display = `\`no slots\``;
            } else {
                slots_display = userData.autoreaction
                    .map((emoji) => {
                        const slot_location =
                            userData.autoreaction.indexOf(emoji) + 1;
                        return `Slot ${slot_location}: ${emoji}`;
                    })
                    .join("\n");
            }

            if (guildData.perkar_roles) {
                hasroles_display = Object.keys(guildData.perkar_roles)
                    .map((key) => {
                        let status = "<a:ravena_uncheck:1002983318565965885>";

                        if (
                            interaction.member.roles.cache.find(
                                (r) => r.id === key
                            )
                        ) {
                            status = "<a:ravena_check:1002981211708325950>";
                        }
                        return `${status}<@&${key}>\`+ ${guildData.perkar_roles[key]}\``;
                    })
                    .join("\n");
            } else {
                hasroles_display = `\`server has no perk autoreaction roles\``;
            }

            const sub_embed = new EmbedBuilder().setDescription(
                `\`\`\`fix\nClick and choose which slots you want to remove\`\`\``
            );
            let show_embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Perk Autoreactions")
                .setDescription(
                    `\`You have 15 seconds of idle time before timeout\`\n**Max Slots:** \`${slots_max.toLocaleString()}\`\n**Avaliable Slots:** \`${
                        slots_max - slots_used
                    }\``
                )
                .addFields({
                    name: "Your Slots ↭",
                    value: `${slots_display}`,
                    inline: true,
                });

            let emojislots = [];

            if (userData.autoreaction.length <= 0) {
                sub_embed.setDescription(
                    `\`\`\`diff\n- You have no autoreactions\n+ /boosterar add\n# /perkar show\`\`\``
                );
            }

            const slots_buttons = [];
            const row = new ActionRowBuilder();

            for (let i = 0; i < userData.autoreaction.length; i++) {
                slots_buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`${i}`)
                        .setLabel(`Slot ${i + 1}`)
                        .setEmoji(`${userData.autoreaction[i]}`)
                        .setStyle(ButtonStyle.Primary)
                );
            }
            row.setComponents(slots_buttons);

            emojislots = emojislots
                .map((slot) => {
                    return slot;
                })
                .join("\n");

            if (slots_buttons.length <= 0) {
                return interaction.reply({
                    embeds: [show_embed, sub_embed],
                });
            }

            interaction.reply({
                embeds: [show_embed, sub_embed],
                components: [row],
            });

            const remove_msg = await interaction.fetchReply();
            const collector = remove_msg.createMessageComponentCollector({
                idle: 15 * 1000,
            });

            let clicked_embed = new EmbedBuilder();
            collector.on("collect", async (button) => {
                if (button.user.id !== interaction.user.id) {
                    return button.reply({
                        content: `Not for you to touch`,
                        ephemeral: true,
                    });
                }
                button.deferUpdate();
                if (button) {
                    const slotloaction = parseInt(button.customId);
                    const row = ActionRowBuilder.from(remove_msg.components[0]);
                    row.components.forEach((c) => {
                        c.setDisabled().setStyle(ButtonStyle.Secondary);
                    });
                    userData.autoreaction.pull(
                        userData.autoreaction[slotloaction]
                    );
                    await UserModel.findOneAndUpdate(
                        { userid: interaction.user.id },
                        userData
                    );

                    userData = await user_fetch(interaction.user.id);
                    slots_used = userData.autoreaction.length;
                    slots_display = null;

                    if (slots_used === 0) {
                        slots_display = `\`no slots\``;
                    } else {
                        slots_display = userData.autoreaction
                            .map((emoji) => {
                                const slot_location =
                                    userData.autoreaction.indexOf(emoji) + 1;
                                return `Slot ${slot_location}: ${emoji}`;
                            })
                            .join("\n");
                    }

                    sub_embed.setDescription(
                        `\`\`\`fix\nAutoreaction removed successfully\`\`\``
                    );
                    show_embed = new EmbedBuilder()
                        .setColor("Random")
                        .setTitle("Perk Autoreactions")
                        .setDescription(
                            `\n**Max Slots:** \`${slots_max.toLocaleString()}\`\n**Avaliable Slots:** \`${
                                slots_max - slots_used
                            }\``
                        )
                        .addFields({
                            name: "Your Slots ↭",
                            value: `${slots_display}`,
                            inline: true,
                        });

                    remove_msg.edit({
                        embeds: [show_embed, sub_embed],
                        components: [row],
                    });
                }
            });

            collector.on("end", async (collected) => {
                const row = ActionRowBuilder.from(remove_msg.components[0]);
                row.components.forEach((c) => {
                    c.setDisabled().setStyle(ButtonStyle.Secondary);
                });

                return remove_msg.edit({
                    embeds: [show_embed, sub_embed],
                    components: [row],
                });
            });
        }
    },
};
