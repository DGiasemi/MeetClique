const express = require('express');

const loginRoute = require('./Auth/loginRoute');
const registerRoute = require('./Auth/registerRoute');
const isAuthenticatedRoute = require('./Auth/isAuthenticatedRoute');

const getUserRoute = require('./User/getUserRoute');
const findUserRoute = require('./User/findUserRoute');
const updateUserRoute = require('./User/updateUserRoute');
const setProfilePicRoute = require('./User/setProfilePicRoute');
const getProfilePicRoute = require('./User/getProfilePicRoute');
const getOnlineStatusRoute = require('./User/getOnlineStatusRoute');

const addUserPushTokenRoute = require('./User/Token/addUserPushTokenRoute');

const getFriendsRoute = require('./User/Friends/getFriendsRoute');
const registerDeviceTokenRoute = require('./DeviceToken/registerDeviceTokenRoute');

const getChats = require('./Chats/getChatsRoute');
const getChatRoute = require('./Chats/getChatRoute');

const sendMessageRoute = require('./Messages/sendMessageRoute');
const getMessageGroupRoute = require('./Messages/getMessageGroupRoute');

const createLocationRoute = require('./Location/createLocationRoute');
const getLocationsRoute = require('./Location/getLocationsRoute');

const createEventRoute = require('./Events/createEventRoute');
const getEventsRoute = require('./Events/getEventsRoute');
const getEventImageRoute = require('./Events/getEventImageRoute');
const deleteEventRoute = require('./Events/deleteEventRoute');
const getLiveEventsRoute = require('./Events/getLiveEventsRoute');
const getAllEventsRoute = require('./Events/getAllEventsRoute');
const joinEventRoute = require('./Events/joinEventRoute');
const leaveEventRoute = require('./Events/leaveEventRoute');
const getAttendedEventsRoute = require('./Events/getAttendedEventsRoute');
const getEventAttendeesRoute = require('./Events/getEventAttendeesRoute');
const updateEventRoute = require('./Events/updateEventRoute');

const authenticationDetails = require('../middleware/auth');
const router = express.Router();
const path = require('path');

router.use('/static', express.static(path.join(__dirname, '../Data')));

// Authentication routes
router.use('/isauthenticated', authenticationDetails, isAuthenticatedRoute);
router.use('/login', loginRoute);
router.use('/register', registerRoute);
// User routes
router.use('/getuser', authenticationDetails, getUserRoute);
router.use('/finduser', authenticationDetails, findUserRoute);
router.use('/updateuser', authenticationDetails, updateUserRoute);
router.use('/getonlinestatus', getOnlineStatusRoute);
// User Token routes
router.use('/adduserpushtoken', authenticationDetails, addUserPushTokenRoute);
// Friends routes
router.use('/getfriends', authenticationDetails, getFriendsRoute);
// Device token routes
router.use('/registerdevicetoken', registerDeviceTokenRoute);
// User profile picture routes
router.use('/setprofilepic', authenticationDetails, setProfilePicRoute);
router.use('/getprofilepic', getProfilePicRoute);
// Chats routes
router.use('/getchats', authenticationDetails, getChats);
router.use('/getchat', authenticationDetails, getChatRoute);
// Messages routes
router.use('/sendmessage', authenticationDetails, sendMessageRoute);
router.use('/getmessagegroup', authenticationDetails, getMessageGroupRoute);
// Events routes
router.use('/createevent', authenticationDetails, createEventRoute);
router.use('/getevents', getEventsRoute);
router.use('/geteventimage', getEventImageRoute);
router.use('/deleteevent', authenticationDetails, deleteEventRoute);
router.use('/getliveevents', authenticationDetails, getLiveEventsRoute);
router.use('/getallevents', authenticationDetails, getAllEventsRoute);
router.use('/joinevent', authenticationDetails, joinEventRoute);
router.use('/leaveevent', authenticationDetails, leaveEventRoute);
router.use('/getattendedevents', getAttendedEventsRoute);
router.use('/geteventattendees', authenticationDetails, getEventAttendeesRoute);
router.use('/updateevent', authenticationDetails, updateEventRoute);
// Locations routes
router.use('/createlocation', authenticationDetails, createLocationRoute);
router.use('/getlocations', getLocationsRoute);
// Groups routes
const createGroupRoute = require('./Groups/createGroupRoute');
const getGroupsRoute = require('./Groups/getGroupsRoute');
const getGroupRoute = require('./Groups/getGroupRoute');
const joinGroupRoute = require('./Groups/joinGroupRoute');
const leaveGroupRoute = require('./Groups/leaveGroupRoute');
const groupCommentRoutes = require('./Groups/commentRoutes');
const updateGroupRoute = require('./Groups/updateGroupRoute');
const deleteGroupRoute = require('./Groups/deleteGroupRoute');

router.use('/creategroup', authenticationDetails, createGroupRoute);
router.use('/getgroups', getGroupsRoute);
router.use('/getgroup', getGroupRoute);
router.use('/joingroup', authenticationDetails, joinGroupRoute);
router.use('/leavegroup', authenticationDetails, leaveGroupRoute);
router.use('/groupcomments', authenticationDetails, groupCommentRoutes);
router.use('/updategroup', authenticationDetails, updateGroupRoute);
router.use('/deletegroup', authenticationDetails, deleteGroupRoute);

module.exports = router;