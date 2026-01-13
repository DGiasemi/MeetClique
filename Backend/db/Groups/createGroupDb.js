const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function createGroup(name, description, imageUrl, city, category, userId) {
    if (!name || !description || !city || !category || !userId) {
        return { code: StatusCodes.BAD_REQUEST, result: 'Missing required fields' };
    }

    try {
        const group = new Group({
            name,
            description,
            imageUrl: imageUrl || null,
            city,
            category,
            createdBy: userId,
            admins: [userId],
            members: [userId],
            membersCount: 1
        });

        await group.save();
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error creating group: ' + err.message };
    }
}

module.exports = createGroup;
