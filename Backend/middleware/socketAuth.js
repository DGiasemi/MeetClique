const jwt = require("jsonwebtoken");
const getUser = require("../db/User/getUserDb");
const StatusCode = require("http-status-codes");
const { StatusCodes } = StatusCode;

/**
 * Socket.io authentication middleware
 * Validates JWT token from handshake auth or query parameters
 */
const socketAuth = async (socket, next) => {
    try {
        // Try to get token from handshake auth (preferred)
        let token = socket.handshake.auth?.token;
        
        // Fallback to query parameter
        if (!token) {
            token = socket.handshake.query?.token;
        }
        
        // Fallback to authorization header
        if (!token) {
            const authHeader = socket.handshake.headers?.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded || !decoded.user) {
            return next(new Error("Authentication error: Invalid token"));
        }

        // Verify user exists
        const userResult = await getUser.getUser(decoded.user);
        if (userResult.code === StatusCodes.NOT_FOUND) {
            return next(new Error("Authentication error: User not found"));
        }
        if (userResult.code !== StatusCodes.OK) {
            return next(new Error("Authentication error: Error fetching user"));
        }

        // Attach user ID and user object to socket
        socket.userId = decoded.user;
        socket.user = userResult.result;
        
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new Error("Authentication error: Token has expired"));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new Error("Authentication error: Invalid token"));
        }
        return next(new Error("Authentication error: " + err.message));
    }
};

module.exports = socketAuth;

