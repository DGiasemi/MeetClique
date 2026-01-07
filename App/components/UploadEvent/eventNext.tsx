import { Image, Text, TouchableOpacity, View, ScrollView, BackHandler } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import log from "@/utils/logger";
import { postAuth } from "@/utils/request";
import { useRouter } from "expo-router";

export default function EventNext({ postUri, goback, onSuccess, name, content, location, startTime, endTime, price }: { postUri: string, goback: () => void, onSuccess?: () => void, name: string, content: string, location: any, startTime: Date, endTime: Date | null, price: string }) {
    useEffect(() => {
        const onBackPress = () => {
            goback();
            return true;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [goback]);

    const handleUpload = async () => {
        if (postUri === "" || !postUri) {
            log.error("No photo selected");
            return;
        }
        const formData = new FormData();

        formData.append('name', name);
        formData.append('description', content);
        formData.append('location', location.id);
        formData.append('type', 'image');
        formData.append('startTime', startTime.toISOString());
        if (endTime) {
            formData.append('endTime', endTime.toISOString());
        }
        if (price) {
            formData.append('price', price);
        }
        formData.append('event', {
            uri: postUri,
            name: 'event.jpg',
            type: 'image/jpeg',
        } as any);
        const router = useRouter();
        const res = await postAuth(router, '/createevent', formData, {
            'Content-Type': 'multipart/form-data',
        });

        if (res.status === 200) {
            log.info("Event uploaded successfully");
            if (onSuccess) {
                onSuccess();
            } else {
                goback();
            }
        } else {
            log.error("Failed to upload event:", res.message);
        }
    }

    return (
        <View className="h-full bg-background">
            {/* Header */}
            <View className="border-b border-gray-700/50 bg-gray-800/30">
                <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity onPress={goback} className="p-2 -ml-2" activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold">Preview</Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleUpload}
                        className="bg-blue-600 px-4 py-2 rounded-full flex-row items-center gap-2"
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-bold text-sm">Post</Text>
                        <Ionicons name="cloud-upload-outline" size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
                {/* Event Card */}
                <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
                    {/* Event Image */}
                    <View className="relative">
                        <Image
                            source={{ uri: postUri }}
                            className="w-full aspect-[4/2]"
                        />
                        <View className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                    </View>

                    {/* Event Details */}
                    <View className="p-5">
                        {/* Event Name */}
                        <Text className='text-white text-2xl font-bold mb-4'>{name}</Text>

                        {/* Location */}
                        <View className="bg-gray-900/50 rounded-xl px-4 py-3 mb-3 flex-row items-center gap-3">
                            <View className="bg-purple-600/20 p-2 rounded-full">
                                <Ionicons name="location" size={20} color="#8B5CF6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-400 text-xs mb-0.5">Location</Text>
                                <Text className='text-white font-semibold'>{location?.name || "No location"}</Text>
                            </View>
                        </View>

                        {/* Price */}
                        <View className="bg-gray-900/50 rounded-xl px-4 py-3 mb-3 flex-row items-center gap-3">
                            <View className="bg-yellow-600/20 p-2 rounded-full">
                                <Ionicons name="pricetag" size={20} color="#EAB308" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-400 text-xs mb-0.5">Price</Text>
                                <Text className='text-white font-semibold'>
                                    {price ? `$${price}` : "Free"}
                                </Text>
                            </View>
                        </View>

                        {/* Start Time */}
                        <View className="bg-gray-900/50 rounded-xl px-4 py-3 mb-3 flex-row items-center gap-3">
                            <View className="bg-green-600/20 p-2 rounded-full">
                                <Ionicons name="play-circle" size={20} color="#10B981" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-400 text-xs mb-0.5">Starts</Text>
                                <Text className='text-white font-semibold'>
                                    {startTime.toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                        </View>

                        {/* End Time */}
                        {endTime && (
                            <View className="bg-gray-900/50 rounded-xl px-4 py-3 mb-3 flex-row items-center gap-3">
                                <View className="bg-red-600/20 p-2 rounded-full">
                                    <Ionicons name="stop-circle" size={20} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs mb-0.5">Ends</Text>
                                    <Text className='text-white font-semibold'>
                                        {endTime.toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Description */}
                        <View className="bg-gray-900/50 rounded-xl px-4 py-3">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
                                <Text className="text-gray-400 text-xs">Description</Text>
                            </View>
                            <Text className='text-white leading-6'>{content || "No description"}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}