import { BackHandler, KeyboardAvoidingView, Text, TouchableOpacity, View, SafeAreaView, Animated, Platform, Image, Modal } from 'react-native';
import { FlatList, TextInput } from 'react-native-gesture-handler';
import React, { useCallback, useEffect, useRef } from 'react';
import { getAuth, postAuth } from '@/utils/request';
import { useFocusEffect, useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Profile from '../Profile/profile';
import log from '@/utils/logger';
import { Theme } from '@/constants/Theme';
import { TabBarVisibilityContext } from '@/app/tabs/(tabs)/_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { socketService } from '@/utils/socketService';

interface ChatProps {
    user: {
        name: string;
        id?: string; // other user ID
        chatId?: string;
    };
    onExit?: () => void;
}

export default function Chat({ user, onExit }: ChatProps) {
    const [message, setMessage] = React.useState<string>("");
    const [messages, setMessages] = React.useState<any[]>([]);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState(false);
    const [isBlocked, setIsBlocked] = React.useState<boolean>(false);
    const [isUserReported, setIsUserReported] = React.useState<boolean>(false);
    const [storedData, setStoredData] = React.useState<any>({});
    const [previousMessageGroupId, setPreviousMessageGroupId] = React.useState<string | null>(null);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [currentChatId, setCurrentChatId] = React.useState<string | undefined>(user.chatId);

    const { setVisible: setNavBarVisible } = React.useContext(TabBarVisibilityContext);
    const flatListRef = React.useRef<FlatList>(null);
    const sendButtonScale = useRef(new Animated.Value(1)).current;

    const router = useRouter();

    const sendMessage = async () => {
        if (isBlocked) {
            log.warn('Cannot send message: user is blocked');
            return;
        }
        if (message.trim() === "") {
            log.warn("Attempted to send an empty message");
            return;
        }

        // Animate send button
        Animated.sequence([
            Animated.timing(sendButtonScale, {
                toValue: 0.85,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(sendButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        await postAuth(router, '/sendmessage', {
            chatID: user.chatId,
            content: message
        }).then((response) => {
            if (response.status === 200) {
                log.info("Message sent successfully");
            } else {
                log.error("Failed to send message:", response.status, response.data);
            }
            setMessages([{
                content: message,
                senderId: storedData.id,
                timestamp: new Date().toISOString()
            }, ...messages]);
        }).catch((error) => {
            log.error("Error sending message:", error);
        })
        setMessage("");
    }

    const fetchPreviousMessages = async (groupID: string | null) => {
        if (!groupID) {
            return;
        }
        if (loadingMore) return;
        setLoadingMore(true);
        const previousMessages = await getAuth(router, '/getmessagegroup?chatID=' + user.chatId + '&groupID=' + groupID);
        if (previousMessages.status === 200) {
            setMessages(prev => [...prev, ...previousMessages.result.messages.reverse()]);
            setPreviousMessageGroupId(previousMessages.result.previousMessageGroupId || null);
        } else {
            log.error("Failed to fetch previous messages:", previousMessages.status, previousMessages.message);
        }
        setLoadingMore(false);
    }

    useEffect(() => {
        setNavBarVisible(false);
        const fetchData = async () => {
            const data = await getAuth(router, '/getchat?' + (user.chatId ? 'chatId=' + user.chatId : 'memberId=' + user.id));
            if (!data) {
                console.error('Failed to fetch chat data');
                return;
            }
            if (data._id) {
                setCurrentChatId(data._id);
            }
            setPreviousMessageGroupId(data.messages.previousMessageGroupId || null);
            setStoredData(JSON.parse(await AsyncStorage.getItem('userData') || '{}'));
            setMessages(data.messages.messages.reverse() || []);
            await fetchPreviousMessages(data.messages.previousMessageGroupId || null);
        }

        fetchData();
        return () => setNavBarVisible(true);
    }, []);
        useEffect(() => {
        if (!currentChatId) return;

        const handleNewMessage = (data: any) => {
            if (data.chatId === currentChatId) {
                setMessages((prevMessages) => [data.message, ...prevMessages]);
            }
        };

        socketService.on('newMessage', handleNewMessage);

        return () => {
            socketService.off('newMessage', handleNewMessage);
        };
    }, [currentChatId]);

    useFocusEffect(
        useCallback(() => {
            const backPress = () => {
                if (isProfileOpen) {
                    setIsProfileOpen(false);
                    return true;
                }
                return false;
            };
            const backhandler = BackHandler.addEventListener('hardwareBackPress', backPress);

            return () => {
                backhandler.remove();
            };
        }, [isProfileOpen])
    );

    if (isProfileOpen) {
        return (
            <Profile
                userId={user.id}
                onBack={() => setIsProfileOpen(false)}
            />
        );
    }

    // Helper function to determine if we should show profile picture
    const shouldShowProfilePic = (currentIndex: number): boolean => {
        if (currentIndex === messages.length - 1) return true; // Always show on last (oldest) message

        const currentMsg = messages[currentIndex];
        const nextMsg = messages[currentIndex + 1];

        // Don't show profile pic for own messages
        if (currentMsg.senderId === storedData.id) return false;

        // Show if next message is from different sender
        if (nextMsg.senderId !== currentMsg.senderId) return true;

        // Show if time gap is more than 3 minutes
        const currentTime = new Date(currentMsg.timestamp).getTime();
        const nextTime = new Date(nextMsg.timestamp).getTime();
        const timeDiff = Math.abs(currentTime - nextTime) / 1000 / 60; // in minutes

        return timeDiff > 3;
    };

    const MessageBubble = ({ item, index }: { item: any; index: number }) => {
        const isOwn = item.senderId === storedData.id;
        const showProfilePic = shouldShowProfilePic(index);
        const fadeAnim = useRef(new Animated.Value(0)).current;
        const slideAnim = useRef(new Animated.Value(20)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    marginBottom: showProfilePic ? 12 : 2,
                    alignItems: 'flex-end',
                }}
            >
                {/* Profile Picture - only for received messages */}
                {!isOwn && (
                    <View style={{ width: 32, marginRight: 8, alignItems: 'center' }}>
                        {showProfilePic ? (
                            <Animated.View style={{ opacity: fadeAnim }}>
                                <Image
                                    source={{
                                        uri: `${process.env.EXPO_PUBLIC_API_URL}/getprofilepic?id=${user.id}&t=${Date.now()}`
                                    }}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        borderWidth: 2,
                                        borderColor: 'rgba(59, 130, 246, 0.3)',
                                    }}
                                />
                            </Animated.View>
                        ) : (
                            <View style={{ width: 32, height: 32 }} />
                        )}
                    </View>
                )}

                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        flex: 1,
                    }}
                >
                    {isOwn ? (
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderRadius: 20,
                                borderBottomRightRadius: 4,
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 3,
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 15, lineHeight: 20 }}>
                                {item.content}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 }}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </Text>
                        </LinearGradient>
                    ) : (
                        <View
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderRadius: 20,
                                borderBottomLeftRadius: 4,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 15, lineHeight: 20 }}>
                                {item.content}
                            </Text>
                            <Text style={{ color: 'rgba(156, 163, 175, 1)', fontSize: 10, marginTop: 4 }}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </View>
        );
    };

    return (
        <SafeAreaView className="h-full bg-background">
            {/* Enhanced Header */}
            <LinearGradient
                colors={['rgba(30, 30, 40, 0.95)', 'rgba(20, 20, 30, 0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        style={{ padding: 8, marginLeft: -8 }}
                        onPress={() => onExit && onExit()}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="chevron-back" size={28} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flex: 1, paddingHorizontal: 8 }}
                        onPress={() => { setIsProfileOpen(true); }}
                    >
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>
                            {user.name}
                        </Text>
                        <Text style={{ color: 'rgba(156, 163, 175, 1)', fontSize: 12, textAlign: 'center', marginTop: 2 }}>
                            Tap to view profile
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ padding: 8, marginRight: -8 }}
                        onPress={() => { setShowMenu(true); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="ellipsis-vertical" size={22} color="rgba(156, 163, 175, 1)" />
                    </TouchableOpacity>
                    {/* Menu modal */}
                    <Modal transparent visible={showMenu} animationType="fade">
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            activeOpacity={1}
                            onPress={() => setShowMenu(false)}
                        >
                            <View style={{ position: 'absolute', right: 12, top: 64 }}>
                                <View style={{ backgroundColor: 'rgba(30,30,40,0.98)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowMenu(false);
                                            setIsProfileOpen(true);
                                        }}
                                        style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                                    >
                                        <Text style={{ color: 'white' }}>View profile</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setShowMenu(false);
                                            const blockNow = !isBlocked;
                                            try {
                                                const res = await postAuth(router, '/blockuser', { targetId: user.id, block: blockNow });
                                                if (res && res.status === 200) {
                                                    setIsBlocked(blockNow);
                                                } else {
                                                    log.error('Failed to update block state', res);
                                                }
                                            } catch (e) {
                                                log.error('Block API error', e);
                                            }
                                        }}
                                        style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' }}
                                    >
                                        <Text style={{ color: 'white' }}>{isBlocked ? 'Unblock user' : 'Block user'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setShowMenu(false);
                                            if (isUserReported) return;
                                            try {
                                                const res = await postAuth(router, '/reportuser', { targetId: user.id, reason: 'inappropriate', details: '' });
                                                if (res && res.status === 200) {
                                                    setIsUserReported(true);
                                                } else {
                                                    log.error('Failed to report user', res);
                                                }
                                            } catch (e) {
                                                log.error('Report API error', e);
                                            }
                                        }}
                                        disabled={isUserReported}
                                        style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', opacity: isUserReported ? 0.6 : 1 }}
                                    >
                                        <Text style={{ color: 'white' }}>{isUserReported ? 'Reported' : 'Report'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>
            </LinearGradient>

            {/* Blocked banner */}
            {isBlocked && (
                <View style={{ backgroundColor: 'rgba(239,68,68,0.08)', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(239,68,68,0.18)' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.95)', flex: 1, marginRight: 8 }}>This user is blocked. Messages are disabled.</Text>
                        <TouchableOpacity onPress={() => setIsBlocked(false)} style={{ paddingHorizontal: 8, paddingVertical: 4, minWidth: 72, alignItems: 'center' }}>
                            <Text style={{ color: Theme.primary, fontWeight: '600' }}>Unblock</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View className='flex-1 justify-end items-left h-full px-4'>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={90}
                    className="flex-1"
                >
                    <View className="flex-1">
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item, index) => index.toString()}
                            onEndReached={() => fetchPreviousMessages(previousMessageGroupId)}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: 16 }}
                            inverted={true}
                            renderItem={({ item, index }) => <MessageBubble item={item} index={index} />}
                        />
                    </View>

                    {/* Enhanced Input Area */}
                    <View
                        style={{
                            backgroundColor: 'rgba(30, 30, 40, 0.6)',
                            borderRadius: 28,
                            paddingHorizontal: 6,
                            paddingVertical: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        <TextInput
                            style={{
                                color: 'white',
                                flex: 1,
                                height: 44,
                                fontSize: 16,
                                paddingHorizontal: 16,
                            }}
                            placeholder="Type a message..."
                            placeholderTextColor="rgba(156, 163, 175, 0.8)"
                            value={message}
                            onChangeText={(text) => {
                                setMessage(text);
                            }}
                            onSubmitEditing={sendMessage}
                            multiline={false}
                        />
                        <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                            <TouchableOpacity
                                onPress={sendMessage}
                                disabled={message.trim().length === 0 || isBlocked}
                                style={{
                                    opacity: (message.trim().length === 0 || isBlocked) ? 0.4 : 1,
                                }}
                            >
                                <LinearGradient
                                    colors={['#3b82f6', '#2563eb']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        shadowColor: '#3b82f6',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 6,
                                        elevation: 4,
                                    }}
                                >
                                    <Ionicons name="send" size={20} color="white" style={{ marginLeft: 2 }} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView >
    );
}