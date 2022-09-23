const UserModel = require("../models/userSchema");
const { user_fetch } = require("./user");

class Donationfunctions {
    static async dono_fetch(userid) {
        const userData = await user_fetch(userid);
        const userData_donations = userData.donations;

        return userData_donations;
    }
    static async dono_set(userid, donation, amount) {
        const userData = await user_fetch(userid);
        userData.donations[donation] = amount;
        await UserModel.findOneAndUpdate({ userid: userid }, userData);
    }
    static async dono_add(userid, donation, amount) {
        const userData = await user_fetch(userid);
        if (!userData.donations[donation]) {
            userData.donations[donation] = amount;
        } else {
            userData.donations[donation] += amount;
        }
        await UserModel.findOneAndUpdate({ userid: userid }, userData);
    }
    static async dono_remove(userid, donation, amount) {
        const userData = await user_fetch(userid);
        if (!userData.donations[donation]) {
            userData.donations[donation] = -amount;
        } else {
            userData.donations[donation] -= amount;
        }
        await UserModel.findOneAndUpdate({ userid: userid }, userData);
    }
}

module.exports = Donationfunctions;
