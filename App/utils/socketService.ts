import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

class SocketService {
    private socket: Socket | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = Infinity;

    /**
     * Initialize socket connection
     */
    async connect(): Promise<void> {
        try {
            const token = await SecureStore.getItemAsync('userToken');

            if (!token) {
                console.warn('[Socket] No token found, cannot connect');
                return;
            }

            if (this.socket?.connected) {
                console.log('[Socket] Already connected');
                return;
            }

            this.socket = io(API_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: this.maxReconnectAttempts,
            });

            this.setupEventHandlers();

        } catch (error) {
            console.error('[Socket] Error connecting:', error);
        }
    }

    /**
     * Setup socket event handlers
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[Socket] Connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[Socket] Max reconnection attempts reached');
            }
        });

        this.socket.on('session:started', (data) => {
            console.log('[Socket] Session started:', data);
        });

        this.socket.on('user:online', (data) => {
            console.log('[Socket] User came online:', data.userId);
            // Handle user online event
        });

        this.socket.on('user:offline', (data) => {
            console.log('[Socket] User went offline:', data.userId);
            // Handle user offline event
        });

        this.socket.on('session:pong', (data) => {
            // Keep-alive response
            console.log('[Socket] Pong received:', data);
        });

        this.socket.on('newMessage', (data) => {
            console.log('[Socket] New message received:', data);
            // send notification
        });
    }

    /**
     * Disconnect socket
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Send ping to keep connection alive
     */
    ping(): void {
        if (this.socket?.connected) {
            this.socket.emit('session:ping');
        }
    }

    /**
     * Check if socket is connected
     */
    get connected(): boolean {
        return this.isConnected && this.socket?.connected === true;
    }

    /**
     * Get socket instance
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * Emit custom event
     */
    emit(event: string, data: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[Socket] Cannot emit, socket not connected');
        }
    }

    /**
     * Listen to custom event
     */
    on(event: string, callback: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Remove event listener
     */
    off(event: string, callback?: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

// Singleton instance
export const socketService = new SocketService();

