const {
    InteractionType,
    Collection,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const humanizeDuration = require("humanize-duration");

const GiveawayModel = require("../models/givewaySchema");

const { discord_self_role } = require("../utils/discord");
const { error_reply } = require("../utils/error");
const {
    giveaway_check_fulfill,
    giveaway_fetch,
    giveaway_join,
    giveaway_leave,
    giveaway_end,
    giveaway_reroll,
} = require("../utils/giveaway");
const { guild_fetch } = require("../utils/guild");
const { vote_perks } = require("../utils/information");
const { user_fetch } = require("../utils/user");

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
    name: "interactionCreate",
    async execute(interaction, client) {
        const guildData = await guild_fetch(interaction.guildId);
        const userData = await user_fetch(interaction.user.id);

        let error_message;
        if (interaction.type === InteractionType.ApplicationCommand) {
            if (interaction.guildId !== "902334382939963402") {
                return interaction.reply({
                    content: "This server has no permission to use this bot.",
                    ephemeral: true,
                });
            }
            const commandname = interaction.commandName;
            const command = client.commands.get(commandname);

            if (!command) return;

            const userId = interaction.user.id;
            const userData = user_fetch(userId);

            try {
                await command.execute(interaction, client, userData);
            } catch (error) {
                console.error(error);
                error_message =
                    "An error occured when executing this application command!";
                error_reply(interaction, error_message);
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === "giveaway_join") {
                const giveawayData = await giveaway_fetch(
                    interaction,
                    interaction.message.id
                );
                if (giveawayData.status === false) {
                    return;
                }
                const checkFufill = await giveaway_check_fulfill(
                    interaction,
                    giveawayData.data,
                    userData,
                    guildData
                );
                if (checkFufill === false) {
                    return;
                }

                await giveaway_join(interaction, giveawayData.data, guildData);
            } else if (interaction.customId === "giveaway_leave") {
                const giveawayData = await giveaway_fetch(
                    interaction,
                    interaction.message.reference.messageId
                );
                if (giveawayData.status === false) {
                    return;
                }

                return await giveaway_leave(
                    interaction,
                    giveawayData.data,
                    guildData
                );
            } else if (interaction.customId === "giveaway_end") {
                const giveawayData = await giveaway_fetch(
                    interaction,
                    interaction.message.id
                );
                if (giveawayData.status === false) {
                    return;
                }

                if (giveawayData.data.hostId !== interaction.user.id) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You are not the host of this giveaway, therefore you cannot end it manually.\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                await giveaway_end(client, giveawayData.data, guildData);

                interaction.reply({
                    content: "`Successfully ended that giveaway.`",
                    ephemeral: true,
                });
            } else if (interaction.customId === "giveaway_reroll") {
                const giveawayData = await GiveawayModel.findOne({
                    messageid: interaction.message.id,
                });

                if (giveawayData.hostId !== interaction.user.id) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `\`You are not the host of this giveaway, therefore you cannot reroll winners.\``
                                )
                                .setColor("#ffc182"),
                        ],

                        ephemeral: true,
                    });
                }

                return await giveaway_reroll(
                    client,
                    interaction,
                    giveawayData,
                    guildData
                );
            } else if (interaction.customId === "vote_perks") {
                return await vote_perks(interaction);
            }

            if (
                interaction.guild.roles.cache.find(
                    (r) => r.id === interaction.customId
                )
            ) {
                return await discord_self_role(interaction);
            }
        }
    },
};
