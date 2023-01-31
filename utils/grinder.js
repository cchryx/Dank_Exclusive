const { EmbedBuilder } = require("discord.js");

const GrinderModel = require("../models/grinderSchema");

class GrinderFunctions {
    static async grinders_map() {
        let grinderDatas = await GrinderModel.find();
        grinderDatas = grinderDatas.sort((a, b) => {
            const nextPayment_a = a.initialDate + a.payments * 86400000;
            const nextPayment_b = b.initialDate + b.payments * 86400000;
            return nextPayment_a - nextPayment_b;
        });

        const embedTheshold = 25;
        const embedsNeeded = grinderDatas.length / embedTheshold;
        const embedsData = [];

        if (grinderDatas.length === 0) {
            embedsData.push(
                new EmbedBuilder()
                    .setTitle(`Grinders Notice Board`)
                    .setDescription("`No grinders.`")
            );
        } else {
            for (let i = 0; i < embedsNeeded; i++) {
                const grindersChunck = grinderDatas.slice(
                    embedTheshold * i,
                    embedTheshold * (i + 1)
                );

                const grinderDatas_map = grindersChunck
                    .map((grinderData) => {
                        const paymentDue =
                            grinderData.initialDate +
                            grinderData.payments * 86400000;
                        const timeLeft = paymentDue - Date.now();
                        let symbol;

                        if (timeLeft > 259200000) {
                            symbol = "<:warning_none:1070054131127025805>";
                        } else if (
                            timeLeft <= 259200000 &&
                            timeLeft > 86400000
                        ) {
                            symbol = "<:warning_time:1070054477584928798>";
                        } else {
                            symbol = "<:warning_servre:1070054714470834186>";
                        }

                        if (timeLeft <= 0) {
                            symbol = "<a:warning_flag:1070074604913168434>";
                        }

                        return `> ${symbol} <@${
                            grinderData.userId
                        }> - Next Payment: <t:${Math.floor(
                            paymentDue / 1000
                        )}:D> <t:${Math.floor(paymentDue / 1000)}:R>`;
                    })
                    .join("\n");

                const embedData = new EmbedBuilder().setDescription(
                    grinderDatas_map
                );

                if (i === 0) {
                    embedData.setTitle(`Grinders Notice Board`);
                }

                embedsData.push(embedData);
            }
        }

        return embedsData;
    }
}

module.exports = GrinderFunctions;
