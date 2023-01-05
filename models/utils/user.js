const UserModel = require("../models/userSchema");

class Userfunctions {
    static async user_fetch(userId) {
        let userData;
        try {
            userData = await UserModel.findOne({
                userId: userId,
            });
            if (!userData) {
                let userCreate = await UserModel.create({
                    userId: userId,
                });

                userCreate.save();
                userData = userCreate;
            }
            return userData;
        } catch (error) {}
    }
}

module.exports = Userfunctions;
