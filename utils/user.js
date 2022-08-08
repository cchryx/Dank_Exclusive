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
    static async user_ar(message, mentions, guildData) {
        mentions.forEach(async (mention) => {
            const userid = mention.id;

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
            } catch (error) {
                console.log(error);
            }

            if (!userData.autoreaction) return;

//             if (
//                 guildData.boostroles[0] &&
//                 guildData.boostroles[1] &&
//                 guildData.boostroles[2]
//             ) {
//                 if (
//                     !mention.roles.cache.find(
//                         (r) => r.id === guildData.boostroles[0]
//                     )
//                 ) {
//                     const user = message.guild.members.cache.get(mention.id);
//                     user.roles.remove([
//                         guildData.boostroles[1],
//                         guildData.boostroles[2],
//                     ]);
//                 }
//             }

            let slots_max = 0;
            let slots_used = userData.autoreaction.length;

            Object.keys(guildData.perkar_roles).forEach((key) => {
                if (mention.roles.cache.find((r) => r.id === key)) {
                    slots_max = slots_max + guildData.perkar_roles[key];
                }
            });

            if (slots_max > 2) {
                slots_max = 2;
            }

            if (slots_used > slots_max) {
                userData.autoreaction = userData.autoreaction.slice(
                    0,
                    slots_max
                );
                await UserModel.findOneAndUpdate(
                    { userid: userData.userid },
                    userData
                );
                slots_used = userData.autoreaction.length;
            }

            userData.autoreaction.forEach((emoji) => {
                return message.react(`${emoji}`).catch(async (error) => {
                    if (error.code === 10014) {
                        userData.autoreaction = null;
                        return await UserModel.findOneAndUpdate(
                            { userid: userData.userid },
                            userData
                        );
                    }
                });
            });
        });
    }
}

module.exports = Userfunctions;
