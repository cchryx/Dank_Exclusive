const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("boosterar")
        .setDescription("booster command: add/edit your autoreaction")
        .addStringOption((oi) => {
            return oi
                .setName("emoji")
                .setDescription("A valid role that exists in this server")
                .setRequired(true);
        }),
    async execute(interaction, client) {
        const options = {
            emoji: interaction.options.getString("emoji"),
        };
        let message;
        const guildData = await guild_fetch(interaction.guildId);
        const userData = await user_fetch(interaction.user.id);
        const oldar = userData.autoreaction;
        let emoji = options.emoji;
        userData.autoreaction = emoji;

        if (
            !interaction.member.roles.cache.find(
                (r) => r.id === guildData.boostroles[0]
            )
        ) {
            message = `To use this command you need the role: <@&${guildData.boostroles[0]}>`;
            return error_reply(interaction, message);
        }

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setDescription("Checking if your emoji is valid...");

        const verify_msg = await interaction.reply({
            embeds: [embed],
            fetchReply: true,
        });

        if (
            options.emoji === "null" ||
            options.emoji === "none" ||
            options.emoji === "false" ||
            options.emoji === "0"
        ) {
            if (!oldar) {
                message = "Your autoreaction was already set as `null`";
                embed.setColor("Red").setDescription(message);
                return verify_msg.edit({ embeds: [embed] });
            } else {
                userData.autoreaction = null;
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );

                message = `**Autoreaction updated successfully**\nEmoji: ${
                    oldar
                        ? `${oldar} <a:arrow_right:1002233308219965491> \`null\``
                        : `\`null\``
                }`;
                embed.setColor("Green").setDescription(message);
                return verify_msg.edit({ embeds: [embed] });
            }
        }

        // const validemoji = options.emoji?.match(/<:.+?:\d+>/g);
        // if (!validemoji) {
        //     message = `\`You need to provide a valid emoji that is from Dank Exclusive or can be used by the bot\``;
        //     return error_reply(interaction, message);
        // }

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
            await UserModel.findOneAndUpdate(
                { userid: interaction.user.id },
                userData
            );
            message = `**Autoreaction updated successfully**\nEmoji: ${
                oldar
                    ? `${oldar} <a:arrow_right:1002233308219965491> ${emoji}`
                    : `${emoji}`
            }`;
            embed.setColor("Green").setDescription(message);
            return verify_msg.edit({ embeds: [embed] });
        }
    },
};
