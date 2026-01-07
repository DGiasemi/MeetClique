import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { socketService } from '@/utils/socketService';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import NotificationService from '@/utils/notificationService';

export function useAppServices() {
    const router = useRouter();
    const appState = useRef(AppState.currentState);
    const initialized = useRef(false);

    useEffect(() => {
        const initializeServices = async () => {
            try {
                console.log('[Services] Initializing notification service...');
                const notificationService = NotificationService.getInstance();


                console.log('[Services] Initializing socket connection...');
                await socketService.connect();

                // Setup keep-alive ping interval
                const pingInterval = setInterval(() => {
                    if (socketService.connected) {
                        socketService.ping();
                    }
                }, 30000); // Ping every 30 seconds

                initialized.current = true;

                return () => {
                    clearInterval(pingInterval);
                    socketService.disconnect();
                };
            } catch (error) {
                console.error('[Services] Error initializing services:', error);
            }
        };

        initializeServices();

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('[Services] App has come to foreground');
                if (!socketService.connected) {
                    socketService.connect();
                }
            } else if (
                appState.current === 'active' &&
                nextAppState.match(/inactive|background/)
            ) {
                console.log('[Services] App has gone to background');
                // Keep socket connected in background for better UX
                // Socket will automatically disconnect when app is closed
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
            socketService.disconnect();
        };
    }, [router]);

    return {
        socketService,
        initialized: initialized.current,
    };
}

