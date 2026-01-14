import { Image, Text, TouchableOpacity, View, ScrollView, BackHandler } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from '@/constants/Theme';
import log from "@/utils/logger";
import { postAuth } from "@/utils/request";
import { useRouter } from "expo-router";
import { eventBus } from '@/utils/eventBus';

export default function EventNext({ postUri, goback, onSuccess, name, content, location, startTime, endTime, price, city, itemType = 'event' }: { postUri: string, goback: () => void, onSuccess?: () => void, name: string, content: string, location: any, startTime: Date, endTime: Date | null, price: string, city: string, itemType?: 'event' | 'hangout' }) {
    useEffect(() => {
        const onBackPress = () => {
            goback();
            return true;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [goback]);

    const router = useRouter();

    const handleUpload = async () => {
        if (postUri === "" || !postUri) {
            log.error("No photo selected");
            return;
        }
        const formData = new FormData();

        // If location comes from Nominatim (external), create it in backend first
        let locationId = location && (location._id || location.id);
        try {
            // Only create backend Location when the selected place originates from Nominatim (has raw data)
            if (locationId && typeof locationId === 'string' && locationId.startsWith('nominatim_') && location && location.raw) {
                const createPayload = {
                    name: location.name || location.address,
                    address: location.address || location.name,
                    description: location.description || location.address || location.name,
                };
                const router = useRouter();
                const createRes = await postAuth(router, '/createlocation', createPayload);
                if (createRes && createRes.status === 200 && createRes.location && createRes.location.id) {
                    locationId = createRes.location.id;
                }
            }
        } catch (err) {
            console.error('Error creating backend location:', err);
        }

        formData.append('name', name);
        formData.append('description', content);
        formData.append('location', locationId);
        if (city) formData.append('city', city);
        formData.append('type', itemType === 'hangout' ? 'hangout' : 'event');
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
        try {
            const res = await postAuth(router, '/createevent', formData, {
                'Content-Type': 'multipart/form-data',
            });

            if (res && res.status === 200) {
                log.info("Event uploaded successfully");
                try { eventBus.emit('eventCreated', {}); } catch (e) { console.error('emit eventCreated', e); }
                if (onSuccess) {
                    onSuccess();
                } else {
                    goback();
                }
            } else {
                log.error("Failed to upload event:", res ? res.message : 'no response');
                alertError(res ? res.message || JSON.stringify(res) : 'Upload failed');
            }
        } catch (err: any) {
            console.error('Upload exception:', err);
            alertError(err?.message || JSON.stringify(err));
        }
    }

    const alertError = (msg: string) => {
        try {
            // prefer native alert
            // @ts-ignore
            if (global && global.alert) global.alert(msg);
        } catch (e) {
            // fallback to console
            console.error('Alert failed:', e, msg);
        }
    }

    return (
        <View className="h-full bg-background">
            {/* Header */}
            <View className="border-b border-gray-700/50" style={{ backgroundColor: Theme.accent }}>
                <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity onPress={goback} className="p-2 -ml-2" activeOpacity={0.7}>
                            <Text className="text-white">Back</Text>
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold">Preview</Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleUpload}
                        className="bg-accent-500 px-4 py-2 rounded-full flex-row items-center gap-2"
                        style={{ backgroundColor: Theme.accent }}
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
                        {/* Price / Hangout bubble */}
                        {itemType === 'hangout' ? (
                            <Text className={`absolute top-4 right-4 font-bold px-3 py-2 rounded-full text-sm bg-blue-600 text-white`}>
                                Hangout
                            </Text>
                        ) : (
                            (price && price !== '0') ? (
                                <Text style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#FFFFFF' }} className={`font-bold px-3 py-2 rounded-full text-sm`}>
                                    <Text style={{ color: '#eb3678' }}>{`€${price}`}</Text>
                                </Text>
                            ) : null
                        )}
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

                        {/* City */}
                        <View className="bg-gray-900/50 rounded-xl px-4 py-3 mb-3 flex-row items-center gap-3">
                            <View className="bg-indigo-600/20 p-2 rounded-full">
                                <Ionicons name="globe-outline" size={20} color="#6366F1" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-400 text-xs mb-0.5">City</Text>
                                <Text className='text-white font-semibold'>{city || "Not specified"}</Text>
                            </View>
                        </View>

                        {/* Price (hide for hangouts) */}
                        {itemType !== 'hangout' && (
                            <View className="bg-gray-900/50 rounded-xl px-4 py-3 mb-3 flex-row items-center gap-3">
                                <View className="bg-yellow-600/20 p-2 rounded-full">
                                    <Ionicons name="pricetag" size={20} color="#EAB308" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs mb-0.5">Price</Text>
                                    <Text className='text-white font-semibold'>
                                        {price ? `€${price}` : "Free"}
                                    </Text>
                                </View>
                            </View>
                        )}

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

                        {/* End Time (only for events) */}
                        {itemType === 'event' && endTime && (
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