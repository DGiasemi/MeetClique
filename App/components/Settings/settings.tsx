import { BackHandler, ScrollView, Text, TouchableOpacity, View, Switch, Alert } from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { TabBarVisibilityContext } from "@/app/tabs/(tabs)/_layout";
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, User, Bell, Shield, CircleHelp, LogOut, FileText, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsScreen = 'main' | 'privacy' | 'help' | 'terms';

const Settings = (
    props: {
        onExit?: () => void;
        onLogout?: () => void;
        onEditProfile?: () => void;
    }
) => {
    const { setVisible: setNavBarVisible } = React.useContext(TabBarVisibilityContext);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [activeScreen, setActiveScreen] = useState<SettingsScreen>('main');

    useEffect(() => {
        // Load settings from storage
        const loadSettings = async () => {
            try {
                const val = await AsyncStorage.getItem('settings.notifications');
                if (val !== null) {
                    setNotificationsEnabled(JSON.parse(val));
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        };
        loadSettings();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (activeScreen !== 'main') {
                    setActiveScreen('main');
                    return true;
                }
                props.onExit && props.onExit();
                return true;
            };

            const backhandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                backhandler.remove();
            };
        }, [props.onExit, activeScreen])
    );

    React.useEffect(() => {
        setNavBarVisible(false);
        return () => {
            setNavBarVisible(true);
        };
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: () => props.onLogout && props.onLogout()
                }
            ]
        );
    };

    const toggleNotifications = async (val: boolean) => {
        setNotificationsEnabled(val);
        try {
            await AsyncStorage.setItem('settings.notifications', JSON.stringify(val));
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    };

    const renderHeader = (title: string, onBack: () => void) => (
        <View className="flex-row items-center justify-between px-4 pt-12 pb-6 z-10">
            <TouchableOpacity
                onPress={onBack}
                className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
                <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold tracking-tight">{title}</Text>
            <View className="w-10" />
        </View>
    );

    if (activeScreen === 'privacy') {
        return (
            <View className="flex-1 bg-black">
                <LinearGradient colors={['#1a1a1a', '#050505']} className="absolute left-0 right-0 top-0 bottom-0" />
                {renderHeader("Privacy & Security", () => setActiveScreen('main'))}
                <ScrollView className="flex-1 px-5">
                    <Text className="text-white text-base leading-6 mb-4">
                        Your privacy is important to us. This section outlines how we handle your data and keep your account secure.
                    </Text>
                    <Text className="text-white font-bold text-lg mb-2">Data Protection</Text>
                    <Text className="text-gray-400 mb-6">We use industry-standard encryption to protect your personal information.</Text>

                    <Text className="text-white font-bold text-lg mb-2">Security</Text>
                    <Text className="text-gray-400 mb-6">Your account is secured with secure token authentication. We recommend logging out when using public devices.</Text>
                </ScrollView>
            </View>
        );
    }

    if (activeScreen === 'help') {
        return (
            <View className="flex-1 bg-black">
                <LinearGradient colors={['#1a1a1a', '#050505']} className="absolute left-0 right-0 top-0 bottom-0" />
                {renderHeader("Help & Support", () => setActiveScreen('main'))}
                <ScrollView className="flex-1 px-5">
                    <Text className="text-white text-base mb-4">Need help? Currently, this is a demo application. For real support, please contact the developer.</Text>
                    <SettingsSection title="FAQ">
                        <View className="p-4">
                            <Text className="text-white font-bold mb-1">How do I create an event?</Text>
                            <Text className="text-gray-400 text-sm mb-4">Go to the main feed and tap the '+' button.</Text>

                            <Text className="text-white font-bold mb-1">How do I change my profile picture?</Text>
                            <Text className="text-gray-400 text-sm">Go to Settings &gt; Edit Profile and tap the camera icon.</Text>
                        </View>
                    </SettingsSection>
                </ScrollView>
            </View>
        );
    }

    if (activeScreen === 'terms') {
        return (
            <View className="flex-1 bg-black">
                <LinearGradient colors={['#1a1a1a', '#050505']} className="absolute left-0 right-0 top-0 bottom-0" />
                {renderHeader("Terms & Policies", () => setActiveScreen('main'))}
                <ScrollView className="flex-1 px-5">
                    <Text className="text-gray-400 text-sm leading-6">
                        By using this application, you agree to our Terms of Service and Privacy Policy.
                        {'\n\n'}
                        1. Respect others in the community.
                        {'\n'}
                        2. Do not post offensive or illegal content.
                        {'\n'}
                        3. We reserve the right to ban users who violate these rules.
                    </Text>
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <LinearGradient
                colors={['#1a1a1a', '#050505']}
                className="absolute left-0 right-0 top-0 bottom-0"
            />
            {renderHeader("Settings", () => props.onExit && props.onExit())}

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <SettingsSection title="Account">
                    <SettingsItem
                        icon={User}
                        label="Edit Profile"
                        onPress={() => props.onEditProfile && props.onEditProfile()}
                    />
                    <Divider />
                    <SettingsItem
                        icon={Shield}
                        label="Privacy & Security"
                        onPress={() => setActiveScreen('privacy')}
                    />
                </SettingsSection>

                {/* Preferences Section */}
                <SettingsSection title="Preferences">
                    <SettingsItem
                        icon={Bell}
                        label="Notifications"
                        isSwitch
                        value={notificationsEnabled}
                        onValueChange={toggleNotifications}
                    />
                </SettingsSection>

                {/* Support Section */}
                <SettingsSection title="Support">
                    <SettingsItem
                        icon={CircleHelp}
                        label="Help & Support"
                        onPress={() => setActiveScreen('help')}
                    />
                    <Divider />
                    <SettingsItem
                        icon={FileText}
                        label="Terms & Policies"
                        onPress={() => setActiveScreen('terms')}
                    />
                </SettingsSection>

                {/* Logout Button */}
                <TouchableOpacity
                    className="flex-row items-center justify-center bg-red-500/10 p-4 rounded-2xl mt-6 mb-12 border border-red-500/20 active:bg-red-500/20"
                    onPress={handleLogout}
                >
                    <LogOut size={20} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text className="text-red-500 font-bold text-lg">Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

// Sub-components
const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View className="mb-6">
        <Text className="text-gray-400 font-semibold mb-3 ml-2 uppercase text-xs tracking-wider opacity-80">{title}</Text>
        <View className="bg-white/5 rounded-3xl overflow-hidden border border-white/5">
            {children}
        </View>
    </View>
);

const SettingsItem = ({
    icon: Icon,
    label,
    onPress,
    isSwitch,
    value,
    onValueChange
}: {
    icon: any,
    label: string,
    onPress?: () => void,
    isSwitch?: boolean,
    value?: boolean,
    onValueChange?: (val: boolean) => void
}) => {
    return (
        <TouchableOpacity
            className="flex-row items-center p-4 active:bg-white/5"
            onPress={isSwitch ? () => onValueChange && onValueChange(!value) : onPress}
            disabled={isSwitch && !onValueChange}
            activeOpacity={0.7}
        >
            <View className="w-10 h-10 rounded-full bg-[#1F1F1F] items-center justify-center mr-4 border border-white/5">
                <Icon size={20} color="white" />
            </View>
            <Text className="text-white text-[16px] font-medium flex-1">{label}</Text>
            {isSwitch ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: "#3F3F3F", true: "#007AFF" }} // Blue accent for active
                    thumbColor={"#FFFFFF"}
                    ios_backgroundColor="#3e3e3e"
                />
            ) : (
                <ChevronRight size={20} color="#666" />
            )}
        </TouchableOpacity>
    );
};

const Divider = () => <View className="h-[1px] bg-white/5 ml-16" />;

export default Settings;