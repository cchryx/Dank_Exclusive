const { EmbedBuilder, ButtonBuilder } = require("@discordjs/builders");
const { ActionRowBuilder, ButtonStyle } = require("discord.js");
const UserModel = require("../models/userSchema");

const { guild_fetch } = require("./guild");
const { user_fetch } = require("./user");

class Autofunctions {
    static async auto_donation_prompt(message) {
        if (
            message.author.id === "270904126974590976" &&
            message.channel.id === "1058865697196871720" &&
            message.embeds[0].description === "Successfully donated!"
        ) {
            const message_ref = message.channel.messages.cache.get(
                message.reference.messageId
            );
            const donation_userId = message_ref.interaction.user.id;
            if (message_ref.embeds[0].data.description.includes(`⏣`)) {
                let donation_amount =
                    message_ref.embeds[0].data.description.match(
                        /[0-9]+(\.[0-9][0-9]?)?/gm
                    );

                donation_amount = Number(
                    donation_amount
                        .map((num) => {
                            return num;
                        })
                        .join("")
                );

                message.channel.send({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `**Add donation: PENDING**\n*Auto donation prompt. Only serverevent moderators can interact.*\n\nUser: <@${donation_userId}>\nAmount \`⏣ ${donation_amount.toLocaleString()}\``
                        ),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId(`${donation_userId}`)
                                .setLabel(`${donation_userId}`)
                                .setDisabled(),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId(`${donation_amount}`)
                                .setLabel(`${donation_amount}`)
                                .setDisabled()
                        ),
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId("donation_add")
                                .setLabel("Add Donation")
                        ),
                    ],
                });
            }
        }
    }

    static async auto_log(interaction, data) {
        const guildData = await guild_fetch(interaction.guildId);

        if (guildData.miscData.channels.log) {
            interaction.guild.channels.cache
                .get(guildData.miscData.channels.log)
                .send(data);
        }
    }
}

module.exports = Autofunctions;
