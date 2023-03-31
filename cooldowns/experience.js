const cooldowns = new Map();

module.exports = {
    setCooldown: function (userId, command, timeInSeconds) {
        const key = `${userId}-${command}`;
        if (cooldowns.has(key)) {
            const expirationTime = cooldowns.get(key) + timeInSeconds * 1000;
            const timeLeft = (expirationTime - Date.now()) / 1000;
            return timeLeft;
        } else {
            cooldowns.set(key, Date.now());
            return null;
        }
    },
    checkCooldown: function (userId, command, timeInSeconds) {
        const key = `${userId}-${command}`;
        if (cooldowns.has(key)) {
            const expirationTime = cooldowns.get(key) + timeInSeconds * 1000;
            const timeLeft = (expirationTime - Date.now()) / 1000;
            if (timeLeft > 0) {
                return timeLeft;
            } else {
                cooldowns.set(key, Date.now());
                return null;
            }
        } else {
            cooldowns.set(key, Date.now());
            return null;
        }
    },
};
