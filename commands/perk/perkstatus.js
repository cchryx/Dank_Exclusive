const { SlashCommandBuilder } = require("@discordjs/builders");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelType,
    PermissionsBitField,
} = require("discord.js");

const UserModel = require("../../models/userSchema");

const { user_fetch } = require("../../utils/user");
const { guild_fetch } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perkstatus")
        .setDescription(
            "Perk command: show perk status of a user in the server."
        )
        .addUserOption((oi) => {
            return oi
                .setName("user")
                .setDescription("Valid user within the server")
                .setRequired(true);
        }),
    async execute(interaction, client) {
        const options = {
            user: interaction.options.getMember("user"),
        };
        const guildData = await guild_fetch(interaction.guildId);
        let userData = await user_fetch(options.user.id);
        let error_message;

        if (!options.user) {
            error_message = `Not a user in this server`;
            return error_reply(interaction, error_message);
        }

        let ar_slots_max = 0;
        let ar_slots_used = userData.autoreaction.length;
        Object.keys(guildData.perkar_roles).forEach((key) => {
            if (interaction.member.roles.cache.find((r) => r.id === key)) {
                ar_slots_max = ar_slots_max + guildData.perkar_roles[key];
            }
        });

        let role_slots_max = 0;
        let role_slots_used = userData.customrole.users.length;
        Object.keys(guildData.perkrole_roles).forEach((key) => {
            if (interaction.member.roles.cache.find((r) => r.id === key)) {
                role_slots_max = role_slots_max + guildData.perkrole_roles[key];
            }
        });

        let channel_slots_max = 0;
        let channel_slots_used = userData.privatechannel.users.length;
        Object.keys(guildData.perkchannel_roles).forEach((key) => {
            if (interaction.member.roles.cache.find((r) => r.id === key)) {
                channel_slots_max =
                    channel_slots_max + guildData.perkchannel_roles[key];
            }
        });

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: `${options.user.user.tag}`,
                        iconURL: options.user.displayAvatarURL(),
                    })
                    .setDescription(
                        `**Perkstats**\n\nPerkar: \`${ar_slots_used}/${ar_slots_max}\`\nPerkrole: \`${role_slots_used}/${role_slots_max}\`\nPerkchannel: \`${channel_slots_used}/${channel_slots_max}\``
                    ),
            ],
        });
    },
};
