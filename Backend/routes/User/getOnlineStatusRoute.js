const express = require('express');
const router = express.Router();
const authenticationDetails = require('../../middleware/auth');
const { isUserOnline, getOnlineUsersCount, getAllOnlineUsers } = require('../../utils/socketUtils');

/**
 * GET /getonlinestatus/:userId
 * Check if a specific user is online
 */
router.get('/:userId', authenticationDetails, async (req, res) => {
    try {
        const { userId } = req.params;
        const online = isUserOnline(userId);
        
        res.status(200).json({
            userId,
            online,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error getting online status:', error);
        res.status(500).json({ message: 'Error getting online status' });
    }
});

/**
 * GET /getonlinestatus
 * Get online users count and list (requires authentication)
 */
router.get('/', authenticationDetails, async (req, res) => {
    try {
        const onlineUsersCount = getOnlineUsersCount();
        const onlineUsers = getAllOnlineUsers();
        
        res.status(200).json({
            onlineUsersCount,
            onlineUsers,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error getting online users:', error);
        res.status(500).json({ message: 'Error getting online users' });
    }
});

module.exports = router;

