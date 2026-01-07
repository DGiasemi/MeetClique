import { Animated, Image, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { deleteAuth } from "@/utils/request";
import { getAuth } from "@/utils/request";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Event({ event, showTop = true }: { event: any, showTop?: boolean }) {
    const router = useRouter();
    const [isDeleted, setIsDeleted] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isAttending, setIsAttending] = useState(false);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');
                const userId = storedData.id;
                setCurrentUserId(userId);
                setIsAttending(event?.attendees?.includes(userId) || false);
            } catch (error) {
                console.log("Error fetching user ID:", error);
            }
        };
        fetchUserId();
    }, [event]);

    // Helper function to get the actual user ID (handles both string and object formats)
    const getEventUserId = () => {
        if (!event?.userID) return null;
        return typeof event.userID === 'object' ? event.userID._id : event.userID;
    };

    const getTimeUntilEvent = () => {
        if (!event?.startTime) return null;

        const now = new Date();
        const startTime = new Date(event.startTime);
        const endTime = event?.endTime ? new Date(event.endTime) : null;

        // Check if event is live
        if (endTime && now >= startTime && now <= endTime) {
            return "Live Now";
        }

        // Check if event has passed
        if (now > startTime) {
            const diffMs = now.getTime() - startTime.getTime();
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            return "Just now";
        }

        // Event is in the future
        const diffMs = startTime.getTime() - now.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return "Starting soon";
    };

    if (isDeleted) return null;

    const timeUntilEvent = getTimeUntilEvent();

    const handleEventPress = () => {
        router.push({
            pathname: '/tabs/(tabs)/eventDetails',
            params: { eventId: event.id }
        });
    };

    const handleHostPress = async (e: any) => {
        // stop propagation to avoid opening event details
        e && e.stopPropagation && e.stopPropagation();
        try {
            const userId = typeof event.userID === 'object' ? event.userID._id : event.userID;
            const res = await getAuth(router, '/getchat?memberId=' + userId);
            // navigate to chats page and open the chat via query param
            router.push({ pathname: '/tabs/(tabs)/chats', params: { openMemberId: userId } });
        } catch (err) {
            console.error('Error opening chat for host:', err);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleEventPress}
            activeOpacity={0.8}
            className='w-full mb-4'
        >
            <View className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl">
                {showTop && (
                    <View className="px-4 pt-4 pb-2">
                        <View className="flex-col gap-1">
                            <Text className='text-xl font-bold text-white' numberOfLines={1}>{event?.name}</Text>
                            <View className="flex-row items-center gap-1.5">
                                <Ionicons name="location" size={14} color="#9CA3AF" />
                                <Text className='text-sm text-gray-400' numberOfLines={1}>
                                    {event?.location?.name ? (event.city ? `${event.location.name}, ${event.city}` : event.location.name) : (event?.city || 'Location not specified')}
                                </Text>
                            </View>
                            {/* Host tag hidden in preview; shown in details only */}
                        </View>
                    </View>
                )}

                <View className="relative">
                    <Image
                        source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/geteventimage?id=${event?.id}` }}
                        className='w-full aspect-[4/2]'
                    />
                    {/* Gradient overlay for better text visibility */}
                    <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Price / Hangout badge */}
                    <View className="absolute top-3 right-3">
                        {event?.type === 'hangout' ? (
                            <View className="px-2 py-1">
                                <Text className="text-white font-bold text-sm">Hangout</Text>
                            </View>
                        ) : (
                            <View className={`px-3 py-1.5 rounded-full shadow-lg ${event?.price === 0 ? "bg-yellow-400" : "bg-emerald-500"}`}>
                                <Text className="text-black font-bold text-sm">
                                    {event?.price === 0 ? "FREE" : `$${event?.price}`}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Time badge */}
                    {timeUntilEvent && (
                        <View className="absolute bottom-3 left-3">
                            <View className={`px-3 py-1.5 rounded-full backdrop-blur-sm ${timeUntilEvent === "Live Now"
                                ? "bg-green-500/90"
                                : timeUntilEvent.includes("ago")
                                    ? "bg-gray-600/90"
                                    : "bg-blue-500/90"
                                }`}>
                                <View className="flex-row items-center gap-1.5">
                                    {timeUntilEvent === "Live Now" && (
                                        <View className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    )}
                                    <Text className="text-white font-semibold text-xs">
                                        {timeUntilEvent}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Attending/Owner badge */}
                    {(isAttending || event?.userID === currentUserId) && (
                        <View className="absolute bottom-3 right-3">
                            <View className={`px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg ${getEventUserId() === currentUserId ? 'bg-yellow-500/90' : 'bg-purple-600/90'
                                }`}>
                                <View className="flex-row items-center gap-1.5">
                                    <Ionicons
                                        name={getEventUserId() === currentUserId ? "star" : "checkmark-circle"}
                                        size={14}
                                        color="white"
                                    />
                                    <Text className="text-white font-semibold text-xs">
                                        {getEventUserId() === currentUserId ? "Your Event" : "You're Attending"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Description */}
                <View className="px-4 py-3">
                    <Text className="text-gray-300 text-sm leading-5" numberOfLines={3}>
                        {event?.description}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
