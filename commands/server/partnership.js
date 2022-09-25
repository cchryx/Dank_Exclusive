const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const TimerModel = require("../../models/timerSchema");
const GuildModel = require("../../models/guildSchema");
const { guild_checkperm_mod } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("partnership")
        .setDescription("Partnership related commands")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("log")
                .setDescription("Ping and start an event")
                .addStringOption((oi) => {
                    return oi
                        .setName("serverinvite")
                        .setDescription("Partnership server invite (infinite)")
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("serverid")
                        .setDescription("Partnership server id")
                        .setRequired(true);
                })
                .addUserOption((oi) => {
                    return oi
                        .setName("user")
                        .setDescription(
                            "User that will help with claiming our side of the partnership"
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("ouroffer")
                        .setDescription(
                            "Our partnership offer (include total reach and other details like if there is top channel or not)"
                        )
                        .setRequired(true);
                })
                .addStringOption((oi) => {
                    return oi
                        .setName("partneroffer")
                        .setDescription(
                            "Their partnership offer (include total reach and other details like if there is top channel or not)"
                        )
                        .setRequired(true);
                })
        ),
    cooldown: 10,
    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === "log") {
            if (
                !interaction.member.roles.cache.has("920839776322609183") ===
                true
            ) {
                error_message = `\`You don't have the required permissions to preform this action\``;
                return error_reply(interaction, error_message);
            }

            const options = {
                serverinvite: interaction.options.getString("serverinvite"),
                serverid: interaction.options.getString("serverid"),
                user: interaction.options.getUser("user"),
                ouroffer: interaction.options.getString("ouroffer"),
                partneroffer: interaction.options.getString("partneroffer"),
            };

            const partnershiplog_msg = client.channels.cache
                .get("961728822208778260")
                .send({
                    content: `**Server Invite:** ${options.serverinvite}`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#FAFFFC")
                            .setDescription(
                                `**Server Id:** \`${options.serverid}\`\n**Their Partnership Manager:** ${options.user}\n\n__**Offers:**__\nOur Offer: \`${options.ouroffer}\`\nTheir Offer: \`${options.partneroffer}\`\n\nRemove respective reaction if offer is used up:\n:regional_indicator_o: - US\n:regional_indicator_t: - THEM`
                            ),
                    ],
                });

            partnershiplog_msg;

            interaction.reply({
                content:
                    "<a:ravena_check:1002981211708325950> Successfully logged to <#961728822208778260>",
                ephemeral: true,
            });
        }
    },
};
