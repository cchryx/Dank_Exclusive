const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rolesmenu")
        .setDescription("Quick and easy self role menu.")
        .addSubcommand((subcommand) =>
            subcommand.setName("main").setDescription("Main ping roles.")
        ),
    cooldown: 10,
    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === "main") {
            const roles_embed = new EmbedBuilder()
                .setFooter({
                    text: "Click buttons to get your self role",
                })
                .setDescription(
                    `**Main Ping Roles**\n*Here lies a self role menu.*\n\`╔⏤⏤⏤⏤⏤⏤⏤╝❀╚⏤⏤⏤⏤⏤⏤⏤╗\``
                );

            interaction.reply({
                content: `Successfully posted self roles`,
                ephemeral: true,
            });

            interaction.channel.send({
                embeds: [roles_embed],
                components: [
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Giveaway`)
                            .setCustomId(`902412470365347870`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Announcement`)
                            .setCustomId(`902412143960416308`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Massive Giveaway`)
                            .setCustomId(`902635820014505987`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Heist`)
                            .setCustomId(`902636766786371634`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Minigame`)
                            .setCustomId(`902413856104648754`)
                    ),
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Bro Bot`)
                            .setCustomId(`928366279109279806`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Nitro Giveaway`)
                            .setCustomId(`932718201723306084`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Rumble`)
                            .setCustomId(`954577139208957983`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Mafia`)
                            .setCustomId(`1017619948232785964`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Xenon`)
                            .setCustomId(`1010047390939619348`)
                    ),
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`Partnership`)
                            .setCustomId(`957102579165315072`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(`No Partnership`)
                            .setCustomId(`920490576904851457`)
                    ),
                ],
            });
        }
    },
};
