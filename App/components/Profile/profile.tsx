import * as SecureStore from 'expo-secure-store';

import { BackHandler, Image, Platform, ScrollView, Text, TouchableOpacity, Vibration, View } from "react-native";
import React, { useCallback } from "react";
import { getAuth, postAuth, putAuth } from "@/utils/request";
import { useFocusEffect, useRouter } from "expo-router";

import AsyncStorage from '@react-native-async-storage/async-storage';
import Chat from '../Chats/chat';
import EditProfile from "@/components/Profile/editprofile";
import { Ionicons } from '@expo/vector-icons';
import Event from '../Feed/event';
import ProfileSettings from './profileSettings';
import RefreshTab from '@/components/RefreshTab/refreshTab';
import Settings from '@/components/Settings/settings';
import log from '@/utils/logger';
import { useEffect } from "react";
import { eventBus } from '@/utils/eventBus';
import { useIsFocused } from '@react-navigation/native';

export default function Profile({ userId, isUsersProfile = false, onBack }: { userId?: string, isUsersProfile?: boolean, onBack?: () => void }) {
    const router = useRouter();
    const isFocused = useIsFocused();

    const [data, setData] = React.useState<any>(null);
    const [profilePictureOpen, setProfilePictureOpen] = React.useState(false);
    const [editProfile, setEditProfile] = React.useState(false);
    const [profilePicture, setProfilePicture] = React.useState<string | null>(null);
    const [openChat, setOpenChat] = React.useState(false);
    const [chatData, setChatData] = React.useState<any>(null);
    const [settings, setSettings] = React.useState(false);
    const [profilePicURI, setProfilePicURI] = React.useState<string>("");
    const [profileSettings, setProfileSettings] = React.useState<boolean>(false);
    const [attendedEvents, setAttendedEvents] = React.useState<any[]>([]);
    const [activeTab, setActiveTab] = React.useState<'myEvents' | 'attending'>('myEvents');

    useEffect(() => {
        const fetchData = async () => {
            const storedData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');

            if (isUsersProfile) {
                if (storedData) {
                    const parsedData = storedData;
                    setData(parsedData);
                    setProfilePicture(process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + storedData.id + '&v=' + storedData.version);
                }
            }
            const apiData = await getAuth(router, "/getuser" + (userId ? '?id=' + userId : ''));

            if (!apiData) {
                log.error('Failed to fetch user data');
                return;
            }
            if (isUsersProfile)
                AsyncStorage.setItem('userData', JSON.stringify(apiData));

            setData(apiData);

            if (apiData.version !== storedData?.version || !isUsersProfile) {
                setProfilePicture(process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + apiData.id + '&v=' + apiData.version);
            }

            const events = await getAuth(router, '/getevents?user=' + (userId ? userId : apiData.id));
            if (events && events.events) {
                setData((prevData: any) => ({
                    ...prevData,
                    events: events.events,
                    eventsCount: events.events.length,
                }));
            }

            const attended = await getAuth(router, '/getattendedevents?user=' + (userId ? userId : apiData.id));
            if (attended && attended.events) {
                setAttendedEvents(attended.events);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const unsub = eventBus.on('attendChanged', async (_data) => {
            try {
                await onRefresh();
            } catch (e) {
                console.error('Error refreshing profile after attendChanged', e);
            }
        });

        return () => {
            unsub();
        };
    }, [onRefresh]);

    useEffect(() => {
        const unsub2 = eventBus.on('eventCreated', async () => {
            try {
                await onRefresh();
            } catch (e) {
                console.error('Error refreshing profile after eventCreated', e);
            }
        });

        const unsub3 = eventBus.on('eventUpdated', async () => {
            try {
                await onRefresh();
            } catch (e) {
                console.error('Error refreshing profile after eventUpdated', e);
            }
        });

        const unsub4 = eventBus.on('eventDeleted', async () => {
            try {
                await onRefresh();
            } catch (e) {
                console.error('Error refreshing profile after eventDeleted', e);
            }
        });

        return () => {
            unsub2();
            unsub3();
            unsub4();
        };
    }, [onRefresh]);

    useEffect(() => {
        if (!isFocused) {
            setEditProfile(false);
            setSettings(false);
            setProfilePictureOpen(false);
        }
    }, [isFocused]);

    const onRefresh = React.useCallback(async () => {
        try {
            const apiData = await getAuth(router, "/getuser" + (userId ? '?id=' + userId : ''));
            if (apiData) {
                if (isUsersProfile)
                    AsyncStorage.setItem('userData', JSON.stringify(apiData));
                setData(apiData);
                setProfilePicture(process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + apiData.id + '&v=' + apiData.version);
                const events = await getAuth(router, '/getevents?user=' + (userId ? userId : apiData.id));
                if (events && events.events) {
                    setData((prevData: any) => ({
                        ...prevData,
                        events: events.events,
                        eventsCount: events.events.length,
                    }));
                }

                const attended = await getAuth(router, '/getattendedevents?user=' + (userId ? userId : apiData.id));
                if (attended && attended.events) {
                    setAttendedEvents(attended.events);
                }
            }
        } catch (error) {
            log.error('Error refreshing user data:', error);
        }
    }, [router]);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (openChat) {
                    setOpenChat(false);
                    return true;
                }
                return false;
            };

            const backhandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                backhandler.remove();
            };
        }, [openChat, setOpenChat])
    );

    if (editProfile) {
        return (
            <EditProfile
                pictureUri={profilePicture ?? undefined}
                name={data?.name}
                username={data?.username}
                onSave={async (name, username, saved) => {
                    if (saved) {
                        // Upload profile picture first if one was selected
                        if (profilePicURI !== "") {
                            const uri = profilePicURI;
                            const formData = new FormData();
                            formData.append('profilepic', {
                                uri,
                                name: 'profilepic.jpg',
                                type: 'image/jpeg',
                            } as any);

                            try {
                                const response = await postAuth(router, '/setprofilepic', formData, {
                                    'Content-Type': 'multipart/form-data',
                                });

                                if (response) {
                                    log.info('Profile picture updated successfully');
                                    // Update the profile picture with new version to force refresh
                                    setProfilePicture(process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + data.id + '&v=' + new Date().getTime());
                                    setProfilePicURI("");
                                }
                            } catch (error) {
                                log.error('Error uploading profile picture:', error);
                            }
                        }

                        // Then update name and username
                        await putAuth(router, '/updateuser', {
                            name,
                            username,
                        });
                        setData({ ...data, name, username });
                    }
                    setEditProfile(false);
                }}
                uploadPicture={async (uri) => {
                    setProfilePicture(uri);
                    setProfilePicURI(uri);
                }}
            />
        );
    }

    if (settings) {
        return (
            <Settings
                onExit={() => {
                    setSettings(false);
                }}
                onLogout={async () => {
                    log.info('User logged out');
                    SecureStore.deleteItemAsync('userToken');
                    SecureStore.deleteItemAsync('pushToken');
                    await AsyncStorage.removeItem('userData');
                    router.push('/login');
                }}
                onEditProfile={() => {
                    setSettings(false);
                    setEditProfile(true);
                }}
            />
        );
    }

    if (openChat) {
        return (
            <Chat
                user={
                    {
                        name: data?.name,
                        id: (data?.id),
                        chatId: chatData?._id
                    }
                }
                onExit={() => {
                    setOpenChat(false);
                }} />
        );
    }

    return (
        <View className="h-full bg-background">
            {profilePictureOpen && <View className="absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center">
                <TouchableOpacity onPress={() => setProfilePictureOpen(false)} className="absolute top-0 left-0 right-0 bottom-0">
                    <View className="bg-black opacity-80 w-full h-full" />
                </TouchableOpacity>
                <View className="bg-gray-800 p-2 rounded-full shadow-2xl">
                    <Image
                        source={{ uri: profilePicture ?? undefined }}
                        className="w-[280px] h-[280px] rounded-full"
                    />
                </View>
            </View>}

            {/* Profile Header */}
            <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
                {isUsersProfile ? (
                    <Text className="text-white text-2xl font-bold">Profile</Text>
                ) : (
                    <TouchableOpacity onPress={() => {
                        if (onBack) onBack();
                    }} className="flex-row items-center gap-1">
                        <Ionicons name="chevron-back" size={24} color="white" />
                        <Text className="text-white text-xl font-semibold">Back</Text>
                    </TouchableOpacity>
                )}
                {isUsersProfile && <TouchableOpacity
                    className='bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50'
                    onPress={() => {
                        setSettings(true);
                    }}>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="settings-outline" size={18} color="#3B82F6" />
                        <Text className="text-blue-500 font-semibold">Settings</Text>
                    </View>
                </TouchableOpacity>}
                {!isUsersProfile && <TouchableOpacity
                    className='bg-gray-800/50 p-2 rounded-full border border-gray-700/50'
                    onPress={() => {
                        setProfileSettings(true);
                    }}>
                    <Ionicons name="ellipsis-vertical" size={24} color="white" />
                </TouchableOpacity>}
            </View>
            <RefreshTab onRefresh={onRefresh}>
                <ScrollView className="h-full" contentContainerStyle={{ paddingBottom: 120 }}>
                    {/* Profile Picture & Name Section */}
                    <View className="items-center mt-6 px-4">
                        <TouchableOpacity
                            onPress={() => {
                                setProfilePictureOpen(true);
                                if (Platform.OS === 'android') {
                                    Vibration.vibrate(20);
                                } else {
                                    Vibration.vibrate();
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <View className="relative">
                                {/* Gradient ring around profile picture */}
                                <View className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-75" />
                                <View className="bg-background p-1 rounded-full">
                                    <Image
                                        source={{ uri: profilePictureOpen ? undefined : (profilePicture ?? undefined) }}
                                        className="w-28 h-28 rounded-full"
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text className="text-white text-2xl font-bold mt-4">{data?.name || `@${data?.username}`}</Text>
                        {data?.name &&
                            <Text className="text-gray-400 text-base mt-1">@{data?.username}</Text>}

                        {/* Bio */}
                        {data?.bio && (
                            <Text className="text-gray-300 text-sm text-center mt-3 px-6 leading-5">{data.bio}</Text>
                        )}
                    </View>

                    {/* Stats Section */}
                    <View className="flex-row justify-around px-8 mt-6">
                        <View className="items-center">
                            <Text className="text-white text-2xl font-bold">{data?.eventsCount || 0}</Text>
                            <Text className="text-gray-400 text-sm mt-1">Events</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-white text-2xl font-bold">{attendedEvents?.length || 0}</Text>
                            <Text className="text-gray-400 text-sm mt-1">Attended</Text>
                        </View>
                    </View>

                    <View className='w-full h-[1px] mt-6 bg-gray-700/50' />

                    {!isUsersProfile && !data?.blocked &&
                        <>
                            <View className="mt-5 px-4 flex flex-row justify-center gap-3">
                                <TouchableOpacity
                                    className="flex-1 bg-purple-600 py-3 rounded-xl shadow-lg"
                                    activeOpacity={0.8}
                                    onPress={async () => {
                                        const res = await getAuth(router, '/getchat?memberId=' + data?.id);
                                        if (res.status === 200) {
                                            setChatData(res);
                                            setOpenChat(true);
                                        }
                                    }}>
                                    <View className="flex-row items-center justify-center gap-2">
                                        <Ionicons name="chatbubble-outline" size={20} color="white" />
                                        <Text className="text-white font-bold text-base">Message</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View className='w-full h-[1px] mt-5 bg-gray-700/50' />
                        </>
                    }
                    {data?.blocked && (
                        <View className="mt-5 mx-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <View className="flex-row items-center justify-center gap-2">
                                <Ionicons name="ban" size={20} color="#EF4444" />
                                <Text className="text-red-500 font-semibold">You cannot interact with this user</Text>
                            </View>
                        </View>
                    )}

                    {/* Edit Profile Button for User's Own Profile */}
                    {isUsersProfile && (
                        <View className="px-4 mt-5">
                            <TouchableOpacity
                                className="bg-gray-800/50 border border-gray-700/50 py-3 rounded-xl shadow-lg"
                                activeOpacity={0.8}
                                onPress={() => setEditProfile(true)}
                            >
                                <View className="flex-row items-center justify-center gap-2">
                                    <Ionicons name="create-outline" size={20} color="white" />
                                    <Text className="text-white font-bold text-base">Edit Profile</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View className="mt-6 mb-6">
                        {/* Tab Headers */}
                        <View className="flex-row px-4 mb-4 gap-2">
                            <TouchableOpacity
                                onPress={() => setActiveTab('myEvents')}
                                className={`flex-1 py-3 rounded-xl border ${activeTab === 'myEvents'
                                    ? 'bg-blue-600 border-blue-500'
                                    : 'bg-gray-800/30 border-gray-700/50'
                                    }`}
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center justify-center gap-2">
                                    <Ionicons
                                        name="calendar"
                                        size={20}
                                        color={activeTab === 'myEvents' ? '#FFFFFF' : '#3B82F6'}
                                    />
                                    <Text
                                        className={`font-bold ${activeTab === 'myEvents' ? 'text-white' : 'text-blue-500'
                                            }`}
                                    >
                                        {isUsersProfile ? 'My Events' : 'Events'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setActiveTab('attending')}
                                className={`flex-1 py-3 rounded-xl border ${activeTab === 'attending'
                                    ? 'bg-green-600 border-green-500'
                                    : 'bg-gray-800/30 border-gray-700/50'
                                    }`}
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center justify-center gap-2">
                                    <Ionicons
                                        name="people"
                                        size={20}
                                        color={activeTab === 'attending' ? '#FFFFFF' : '#10B981'}
                                    />
                                    <Text
                                        className={`font-bold ${activeTab === 'attending' ? 'text-white' : 'text-green-500'
                                            }`}
                                    >
                                        Attending
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Tab Content */}
                        <View className="px-4">
                            {activeTab === 'myEvents' ? (
                                data?.events && data.events.length > 0 ? (
                                    data.events.map((event: any) => (
                                        <View key={event?.id}>
                                            <Event event={event} showTop={true} />
                                        </View>
                                    ))
                                ) : (
                                    <View className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 items-center">
                                        <Ionicons name="calendar-outline" size={48} color="#6B7280" />
                                        <Text className="text-gray-400 text-sm mt-3">No events to display</Text>
                                    </View>
                                )
                            ) : (
                                attendedEvents && attendedEvents.length > 0 ? (
                                    attendedEvents.map((event: any) => (
                                        <View key={event?.id}>
                                            <Event event={event} showTop={true} />
                                        </View>
                                    ))
                                ) : (
                                    <View className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 items-center">
                                        <Ionicons name="people-outline" size={48} color="#6B7280" />
                                        <Text className="text-gray-400 text-sm mt-3">No attended events</Text>
                                    </View>
                                )
                            )}
                        </View>
                    </View>

                </ScrollView>

            </RefreshTab>
            <ProfileSettings
                visible={profileSettings}
                onClose={() => setProfileSettings(false)}
            />
        </View>
    );
}