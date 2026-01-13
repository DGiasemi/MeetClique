import * as SecureStore from 'expo-secure-store';

const getUserToken = async () => {
    return await SecureStore.getItemAsync('userToken');
};

const URLS = {
    api: process.env.EXPO_PUBLIC_API_URL,
    login: '/login',
    register: '/register',
    getuser: '/getuser',
};

if (!URLS.api) {
    console.warn('EXPO_PUBLIC_API_URL is not set. API calls will fail until configured.');
}

const getAuthHeaders = async () => {
    const token = await getUserToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
    };
};

const getHeaders = async () => {
    return {
        'Accept': 'application/json',
    }
}

export { URLS, getAuthHeaders, getHeaders, getUserToken };