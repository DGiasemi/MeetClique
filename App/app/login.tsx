import * as SecureStore from 'expo-secure-store';

import { KeyboardAvoidingView, ScrollView, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { URLS } from '@/constants/API';
import { getAuth } from '@/utils/request';
import { useRouter } from 'expo-router';
import NotificationService from '@/utils/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    SecureStore.getItemAsync('userToken').then(token => {
      if (token) {
        ToastAndroid.show("Already logged in", ToastAndroid.SHORT);
        router.push('/tabs');
      }
    });
  }, []);

  const handleAuth = async () => {
    if (!username || !password) {
      ToastAndroid.show("Please fill in all fields", ToastAndroid.SHORT);
      return;
    }

    setIsLoading(true);
    const url = URLS.api + URLS.login;
    console.log(url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const json = await response.json();
        const token = json.token;
        await SecureStore.setItemAsync('userToken', token);

        const apiData = await getAuth(router, URLS.getuser);
        if (apiData)
          AsyncStorage.setItem('userData', JSON.stringify(apiData));

        NotificationService.getInstance();

        router.push('/tabs');
      } else {
        const res = await response.json();
        ToastAndroid.show(res.message, ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error("Error:", error);
      ToastAndroid.show("Network error", ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Gradient Background */}
      <View className="absolute top-0 left-0 right-0 h-96 opacity-30">
        <View className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <View className="absolute top-20 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl translate-x-1/2" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 justify-center px-6 py-12"
        >
          {/* Logo/Title Section */}
          <View className="items-center mb-12">
            <View className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-3xl items-center justify-center mb-4 shadow-lg">
              <Ionicons name="location" size={40} color="white" />
            </View>
            <Text className="text-white text-4xl font-bold mb-2">Welcome Back</Text>
            <Text className="text-gray-400 text-base">Sign in to continue your journey</Text>
          </View>

          {/* Form Card */}
          <View className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50 shadow-2xl">
            {/* Username Input */}
            <View className="mb-5">
              <Text className="text-gray-300 text-sm font-semibold mb-2 ml-1">Username</Text>
              <View className="flex-row items-center bg-gray-700/50 rounded-xl border border-gray-600/50 px-4 py-1">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-white text-base p-3 pl-3"
                  placeholder="Enter your username"
                  placeholderTextColor="#6B7280"
                  onChangeText={setUsername}
                  autoCapitalize='none'
                  value={username}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-3">
              <Text className="text-gray-300 text-sm font-semibold mb-2 ml-1">Password</Text>
              <View className="flex-row items-center bg-gray-700/50 rounded-xl border border-gray-600/50 px-4 py-1">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-white text-base p-3 pl-3"
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  autoCapitalize='none'
                  value={password}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => ToastAndroid.show("Gl with ts 🙏💀", ToastAndroid.SHORT)}
              className="mb-6"
            >
              <Text className="text-blue-400 text-sm text-right">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              className={`bg-blue-600 rounded-xl py-4 shadow-lg ${isLoading ? 'opacity-50' : ''}`}
              onPress={handleAuth}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center gap-2">
                {isLoading ? (
                  <Ionicons name="hourglass-outline" size={20} color="white" />
                ) : (
                  <Ionicons name="log-in-outline" size={20} color="white" />
                )}
                <Text className="text-white text-center font-bold text-base">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-gray-700" />
              <Text className="text-gray-500 px-4 text-sm">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-700" />
            </View>

            {/* Register Link */}
            <TouchableOpacity
              onPress={() => router.push('/register')}
              className="rounded-xl py-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="person-add-outline" size={20} color="#60A5FA" />
                <Text className="text-blue-400 text-center font-semibold text-base">
                  Create New Account
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text className="text-gray-500 text-center mt-8 text-sm">
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}