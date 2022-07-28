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
        .setName("boosterar")
        .setDescription("booster command: add/edit your autoreaction")
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
            let maxslots = 1;
            let slotsused = 0;
            let emojislots = [];
            if (
                !interaction.member.roles.cache.find(
                    (r) => r.id === guildData.boostroles[0]
                )
            ) {
                message = `To use this command you need the role: <@&${guildData.boostroles[0]}>`;
                return error_reply(interaction, message);
            }

            if (
                interaction.member.roles.cache.find(
                    (r) => r.id === guildData.boostroles[1]
                )
            ) {
                maxslots = 2;
            }

            if (userData.autoreaction.length <= 0) {
                const show_embed = new EmbedBuilder()
                    .setColor("Random")
                    .setTitle("Here are your current autoreactions")
                    .setDescription(
                        `**Max Slots:** \`${maxslots.toLocaleString()}\`\n**Avaliable Slots:** \`${
                            maxslots - userData.autoreaction.length
                        }\`\n\n\`\`\`diff\n- You have no autoreactions\n+ /boosterar add\`\`\``
                    );

                return interaction.reply({ embeds: [show_embed] });
            }

            for (let i = 0; i < userData.autoreaction.length; i++) {
                emojislots.push(`Slot ${i + 1}: ${userData.autoreaction[i]}`);
            }

            emojislots = emojislots
                .map((slot) => {
                    return slot;
                })
                .join("\n");

            const show_embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Here are your current autoreactions")
                .setDescription(
                    `**Max Slots:** \`${maxslots.toLocaleString()}\`\n**Avaliable Slots:** \`${
                        maxslots - userData.autoreaction.length
                    }\`\n${emojislots}\n\`\`\`diff\n+ /boosterar add\n- /boosterar remove\`\`\``
                );
            interaction.reply({ embeds: [show_embed] });
        } else if (interaction.options.getSubcommand() === "add") {
            const options = {
                emoji: interaction.options.getString("emoji"),
            };
            let message;

            const oldar = userData.autoreaction;
            let emoji = options.emoji;

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

            if (userData.autoreaction.includes(`${options.emoji}`)) {
                message = `**That emoji already exits in one of your autoreaction slots**\nEmoji: ${options.emoji}`;
                embed.setColor("Red").setDescription(message);
                return verify_msg.edit({ embeds: [embed] });
            }

            if (
                userData.autoreaction.length >= 1 &&
                !interaction.member.roles.cache.find(
                    (r) => r.id === guildData.boostroles[1]
                )
            ) {
                userData.autoreaction.pull(userData.autoreaction[1]);
                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                message = `**You have reached the max amount of autoreaction slots for your level of boosting**\nYou need <@&${guildData.boostroles[1]}> to increase you max slots to 2`;
                embed.setColor("Red").setDescription(message);
                return verify_msg.edit({ embeds: [embed] });
            } else if (userData.autoreaction.length >= 2) {
                message = `**You have reached the max amount of autoreaction slots**\nYou cannot increase this by any means, the max is 2`;
                embed.setColor("Red").setDescription(message);
                return verify_msg.edit({ embeds: [embed] });
            }

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
                userData.autoreaction.push(emoji);

                await UserModel.findOneAndUpdate(
                    { userid: interaction.user.id },
                    userData
                );
                message = `**Autoreaction updated successfully**\nEmoji: ${emoji}\nAvaliable Slots: ${
                    2 - userData.autoreaction.length
                }`;
                embed.setColor("Green").setDescription(message);
                return verify_msg.edit({ embeds: [embed] });
            }
        } else if (interaction.options.getSubcommand() === "remove") {
            let maxslots = 1;
            let emojislots = [];
            if (
                !interaction.member.roles.cache.find(
                    (r) => r.id === guildData.boostroles[0]
                )
            ) {
                message = `To use this command you need the role: <@&${guildData.boostroles[0]}>`;
                return error_reply(interaction, message);
            }

            if (
                interaction.member.roles.cache.find(
                    (r) => r.id === guildData.boostroles[1]
                )
            ) {
                maxslots = 2;
            }

            if (userData.autoreaction.length <= 0) {
                const show_embed = new EmbedBuilder()
                    .setColor("Random")
                    .setTitle("Remove autoreaction")
                    .setDescription(
                        `**Max Slots:** \`${maxslots.toLocaleString()}\`\n**Avaliable Slots:** \`${
                            maxslots - userData.autoreaction.length
                        }\`\n\n\`\`\`diff\n- You have no autoreactions\n+ /boosterar add\`\`\``
                    );

                return interaction.reply({
                    embeds: [show_embed],
                });
            }

            const slotsbuttons = [];
            const row = new ActionRowBuilder();

            for (let i = 0; i < userData.autoreaction.length; i++) {
                emojislots.push(`Slot ${i + 1}: ${userData.autoreaction[i]}`);
                slotsbuttons.push(
                    new ButtonBuilder()
                        .setCustomId(`${i}`)
                        .setLabel(`Slot ${i + 1}`)
                        .setEmoji(`${userData.autoreaction[i]}`)
                        .setStyle(ButtonStyle.Primary)
                );
            }
            row.setComponents(slotsbuttons);

            emojislots = emojislots
                .map((slot) => {
                    return slot;
                })
                .join("\n");

            let show_embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Remove autoreaction")
                .setDescription(
                    `\`You have 15 seconds of idle time before timeout\`\n**Max Slots:** \`${maxslots.toLocaleString()}\`\n**Avaliable Slots:** \`${
                        maxslots - userData.autoreaction.length
                    }\`\n${emojislots}\n\`\`\`fix\nClick and choose which slots you want to remove\`\`\``
                );

            interaction.reply({
                embeds: [show_embed],
                components: [row],
            });
            const remove_msg = await interaction.fetchReply();
            const collector = remove_msg.createMessageComponentCollector({
                idle: 15 * 1000,
            });

            collector.on("collect", async (button) => {
                if (button.user.id !== interaction.user.id) {
                    return button.reply({
                        content: `Not for you to touch`,
                        ephemeral: true,
                    });
                }
                button.deferUpdate();
                if (button) {
                    userData = await user_fetch(interaction.user.id);
                    emojislots = [];
                    usedslots = userData.autoreaction.length;
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

                    for (let i = 0; i < userData.autoreaction.length; i++) {
                        emojislots.push(
                            `Slot ${i + 1}: ${userData.autoreaction[i]}`
                        );
                    }

                    emojislots = emojislots
                        .map((slot) => {
                            return slot;
                        })
                        .join("\n");

                    show_embed = new EmbedBuilder()
                        .setColor("Random")
                        .setTitle("Remove autoreaction")
                        .setDescription(
                            `\`You have 15 seconds of idle time before timeout\`\n**Max Slots:** \`${maxslots.toLocaleString()}\`\n**Avaliable Slots:** \`${
                                maxslots - userData.autoreaction.length
                            }\`\n${emojislots}\n\`\`\`fix\nClick and choose which slots you want to remove\`\`\``
                        );

                    remove_msg.edit({
                        embeds: [show_embed],
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
                    embeds: [show_embed],
                    components: [row],
                });
            });
        }
    },
};
