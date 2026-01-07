/**
 * Session Manager for tracking active user sessions
 * Maps userId -> Set of socketIds (users can have multiple sessions)
 */
class SessionManager {
    constructor() {
        // Map of userId -> Set of socketIds
        this.activeSessions = new Map();
        // Map of socketId -> userId (for quick lookup)
        this.socketToUser = new Map();
    }

    /**
     * Start a new session for a user
     * @param {string} userId - User ID
     * @param {string} socketId - Socket connection ID
     * @returns {boolean} - True if this is the first session for the user
     */
    startSession(userId, socketId) {
        if (!this.activeSessions.has(userId)) {
            this.activeSessions.set(userId, new Set());
        }
        
        const wasOffline = this.activeSessions.get(userId).size === 0;
        this.activeSessions.get(userId).add(socketId);
        this.socketToUser.set(socketId, userId);
        
        return wasOffline;
    }

    /**
     * End a session for a user
     * @param {string} socketId - Socket connection ID
     * @returns {Object} - { userId, isNowOffline } or null if socket not found
     */
    endSession(socketId) {
        const userId = this.socketToUser.get(socketId);
        
        if (!userId) {
            return null;
        }

        const userSessions = this.activeSessions.get(userId);
        if (userSessions) {
            userSessions.delete(socketId);
            
            // If no more sessions, remove user from active sessions
            const isNowOffline = userSessions.size === 0;
            if (isNowOffline) {
                this.activeSessions.delete(userId);
            }
            
            this.socketToUser.delete(socketId);
            
            return { userId, isNowOffline };
        }
        
        this.socketToUser.delete(socketId);
        return { userId, isNowOffline: true };
    }

    /**
     * Check if a user is currently online
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    isUserOnline(userId) {
        return this.activeSessions.has(userId) && this.activeSessions.get(userId).size > 0;
    }

    /**
     * Get all socket IDs for a user
     * @param {string} userId - User ID
     * @returns {Set<string>} - Set of socket IDs
     */
    getUserSockets(userId) {
        return this.activeSessions.get(userId) || new Set();
    }

    /**
     * Get user ID for a socket
     * @param {string} socketId - Socket connection ID
     * @returns {string|null} - User ID or null
     */
    getUserBySocket(socketId) {
        return this.socketToUser.get(socketId) || null;
    }

    /**
     * Get all online user IDs
     * @returns {Array<string>} - Array of user IDs
     */
    getAllOnlineUsers() {
        return Array.from(this.activeSessions.keys());
    }

    /**
     * Get count of active sessions for a user
     * @param {string} userId - User ID
     * @returns {number}
     */
    getSessionCount(userId) {
        const sessions = this.activeSessions.get(userId);
        return sessions ? sessions.size : 0;
    }

    /**
     * Get total number of active sessions across all users
     * @returns {number}
     */
    getTotalSessions() {
        let total = 0;
        for (const sessions of this.activeSessions.values()) {
            total += sessions.size;
        }
        return total;
    }

    /**
     * Get total number of online users
     * @returns {number}
     */
    getOnlineUsersCount() {
        return this.activeSessions.size;
    }
}

// Singleton instance
const sessionManager = new SessionManager();

module.exports = sessionManager;

