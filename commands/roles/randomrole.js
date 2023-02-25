const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

// const { guild_checkperm_mod } = require("../../utils/guild");
// const { error_reply } = require("../../utils/error");
// const { reference_letternumber } = require("../../utils/reference");

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

        // const member_fetch = await interaction.guild.members.fetch();
        // const member_fetch_filterhumans = member_fetch.filter(
        //     (member) => !member.user.bot
        // );
        // const users_hasrole = member_fetch_filterhumans.filter((member) =>
        //     member.roles.cache.find((r) => r.id === options.role.id)
        // ).size;
        // let users_blacklisted = 0;

        // if (options.blacklist) {
        //     if (options.role.id === options.blacklist.id) {
        //         error_message = `Action role can't be the same as blacklist role!`;
        //         return error_reply(interaction, error_message);
        //     }

        //     users_blacklisted = member_fetch_filterhumans.filter((member) =>
        //         member.roles.cache.find((r) => r.id === options.blacklist.id)
        //     ).size;
        // }

        // const users_addallowed =
        //     member_fetch_filterhumans.size - users_blacklisted - users_hasrole;
        // if (options.quantity > users_addallowed) {
        //     error_message = `You can't give that role to that many users!\n\nServer Humans: \`${member_fetch_filterhumans.size.toLocaleString()}\`\n${
        //         options.blacklist
        //             ? `Blacklisted role: ${
        //                   options.blacklist
        //               } (${users_blacklisted.toLocaleString()})\n`
        //             : ""
        //     }Role: ${
        //         options.role
        //     } (${users_hasrole.toLocaleString()})\nAvaliable: \`${users_addallowed.toLocaleString()}\``;
        //     return error_reply(interaction, error_message);
        // }

        // const randomrole_message = await interaction.reply({
        //     embeds: [
        //         new EmbedBuilder().setDescription(
        //             `**Assign Random Role: IN PROCCESS**\n*Selecting random users to add role to...*`
        //         ),
        //     ],
        //     fetchReply: true,
        // });

        // const users_selected = [];
        // for (let i = 0; i < options.quantity; i++) {
        //     if (options.blacklist) {
        //         users_selected.push(
        //             member_fetch_filterhumans
        //                 .filter(
        //                     (member) =>
        //                         !member.user.bot &&
        //                         !member.roles.cache.find(
        //                             (r) => r.id === options.role.id
        //                         ) &&
        //                         !member.roles.cache.find(
        //                             (r) => r.id === options.blacklist.id
        //                         )
        //                 )
        //                 .random()
        //         );
        //     } else {
        //         users_selected.push(
        //             member_fetch_filterhumans
        //                 .filter(
        //                     (member) =>
        //                         !member.user.bot &&
        //                         !member.roles.cache.find(
        //                             (r) => r.id === options.role.id
        //                         )
        //                 )
        //                 .random()
        //         );
        //     }
        // }

        // randomrole_message.edit({
        //     embeds: [
        //         new EmbedBuilder().setDescription(
        //             `**Assign Random Role: IN PROCCESS**\n*Adding role to selected users...*\n\nRole: ${
        //                 options.role
        //             }\n${
        //                 options.blacklist
        //                     ? `\nBlacklist Role: ${options.blacklist}`
        //                     : ""
        //             }Proccess: \`0/${users_selected.length.toLocaleString()}\``
        //         ),
        //     ],
        // });

        // let users_added = 0;
        // for (const user of users_selected) {
        //     const user_addrole = await user.roles
        //         .add(options.role)
        //         .catch((error) => {
        //             randomrole_message.edit({
        //                 embeds: [
        //                     new EmbedBuilder().setDescription(
        //                         `**Assign Random Role: FAILED**\n*An error occured...*\n\nRole: ${
        //                             options.role
        //                         }\n${
        //                             options.blacklist
        //                                 ? `\nBlacklist Role: ${options.blacklist}`
        //                                 : ""
        //                         }Proccess: \`${users_added.toLocaleString()}/${users_selected.length.toLocaleString()}\``
        //                     ),
        //                 ],
        //             });

        //             return false;
        //         });

        //     if (user_addrole === false) {
        //         return;
        //     }

        //     users_added += 1;
        //     randomrole_message.edit({
        //         embeds: [
        //             new EmbedBuilder().setDescription(
        //                 `**Assign Random Role: IN PROCCESS**\n*Adding role to selected users...*\n\nRole: ${
        //                     options.role
        //                 }\n${
        //                     options.blacklist
        //                         ? `\nBlacklist Role: ${options.blacklist}`
        //                         : ""
        //                 }Proccess: \`${users_added.toLocaleString()}/${users_selected.length.toLocaleString()}\``
        //             ),
        //         ],
        //     });
        // }

        // if (users_added === users_selected.length) {
        //     randomrole_message.edit({
        //         embeds: [
        //             new EmbedBuilder().setDescription(
        //                 `**Assign Random Role: SUCCESS**\n*Finished adding the role to selected users.*\n\nRole: ${
        //                     options.role
        //                 }\n${
        //                     options.blacklist
        //                         ? `\nBlacklist Role: ${options.blacklist}`
        //                         : ""
        //                 }Completed: \`${users_added.toLocaleString()}/${users_selected.length.toLocaleString()}\``
        //             ),
        //         ],
        //     });
        // }
    },
};
