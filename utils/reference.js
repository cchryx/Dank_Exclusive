const { EmbedBuilder } = require("discord.js");

const letternumbers = [
    {
        letter: "h",
        number: 100,
    },
    {
        letter: "k",
        number: 1000,
    },
    {
        letter: "m",
        number: 1000 * 1000,
    },
    {
        letter: "b",
        number: 1000 * 1000 * 1000,
    },
    {
        letter: "t",
        number: 1000 * 1000 * 1000 * 1000,
    },
];

class Referencefunctions {
    static async reference_letternumber(interaction, input) {
        let quantity = input.toLowerCase();

        const errorembed = new EmbedBuilder().setColor("#FF5C5C");

        if (!quantity) {
            errorembed.setDescription(`\`Please specify a valid quantity\``);
            return interaction.reply({
                embeds: [errorembed],
                ephemeral: true,
            });
        } else if (
            letternumbers.find((val) => val.letter === quantity.slice(-1))
        ) {
            if (parseInt(quantity.slice(0, -1))) {
                const number = parseFloat(quantity.slice(0, -1));
                const numbermulti = letternumbers.find(
                    (val) => val.letter === quantity.slice(-1)
                ).number;
                quantity = number * numbermulti;
            } else {
                quantity = null;
            }
        } else {
            quantity = parseInt(quantity);
        }

        quantity = parseInt(quantity);

        if (!quantity || quantity < 0) {
            errorembed.setDescription("`quantity has to be a whole number`");

            return interaction.reply({
                embeds: [errorembed],
                ephemeral: true,
            });
        } else if (quantity === 0) {
            errorembed.setDescription(
                "`If you want to give this to 0 people then don't use this command, bruh`"
            );
            return interaction.reply({
                embeds: [errorembed],
                ephemeral: true,
            });
        }

        return quantity;
    }
}

module.exports = Referencefunctions;
