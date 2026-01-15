const UserReport = require('../../schemas/userReportSchema');
const HttpStatusCode = require('http-status-codes');

async function createUserReport(targetUserId, reportedById, reason = 'unspecified', details = '') {
    try {
        const report = new UserReport({ targetUser: targetUserId, reportedBy: reportedById, reason, details });
        await report.save();
        return { code: HttpStatusCode.StatusCodes.OK, result: 'Report submitted' };
    } catch (error) {
        console.error('Error creating user report: ', error.message);
        return { code: HttpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error creating report' };
    }
}

module.exports = createUserReport;
