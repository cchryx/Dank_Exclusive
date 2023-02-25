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
const { perk_slots_max } = require("../../utils/perk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkar")
        .setDescription("Perk command: show/edit your auto-reaction")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show your current auto reactions.")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Choose an auto-reaction to remove.")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add an auto-reaction")
                .addStringOption((oi) => {
                    return oi
                        .setName("emoji")
                        .setDescription(
                            "A valid emoji that exists in this server (including default emojis)."
                        )
                        .setRequired(true);
                })
        ),
    async execute(interaction, client) {
        let error_message;
        const guildData = await guild_fetch(interaction.guildId);
        const userData = await user_fetch(interaction.user.id);
        const slots_max = await perk_slots_max(
            interaction,
            guildData.perk.autoReaction
        );
        let slots_used = userData.autoReaction.length;
        let slots_used_display;

        if (slots_max.slots_max > 2) {
            slots_max.slots_max = 2;
        }

        if (slots_max.slots_max === 0) {
            userData.autoReaction = [];
            await UserModel.findOneAndUpdate(
                { userId: interaction.user.id },
                userData
            );
            slots_used = userData.autoReaction.length;
        }

        if (slots_used > slots_max.slots_max) {
            userData.autoReaction = userData.autoReaction.slice(
                0,
                slots_max.slots_max
            );
            await UserModel.findOneAndUpdate(
                { userId: interaction.user.id },
                userData
            );
            slots_used = userData.autoReaction.length;
        }

        if (slots_used === 0) {
            slots_used_display = `\`No slots used\``;
        } else {
            slots_used_display = userData.autoReaction
                .map((emoji) => {
                    return `${emoji}`;
                })
                .join(", ");
        }

        if (interaction.options.getSubcommand() === "show") {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Perk: Auto-reactions`)
                        .setDescription(
                            `*Slots is the number of auto-reactions you are permitted to add in accordance to the roles you have.*\n\nSlots Used: \`${slots_used}/${slots_max.slots_max}\``
                        )
                        .setFields(
                            {
                                name: "Perk-autoreaction Roles ↭",
                                value: slots_max.slots_hasroles_display,
                                inline: true,
                            },
                            {
                                name: "Occupied Slots ↭",
                                value: slots_used_display,
                                inline: true,
                            }
                        ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "add") {
            const options = {
                emoji: interaction.options.getString("emoji"),
            };

            if (slots_max.slots_max === 0) {
                error_message = `You have no perk auto-reaction slots!\n\nSlots Status: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\``;
                error_reply(interaction, error_message);
            }

            if (slots_used >= slots_max.slots_max) {
                error_message = `All of your perk auto-reaction slots are occupied, so you can't add anymore!\n\nSlots Status: \`${slots_used.toLocaleString()}/${slots_max.slots_max.toLocaleString()}\``;
                error_reply(interaction, error_message);
            }

            if (userData.autoReaction.includes(`${options.emoji}`)) {
                error_message = `That emoji already exits in one of your autoreaction slots.\n\nEmoji: ${options.emoji}`;
                error_reply(interaction, error_message);
            }

            const perkar_add_message = await interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Checking if the emoji is usable for an auto-reaction...**`
                    ),
                ],
                fetchReply: true,
            });

            const verifyEmoji = await perkar_add_message
                .react(`${options.emoji}`)
                .catch(async (error) => {
                    if (error.code === 10014) {
                        perkar_add_message.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(
                                        `**Your emoji was not valid!**\nYou need to provide a valid emoji that is from Dank Exclusive or can be used by the bot.`
                                    )
                                    .setColor("Red"),
                            ],
                        });
                        return false;
                    }
                });

            if (verifyEmoji === false) {
                return;
            }

            if (verifyEmoji._emoji.id) {
                options.emoji =
                    verifyEmoji._emoji.animated === true
                        ? `<a:${verifyEmoji._emoji.name}:${verifyEmoji._emoji.id}>`
                        : `<:${verifyEmoji._emoji.name}:${verifyEmoji._emoji.id}>`;
            } else {
                options.emoji = `${verifyEmoji._emoji.name}`;
            }
            userData.autoReaction.push(options.emoji);

            await UserModel.findOneAndUpdate(
                { userId: interaction.user.id },
                userData
            );

            return perkar_add_message.edit({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Successfully added auto-reaction!**\n\nEmoji: ${options.emoji}`
                    ),
                ],
            });
        } else if (interaction.options.getSubcommand() === "remove") {
            if (slots_used <= 0) {
                error_message = `None of your slots are occupied.`;
                error_reply(interaction, error_message);
            }
            const row = new ActionRowBuilder();
            const slots_buttons = [];

            for (const autoreaction in userData.autoReaction) {
                slots_buttons.push(
                    new ButtonBuilder()
                        .setCustomId(autoreaction)
                        .setEmoji(`${userData.autoReaction[autoreaction]}`)
                        .setStyle(ButtonStyle.Primary)
                );
            }

            row.setComponents(slots_buttons);
            const perkar_remove_message = await interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(
                        `**Remove auto-reaction:**\n*Choose an auto-reaction using the buttons below to remove.*\n\nAction Timeout: <t:${Math.floor(
                            (Date.now() + 15 * 1000) / 1000
                        )}:R>`
                    ),
                ],
                components: [row],
                fetchReply: true,
            });

            const perkar_remove_collector =
                perkar_remove_message.createMessageComponentCollector({
                    time: 15 * 1000,
                });

            let interaction_ended = false;
            perkar_remove_collector.on("collect", async (button) => {
                if (button.user.id !== interaction.user.id) {
                    error_message = `This is not for you leave it alone.`;
                    error_reply(button, error_message);
                }

                button.deferUpdate();

                const slot_location = parseInt(button.customId);
                const slots_removed_emoji =
                    userData.autoReaction[slot_location];
                const row = ActionRowBuilder.from(
                    perkar_remove_message.components[0]
                );

                row.components.forEach((c) => {
                    c.setDisabled().setStyle(ButtonStyle.Secondary);
                });

                userData.autoReaction.pull(
                    userData.autoReaction[slot_location]
                );
                await UserModel.findOneAndUpdate(
                    { userId: interaction.user.id },
                    userData
                );

                perkar_remove_message.edit({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Remove auto-reaction: SUCCESSFUL**\n*Run this command again to remove auto-reactions.*\n\nAction Expired: <t:${Math.floor(
                                (Date.now() + 15 * 1000) / 1000
                            )}:R>\nRmoved Auto-reaction: ${slots_removed_emoji}`
                        ),
                    ],
                    components: [row],
                });

                interaction_ended = true;
            });

            perkar_remove_collector.on("end", async (collected) => {
                if (interaction_ended === true) {
                    return;
                }

                const row = ActionRowBuilder.from(
                    perkar_remove_message.components[0]
                );
                row.components.forEach((c) => {
                    c.setDisabled().setStyle(ButtonStyle.Secondary);
                });

                return perkar_remove_message.edit({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Remove auto-reaction: ACTION TIMED OUT**\n*Run this command again to remove auto-reactions.*\n\nAction Expired: <t:${Math.floor(
                                (Date.now() + 15 * 1000) / 1000
                            )}:R>`
                        ),
                    ],
                    components: [row],
                });
            });
        }
    },
};
