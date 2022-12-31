
Search
Pulls
Issues
Codespaces
Marketplace
Explore
 
@Neiry6969 
Neiry6969
/
dankexclusive
Private
Code
Issues
Pull requests
Actions
Projects
Security
Insights
Settings
dankexclusive/commands/roles/randomrole.js
@Neiry6969
Neiry6969 Update randomrole.js
Latest commit c3dbe18 last week
 History
 1 contributor
177 lines (164 sloc)  6.86 KB

const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const { guild_checkperm_mod } = require("../../utils/guild");
const { error_reply } = require("../../utils/error");
const { reference_letternumber } = require("../../utils/reference");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("randomrole")
        .setDescription("gives a number of random people a role")
        .addStringOption((oi) => {
            return oi
                .setName("quantity")
                .setDescription(
                    "A constant number: `123`, a short form: `2k`, a keyword: `max or half`"
                )
                .setRequired(true);
        })
        .addRoleOption((oi) => {
            return oi
                .setName("role")
                .setDescription("A valid role that exists in this server")
                .setRequired(true);
        })
        .addRoleOption((oi) => {
            return oi
                .setName("blacklist")
                .setDescription(
                    "A valid role that exists in this server that you want to blacklist"
                );
        }),

    async execute(interaction, client) {
        const options = {
            quantity: interaction.options.getString("quantity"),
            role: interaction.options.getRole("role"),
            blacklist: interaction.options.getRole("blacklist"),
        };
        requiredperms = [
            "ManageChannels",
            "ManageGuild",
            "Administrator",
            "ManageRoles",
        ];
        let message;
        let pass = await guild_checkperm_mod(interaction, requiredperms);

        if (!pass === true) {
            message = `\`You don't have the required permissions to preform this action\``;
            return error_reply(interaction, message);
        }
        const fetchMembers = await interaction.guild.members.fetch();
        const filter_members = fetchMembers.filter(
            (member) => !member.user.bot
        );
        const noofusers = await reference_letternumber(
            interaction,
            options.quantity
        );
        if (noofusers > filter_members.size) {
            message = `\`You can't give the role to more than the amount of members that the server has\n\`This server has \`${filter_members.size.toLocaleString()}\` members`;
            return error_reply(interaction, message);
        }

        const role = options.role;
        const role_blacklisted = options.blacklist;
        if (role_blacklisted) {
            if (role.id === role_blacklisted.id) {
                message = `\`Action role can't be the same as blacklist role\``;
                return error_reply(interaction, message);
            }

            const amount_blacklisted = fetchMembers.filter((member) =>
                member.roles.cache.find((r) => r.id === role_blacklisted.id)
            ).size;
            const amount_has_filter = fetchMembers.filter((member) =>
                member.roles.cache.find((r) => r.id === role.id)
            );

            let amount_has = 0;
            if (amount_has_filter) {
                amount_has = fetchMembers.filter((member) =>
                    member.roles.cache.find((r) => r.id === role.id)
                ).size;
            }

            const avaliableadd =
                filter_members.size - amount_blacklisted - amount_has;
            if (noofusers > avaliableadd) {
                message = `\`Quantity is higher than how many users in the server can give to\`\nThis server has \`${filter_members.size.toLocaleString()}\` members\nBlacklisted role: <@&${
                    role_blacklisted.id
                }> (${amount_blacklisted.toLocaleString()})\nRole: <@&${
                    role.id
                }> (${amount_has.toLocaleString()})\nAvaliable: \`${avaliableadd.toLocaleString()}\``;
                return error_reply(interaction, message);
            }
        }

        already_added = [];
        const embed = new EmbedBuilder()
            .setColor("Random")
            .setDescription(
                `Fetching...\nGetting ready to set <@&${
                    role.id
                }> to \`${noofusers.toLocaleString()}\` random members in the server...`
            );

        const random_message = await interaction.reply({
            embeds: [embed],
            fetchReply: true,
        });

        let users = [];
        for (let i = 0; i < noofusers; i++) {
            let user;
            if (role_blacklisted) {
                user = fetchMembers
                    .filter(
                        (member) =>
                            !member.user.bot &&
                            !member.roles.cache.find((r) => r.id === role.id) &&
                            !member.roles.cache.find(
                                (r) => r.id === role_blacklisted.id
                            )
                    )
                    .random().id;
            } else {
                user = fetchMembers
                    .filter(
                        (member) =>
                            !member.user.bot &&
                            !member.roles.cache.find((r) => r.id === role.id)
                    )
                    .random().id;
            }
            if (users.includes(user)) {
                i = i - 1;
            } else {
                users.push(user);
                const amountdone = i + 1;
                const percentdont = ((amountdone / noofusers) * 100).toFixed(2);
            }
        }

        let count = 0;
        users.forEach((id) => {
            interaction.guild.members.cache.get(id).roles.add(role);
            count = count + 1;
            const percentdont = ((count / noofusers) * 100).toFixed(2);
            const remainderdevided = count % 5;

            if (count === noofusers) {
                embed.setDescription(
                    `**Finished! YAY**\nThis command is avaliable again\n\nRole: <@&${
                        role.id
                    }>\n${
                        role_blacklisted
                            ? `Blacklisted Role: <@&${role_blacklisted.id}>\n`
                            : ``
                    }Amount Done: \`${count.toLocaleString()}/${noofusers.toLocaleString()}\` \`${percentdont}%\``
                );
            } else {
                embed.setDescription(
                    `**Adding roles...**\nPlease hold, don't run command again till finished processing\n\nRole: <@&${
                        role.id
                    }>\n${
                        role_blacklisted
                            ? `Blacklisted Role: <@&${role_blacklisted.id}>\n`
                            : ``
                    }Amount Done: \`${count.toLocaleString()}/${noofusers.toLocaleString()}\` \`${percentdont}%\``
                );
            }
            return random_message.edit({ embeds: [embed] });
        });
    },
};
