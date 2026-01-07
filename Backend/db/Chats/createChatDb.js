const chatSchema = require('../../schemas/chatSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;
const crypto = require('crypto');
const { encryptContent, getPrivateKey } = require('../../cache/authPrivateKeyStorage');
const { getUser } = require('../User/getUserDb');

async function createChat(name, members, type) {
    try {
        if (!Array.isArray(members) || members.length === 0 || !type) {
            return {
                code: StatusCodes.BAD_REQUEST,
                result: 'Invalid request data'
            };
        }
        let aesKeys = [];
        const randomBytes = crypto.randomBytes(32);
        for (let i = 0; i < members.length; i++) {
            const user = await getUser(members[i]);
            if (user.code !== StatusCodes.OK) {
                return {
                    code: user.code,
                    result: user.result
                };
            }
            const publicKey = user.result.publicKey;
            if (!publicKey) {
                return {
                    code: StatusCodes.UNPROCESSABLE_ENTITY,
                    result: 'User does not have a public key'
                };
            }
            const encryptedKey = encryptContent(randomBytes, publicKey);
            if (!encryptedKey) {
                return {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    result: 'Failed to encrypt key for user'
                };
            }
            aesKeys.push(JSON.stringify({
                memberId: members[i],
                key: encryptedKey
            }));
        }
        const chat = new chatSchema({
            name: name,
            members: members,
            type: type,
            aesKeys: aesKeys,
        });

        const savedChat = await chat.save();

        return {
            code: StatusCodes.CREATED,
            result: savedChat
        };
    } catch (error) {
        console.error('Error creating chat:', error);
        return {
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            result: 'Failed to create chat'
        };
    }
}
module.exports = {
    createChat
};
