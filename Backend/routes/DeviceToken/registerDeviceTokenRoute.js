const express = require('express');
const router = express.Router();
const authenticationDetails = require('../../middleware/auth');
const { registerDeviceToken, unregisterDeviceToken } = require('../../db/DeviceToken/registerDeviceTokenDb');

/**
 * POST /registerdevicetoken
 * Register a device token for push notifications
 */
router.post('/', authenticationDetails, async (req, res) => {
    try {
        const { token, deviceId, platform } = req.body;
        const userId = req.userId;

        if (!token) {
            return res.status(400).json({ message: 'Device token is required' });
        }

        const result = await registerDeviceToken(userId, token, deviceId, platform);

        if (result.code !== 200) {
            return res.status(result.code).json({ message: result.result });
        }

        res.status(200).json({
            message: 'Device token registered successfully',
            deviceToken: result.result
        });
    } catch (error) {
        console.error('Error registering device token:', error);
        res.status(500).json({ message: 'Error registering device token' });
    }
});

/**
 * DELETE /registerdevicetoken
 * Unregister a device token
 */
router.delete('/', authenticationDetails, async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.userId;

        if (!token) {
            return res.status(400).json({ message: 'Device token is required' });
        }

        const result = await unregisterDeviceToken(userId, token);

        if (result.code !== 200) {
            return res.status(result.code).json({ message: result.result });
        }

        res.status(200).json({
            message: 'Device token unregistered successfully',
            deleted: result.result.deleted
        });
    } catch (error) {
        console.error('Error unregistering device token:', error);
        res.status(500).json({ message: 'Error unregistering device token' });
    }
});

module.exports = router;

