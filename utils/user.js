const UserModel = require("../models/userSchema");

class Userfunctions {
    static async user_fetch(userid) {
        let userData;
        try {
            userData = await UserModel.findOne({
                userid: userid,
            });
            if (!userData) {
                let user = await UserModel.create({
                    userid: userid,
                });

                user.save();

                userData = user;
            }

            return userData;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = Userfunctions;
