import { BackHandler, FlatList, Image, Text, TextInput, TouchableOpacity, View, SafeAreaView } from "react-native";
import React, { useCallback, useEffect } from "react";
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import AsyncStorage from "@react-native-async-storage/async-storage";
import Chat from "@/components/Chats/chat";
import { Ionicons } from "@expo/vector-icons";
import RefreshTab from "@/components/RefreshTab/refreshTab";
import { getAuth } from "@/utils/request";
import log from "@/utils/logger";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from 'expo-router';

export default function Chats({ onBackPress, isVisible }: { onBackPress?: () => void, isVisible?: boolean }) {
    const [chats, setChats] = React.useState<any[]>([]);
    const [openChat, setOpenChat] = React.useState(false);
    const [users, setUsers] = React.useState<any>({});
    const [isSearching, setIsSearching] = React.useState(false);
    const [chatUser, setChatUser] = React.useState<any>({});
    const [selectedUserDetails, setSelectedUserDetails] = React.useState<any>(null);
    const isFocused = useIsFocused();
    const router = useRouter();
    const params = useLocalSearchParams();

    const refreshChats = async () => {
        await fetchChats(false);
    };

    const fetchChats = async (useStoredData: boolean) => {
        try {
            const storedData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');

            if (storedData && useStoredData) {
                setChats(storedData.chats || []);
            }

            const apiData = await getAuth(router, '/getchats');

            let chats: { id: any; otherUserId: any; type: any; message: any; time: any; name: any; image: any; }[] = [];
            if (!apiData || !Array.isArray(apiData)) {
                log.error('Failed to fetch chats from API or invalid response format');
                setChats([]);
                return;
            }
            const userId = storedData.id;

            apiData.forEach((chat: any) => {
                const members = chat.members || [];
                let excludedMembers = members.filter((member: any) => member._id !== userId);

                if (chat.type === 'private' && excludedMembers.length > 0) {
                    chats.push({
                        id: chat._id,
                        otherUserId: excludedMembers[0]._id,
                        type: chat.type,
                        message: chat.lastMessage || 'Tap to start a conversation',
                        time: chat.lastMessageTime || '',
                        name: excludedMembers[0].name,
                        image: process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + excludedMembers[0]._id + '&v=' + excludedMembers[0].version,
                    });
                }
                if (chat.type === 'group') {
                    chats.push({
                        id: chat._id,
                        otherUserId: null,
                        type: chat.type,
                        message: chat.lastMessage || '',
                        time: chat.lastMessageTime || '',
                        name: chat.name || 'Group Chat',
                        image: chat.image || process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + userId,
                    });
                }
            });
            setChats(chats || []);
        } catch (error) {
            log.error("Error loading chats:", error);
        }
    };

    useEffect(() => {
        fetchChats(true);
        // If openMemberId provided in params, open chat directly
        (async () => {
            try {
                const openMemberId = params?.openMemberId;
                if (openMemberId) {
                    const res = await getAuth(router, '/getchat?memberId=' + openMemberId);
                    setSelectedUserDetails({ id: openMemberId });
                    setChatUser(res);
                    setOpenChat(true);
                }
            } catch (e) {
                console.error('Failed to open chat from params', e);
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (openChat) {
                    setOpenChat(false);
                    setSelectedUserDetails(null);
                    return true;
                }
                if (isSearching) {
                    setIsSearching(false);
                    setUsers({});
                    setChatUser(null);
                    return true;
                }
                return false;
            };

            const backhandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                backhandler.remove();
            };
        }, [openChat, setOpenChat, isSearching, setIsSearching])
    );

    useFocusEffect(
        useCallback(() => {
            const backPress = () => {
                if (onBackPress && isVisible) {
                    onBackPress();
                    return true;
                }
                return false;
            };
            const backhandler = BackHandler.addEventListener('hardwareBackPress', backPress);

            return () => {
                backhandler.remove();
            };
        }, [onBackPress])
    );

    useEffect(() => {
        if (!isFocused) {
            setOpenChat(false);
            setSelectedUserDetails(null);
            setIsSearching(false);
            setChatUser(null);
        }
    }, [isFocused]);

    if (openChat) {
        return (
            <Chat
                user={
                    {
                        name: chatUser.name || selectedUserDetails.name,
                        id: (selectedUserDetails ? selectedUserDetails.id : chatUser.otherUserId),
                        chatId: selectedUserDetails
                            ? (chatUser.result?._id || chatUser._id || chatUser.id)
                            : chatUser.id
                    }
                }
                onExit={() => {
                    setOpenChat(false);
                }} />
        );
    }

    if (isSearching) {
        return (
            <SafeAreaView className="h-full bg-background">
                {/* Search Header */}
                <View className="border-b border-gray-700/50 bg-gray-800/30">
                    <View className="px-4 pt-4 pb-3">
                        <View className="flex-row items-center bg-gray-800/50 border border-gray-700/50 rounded-xl">
                            <View className="ml-3 py-3 px-1">
                                <Ionicons name="search" size={20} color="#3B82F6" />
                            </View>
                            <TextInput
                                className="text-white flex-1 p-0 m-0"
                                placeholder="Search users by name or @username"
                                placeholderTextColor="white"
                                autoFocus
                                returnKeyType="search"
                                onEndEditing={async (props) => {
                                    const text = props.nativeEvent.text;
                                    if (text.trim() !== "") {
                                        const res = await getAuth(router, '/finduser?search=' + text);
                                        setUsers(res || {});
                                    } else {
                                        setUsers({});
                                    }
                                }}
                                style={{ opacity: 1, textAlignVertical: 'center', height: 44, fontSize: 16 }}
                            />
                            <TouchableOpacity className="px-3 py-2" onPress={() => { setIsSearching(false); setUsers({}); }}>
                                <Text className="text-red-500">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <FlatList
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                        data={users || []}
                        keyExtractor={(item) => item.id}
                        ItemSeparatorComponent={() => <View className="h-px bg-white/10" />}
                        ListEmptyComponent={() => (
                            <View className="items-center justify-center mt-8">
                                <Text className="text-gray-400">Search for people to start a chat</Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="flex-row items-center py-3"
                                onPress={async () => {
                                    setIsSearching(false);
                                    const res = await getAuth(router, '/getchat?memberId=' + item.id);
                                    setSelectedUserDetails(item);
                                    setChatUser(res);
                                    setUsers({});
                                    setOpenChat(true);
                                }}
                            >
                                <Image
                                    source={{ uri: process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + item.id + '&t=' + new Date().getTime() }}
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-lg">{item.name}</Text>
                                    <Text className="text-gray-400 text-sm" numberOfLines={1}>
                                        @{item.username}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="h-full bg-background">
            <View className="p-4">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-2xl font-bold">Chats</Text>
                </View>

                <TouchableOpacity
                    className="flex-row items-center bg-white/50 rounded-xl"
                    onPress={() => setIsSearching(true)}
                    activeOpacity={0.8}
                >
                    <View className="ml-2 py-3 px-2">
                        <Ionicons name="search" size={18} color="black" />
                    </View>
                    <Text
                        className="text-black flex-1 p-0 m-0"
                        style={{ opacity: 0.7, textAlignVertical: 'center', height: 44, fontSize: 16 }}
                    >Search...</Text>
                </TouchableOpacity>
            </View>
            <RefreshTab onRefresh={refreshChats}>
                <FlatList
                    className="h-full"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                    data={chats}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={() => <View className="h-px bg-white/10" />}
                    ListEmptyComponent={() => (
                        <View className="items-center justify-center mt-10">
                            <Text className="text-gray-400 mb-3">No conversations yet</Text>
                            <TouchableOpacity className="bg-white/10 px-4 py-2 rounded-lg" onPress={() => setIsSearching(true)}>
                                <Text className="text-white">Start a chat</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity className="flex-row items-center py-3" onPress={() => {
                            setOpenChat(true);
                            setChatUser(item);
                        }}>
                            <Image
                                source={{ uri: item.image }}
                                className="w-12 h-12 rounded-full mr-4"
                            />
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.name}</Text>
                                    {item.time ? (
                                        <Text className="text-gray-500 text-xs ml-2" numberOfLines={1}>{item.time}</Text>
                                    ) : null}
                                </View>
                                <Text className="text-gray-400 text-sm mt-0.5" numberOfLines={1}>
                                    {item.message}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </RefreshTab>
        </SafeAreaView>
    );
}
