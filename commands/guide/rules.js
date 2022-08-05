const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageMentions: { USERS_PATTERN },
} = require("discord.js");

const UserModel = require("../../models/userSchema");
const GuildModel = require("../../models/guildSchema");
const GiveawayModel = require("../../models/giveawaySchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rules")
        .setDescription("Rules for things in the server")
        .addSubcommand((subcommand) =>
            subcommand.setName("mafia").setDescription("Shows the mafia rules")
        ),
    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === "mafia") {
            const mafiarules_embed = new EmbedBuilder()
                .setTitle(`Mafia Rules`)
                .setThumbnail(
                    `https://images-ext-2.discordapp.net/external/2ZMeatAbZ53BKe916eiZdWt9-U5my6K4xkVuM5b4juc/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/511786918783090688/81b4f3c332867a8921df67cebad79759.png?width=390&height=390`
                )
                .setColor("Random")
                .setDescription(
                    `<:de_one:949525455961202698> **If you don't know how to play mafia, don't join** <:Pika_Facepalm:932490000564645888>\n> You can learn with m.game\n\n<:de_two:949525476110630973>  **Don't target donator or host n1.**\n> They're the ones making this event possible.\n\n<:de_three:949525497824546866> **Dead people stay dead:**\n> If you're dead, you cannot communicate with other players in any way. This includes reacting to msgs and dming members.\n\n<:de_four:949525628737179648> **Vigi/ Villagers: Don't kill or shoot n1** <:Pepe_Cringe:909560169808162836>\n> You're supposed to help the village, not kill randomly.\n\n<:de_five:949525535892049980> **Don't Game Throw.**\n> You will be blacklisted from events as well as possible further action\n\n<:de_six:951945666928717915> **Don't be afk, or at least inform the host you need to go afk**\n> Note that AFK = no payouts and possible event blacklist\n\n<:de_seven:954588017920704532> **Don’t screenshot or copy and paste any messages from bot dms.**`
                );

            return interaction.reply({ embeds: [mafiarules_embed] });
        }
    },
};
