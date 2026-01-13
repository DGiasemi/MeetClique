import { Image, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { URLS } from "@/constants/API";

export default function Group({ group, showTop = true }: { group: any, showTop?: boolean }) {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isMember, setIsMember] = useState(false);
    
    useEffect(() => {
        console.log('API URL from URLS:', URLS.api);
    }, []);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');
                const userId = storedData.id;
                setCurrentUserId(userId);
                setIsMember(group?.members?.includes(userId) || false);
                if (group?.imageUrl) {
                    console.log('Group image URL:', `${URLS.api}/getgroupimage?id=${group._id}`);
                    console.log('Group imageUrl field:', group.imageUrl);
                }
            } catch (error) {
                console.log("Error fetching user ID:", error);
            }
        };
        fetchUserId();
    }, [group]);

    const getCategoryColor = (category: string) => {
        const purple = '#8b5cf6';
        return purple;
    };

    const getLastActivityTime = () => {
        let lastTime = new Date(group.createdAt);

        if (group.comments && group.comments.length > 0) {
            const lastComment = group.comments[group.comments.length - 1];
            const commentTime = new Date(lastComment.editedAt || lastComment.createdAt);
            if (commentTime > lastTime) {
                lastTime = commentTime;
            }
        }

        const now = new Date();
        const diffMs = now.getTime() - lastTime.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) {
            return `${diffDays}d ago`;
        } else if (diffHours > 0) {
            return `${diffHours}h ago`;
        } else {
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${diffMinutes}m ago`;
        }
    };

    return (
        <TouchableOpacity
            onPress={() => router.push(`/tabs/groupDetails?id=${group._id}`)}
            className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden active:opacity-75"
            activeOpacity={0.7}
        >
            {/* Header with image */}
            {group.imageUrl && (
                <View className="h-40 bg-gray-900 relative">
                    <Image
                        source={{ uri: `${URLS.api}/getgroupimage?id=${group._id}` }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/80" />
                </View>
            )}

            {/* Content */}
            <View className="p-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-2">
                        <Text className="text-white text-lg font-bold" numberOfLines={2}>
                            {group.name}
                        </Text>
                    </View>
                    {showTop && isMember && (
                        <View className="bg-emerald-600/20 px-2 py-1 rounded-full">
                            <Text className="text-emerald-400 text-xs font-semibold">Member</Text>
                        </View>
                    )}
                </View>

                <Text className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {group.description}
                </Text>

                <View className="flex-row items-center gap-3 mb-3">
                    <View className="flex-row items-center gap-1">
                        <View
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: getCategoryColor(group.category) + '20' }}
                        >
                            <Text
                                className="text-xs font-semibold"
                                style={{ color: getCategoryColor(group.category) }}
                            >
                                {group.category}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="flex-row justify-between items-center pt-3 border-t border-gray-700/50">
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="location" size={14} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs">{group.city}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="people" size={14} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs">{group.membersCount || 0}</Text>
                        </View>
                    </View>
                    <Text className="text-gray-500 text-xs">{getLastActivityTime()}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
