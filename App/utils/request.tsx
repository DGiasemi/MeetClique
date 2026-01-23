import * as SecureStore from 'expo-secure-store';

import { URLS, getAuthHeaders } from '@/constants/API';

import { ToastAndroid } from 'react-native';
import axios from 'axios';
import log from './logger';

const API_BASE_URL = URLS.api;

if (!API_BASE_URL) {
    console.error('EXPO_PUBLIC_API_URL is not set. API calls will fail. Set EXPO_PUBLIC_API_URL in your environment.');
}

const getAuth = async (router: any, endpoint: string) => {
    try {
        if (!API_BASE_URL) throw new Error('API base URL not configured');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: { ...await getAuthHeaders() },
        });
        const status = response.status;
        const json = await response.json();

        if (!response.ok) {
            if (json.unauthorized) {
                SecureStore.deleteItemAsync('userToken');
                log.error('Unauthorized access, redirecting to login');
                router.push('/login');
            }
        }
        json.status = status;
        return json;
    } catch (error) {
        throw error;
    }
};

const postAuth = async (router: any, endpoint: string, body?: any, headers?: any) => {
    try {
        if (!API_BASE_URL) throw new Error('API base URL not configured');
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, body, {
            headers: { ...await getAuthHeaders(), ...headers },
        });
        const final = response.data;
        final.status = response.status;
        if (response.status !== 200) {
            if (response.data.unauthorized) {
                SecureStore.deleteItemAsync('userToken');
                log.error('Unauthorized access, redirecting to login');
                router.push('/login');
            }
            return final;
        }

        return final;
    } catch (error) {
        throw error;
    }
}

const deleteAuth = async (router: any, endpoint: string, body?: any) => {
    try {
        if (!API_BASE_URL) throw new Error('API base URL not configured');
        const response = await axios.delete(`${API_BASE_URL}${endpoint}`, {
            headers: { ...await getAuthHeaders() },
            data: body,
        });
        const final = response.data;
        final.status = response.status;
        if (response.status !== 200) {
            if (response.data.unauthorized) {
                SecureStore.deleteItemAsync('userToken');
                log.error('Unauthorized access, redirecting to login');
                router.push('/login');
            }
            return final;
        }

        return final;
    } catch (error) {
        throw error;
    }
}

const putAuth = async (router: any, endpoint: string, body?: any, headers?: any) => {
    try {
        if (!API_BASE_URL) throw new Error('API base URL not configured');
        const response = await axios.put(`${API_BASE_URL}${endpoint}`, body, {
            headers: { ...await getAuthHeaders(), ...headers },
        });
        const final = response.data;
        final.status = response.status;
        if (response.status !== 200) {
            if (response.data.unauthorized) {
                SecureStore.deleteItemAsync('userToken');
                log.error('Unauthorized access, redirecting to login');
                router.push('/login');
            }
            return final;
        }

        return final;
    } catch (error) {
        throw error;
    }
}

export { postAuth, getAuth, deleteAuth, putAuth };