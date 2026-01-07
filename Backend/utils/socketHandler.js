const sessionManager = require('./sessionManager');
const jwt = require("jsonwebtoken");

/**
 * Initialize socket.io event handlers
 * @param {SocketIO.Server} io - Socket.io server instance
 */
function initializeSocketHandlers(io) {
    // Authentication middleware
    const socketAuth = require('../middleware/socketAuth');
    
    io.use(socketAuth);

    io.on('connection', (socket) => {
        const userId = socket.userId;
        const socketId = socket.id;
        
        console.log(`[Socket] User ${userId} connected with socket ${socketId}`);

        // Start session
        const wasOffline = sessionManager.startSession(userId, socketId);
        
        if (wasOffline) {
            console.log(`[Socket] User ${userId} came online`);
            // Emit user online event to all connected clients (except the newly connected one)
            socket.broadcast.emit('user:online', { userId });
        }

        // Emit session started event to the connected client
        socket.emit('session:started', { 
            userId,
            socketId,
            sessionCount: sessionManager.getSessionCount(userId),
        });

        // Handle session ping (keep-alive)
        socket.on('session:ping', () => {
            socket.emit('session:pong', { timestamp: Date.now() });
        });

        // Handle custom events here if needed
        // Example: socket.on('message:send', handleMessageSend);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`[Socket] User ${userId} disconnected: ${reason}`);
            
            // End session before emitting (socket is still connected at this point)
            const sessionInfo = sessionManager.endSession(socketId);
            
            if (sessionInfo && sessionInfo.isNowOffline) {
                console.log(`[Socket] User ${userId} went offline`);
                // Emit user offline event to all remaining connected clients
                // Use io.emit with exception since socket might be disconnecting
                socket.broadcast.emit('user:offline', { userId });
            }
        });

        // Handle explicit session end event
        socket.on('session:end', () => {
            console.log(`[Socket] User ${userId} explicitly ended session`);
            const sessionInfo = sessionManager.endSession(socketId);
            
            if (sessionInfo && sessionInfo.isNowOffline) {
                socket.broadcast.emit('user:offline', { userId });
            }
            
            socket.disconnect();
        });
    });

    // Helper function to emit to a specific user (all their sessions)
    io.emitToUser = (userId, event, data) => {
        const sockets = sessionManager.getUserSockets(userId);
        sockets.forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
    };

    // Helper function to check if user is online
    io.isUserOnline = (userId) => {
        return sessionManager.isUserOnline(userId);
    };

    // Helper function to get online users count
    io.getOnlineUsersCount = () => {
        return sessionManager.getOnlineUsersCount();
    };

    // Helper function to get all online users
    io.getAllOnlineUsers = () => {
        return sessionManager.getAllOnlineUsers();
    };

    console.log('[Socket] Socket handlers initialized');
}

module.exports = initializeSocketHandlers;

