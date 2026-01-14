const { Group } = require('../../schemas/groupSchema');
const User = require('../../schemas/userSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getGroup(groupId) {
    try {
        // Fetch group as plain object
        const group = await Group.findById(groupId).lean();

        if (group && group.comments && group.comments.length > 0) {
            const ids = Array.from(new Set(group.comments.map(c => String(c.userId))));
            const users = await User.find({ _id: { $in: ids } }).select('username name').lean();
            const usersMap = users.reduce((acc, u) => { acc[String(u._id)] = u; return acc; }, {});
            group.comments = group.comments.map(c => {
                const uid = String(c.userId);
                const userObj = usersMap[uid];
                return { ...c, userId: userObj || c.userId };
            });
        }
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching group: ' + err.message };
    }
}

module.exports = getGroup;
