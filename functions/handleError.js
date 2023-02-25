const { error_log } = require("../utils/error");

module.exports = (client) => {
    process.on("uncaughtException", (error) => {
        if (error.code === 10008) {
            return;
        }
        console.log(error);
        error_log(client, error);
    });

    process.on("unhandledRejection", (error) => {
        console.log(error);
        error_log(client, error);
    });
};
