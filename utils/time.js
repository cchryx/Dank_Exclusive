const { EmbedBuilder } = require("discord.js");
const ms = require("better-ms");
const humanizeDuration = require("humanize-duration");

const { error_reply } = require("./error");

const humantime = humanizeDuration.humanizer({
    language: "shortEn",
    delimiter: " ",
    spacer: "",
    languages: {
        shortEn: {
            y: () => "y",
            mo: () => "mo",
            w: () => "w",
            d: () => "d",
            h: () => "h",
            m: () => "m",
            s: () => "s",
            ms: () => "ms",
        },
    },
});

class Timefunctions {
    static async time_format(interaction, string) {
        let error_message;
        let status = true;
        const timeMilliseconds = ms.getMilliseconds(string);

        if (!timeMilliseconds) {
            error_message = `Couldn't parse \`${string}\`\nExample: \`1d1h12m\`.`;
            status = false;
            error_reply(interaction, error_message);
        }
        if (timeMilliseconds < 1000) {
            error_message = `Minimum timer is \`1s\`.`;
            status = false;
            error_reply(interaction, error_message);
        }

        const endTime = Date.now() + timeMilliseconds;

        return {
            status: status,
            timeMilliseconds: timeMilliseconds,
            endTime: endTime,
            humanTime: humantime(timeMilliseconds),
        };
    }

    static async time_humantime(timeMilliseconds) {
        return humantime(timeMilliseconds);
    }
}

module.exports = Timefunctions;
