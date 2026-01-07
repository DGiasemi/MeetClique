import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { postAuth, putAuth } from './request';
import { useRouter } from 'expo-router';

class NotificationService {

    private static instance: NotificationService;

    private constructor() {
        this.initialize();
    }

    private async initialize() {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: false,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });


        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            await Notifications.requestPermissionsAsync();
        }
        let token = await SecureStore.getItemAsync('pushToken');

        if (!token) {
            token = (await Notifications.getExpoPushTokenAsync()).data;
            await SecureStore.setItemAsync('pushToken', token);
        }

        if (!token) {
            console.error('Failed to get push token');
            return;
        }

        const router = useRouter();

        putAuth(router, '/addUserPushToken', { token });
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
}

export default NotificationService;
