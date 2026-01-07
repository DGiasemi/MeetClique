const userSchema = require('../../schemas/userSchema');
const userSettingsSchema = require('../../schemas/userSettingsSchema');
const HttpStatusCode = require('http-status-codes');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { StatusCodes } = HttpStatusCode;

function generateKeyPair(password) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: password,
        },
    });

    return { publicKey, privateKey };
}

async function createUser(name, username, email, password, bio) {
    try {
        let existingUser = await userSchema.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            return { code: StatusCodes.CONFLICT, result: 'User with this username or email already exists' };
        }

        const { publicKey, privateKey } = generateKeyPair(password);
        const privateKeyBuffer = Buffer.from(privateKey);
        const privateKeyBase64 = privateKeyBuffer.toString('base64');

        const hashedPassword = await bcrypt.hash(password, 10);

        const User = new userSchema({
            name: name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            encryptedPrivateKey: privateKeyBase64,
            publicKey: publicKey,
            loginToken: crypto.randomBytes(16).toString('hex'),
            bio: bio,
        });

        const savedUser = await User.save();
        const userId = savedUser._id.toString();

        const userSettings = new userSettingsSchema({
            user: userId,
            locationSharing: 'friends',
            lastSeenVisibility: 'friends',
        });

        await userSettings.save();
        console.log(`User '${username}' created`);
        return { code: StatusCodes.OK, result: User };
    } catch (error) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error creating user' };
    }
}

module.exports = createUser;