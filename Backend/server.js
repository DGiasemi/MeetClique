const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/env');
const db = require('./db');
const initializeSocketHandlers = require('./utils/socketHandler');

const PORT = config.PORT;

db.connect();
require('./schemas/messageGroupSchema');
require('./schemas/messageSchema');
require('./schemas/eventSchema');
require('./schemas/userSchema');
require('./schemas/deviceTokenSchema');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Initialize socket handlers
initializeSocketHandlers(io);

// Make io accessible globally for use in routes
global.io = io;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.io is ready for connections`);
});