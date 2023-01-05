const { EmbedBuilder } = require("discord.js");

class Informationfunctions {
    static async vote_perks(interaction) {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: `Dank Exclusive's Perks`,
                        iconURL: interaction.guild.iconURL(),
                    })
                    .setThumbnail(
                        `https://images-ext-1.discordapp.net/external/zLueXZKz-HvmhRYnXdkjo0CXBvnRsV2miTCiaJnFM3s/%3Fsize%3D160%26quality%3Dlossless/https/cdn.discordapp.com/emojis/927604085203550209.webp`
                    )
                    .setURL(`https://top.gg/servers/902334382939963402/vote`)
                    .setTitle(`Voter Perks (Click me to vote)`)
                    .setDescription(
                        `<a:blue_arrow:955333342801322004> <@&922663821208879125> role for 12 hours\n<a:blue_arrow:955333342801322004> External emote perms\n<a:blue_arrow:955333342801322004> Participate in Voter-Only gaws\n<a:blue_arrow:955333342801322004> Access to these channels with 2x multi\n<#922947565262098454>\n<#952734789264367646>`
                    )
                    .setFooter({
                        iconURL: `https://media.discordapp.net/attachments/909650135594729502/1005197758740824064/806710163032899604.gif`,
                        text: `Voter perks will be expired after 12 hours. Be sure to re-vote us!`,
                    }),
            ],
            ephemeral: true,
        });
    }
}

module.exports = Informationfunctions;
