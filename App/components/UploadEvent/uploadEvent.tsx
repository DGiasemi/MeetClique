import { Image, Text, TouchableOpacity, View, ScrollView, Alert, Platform } from "react-native";
import { useState } from "react";

import EventNext from "./eventNext";
import { TextInput } from "react-native-gesture-handler";
import SearchLocation from "../Location/searchLocation";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { postAuth, putAuth } from "@/utils/request";
import { useRouter } from "expo-router";

export default function UploadEvent({ editEvent, onUpdateSuccess, onCancel }: { editEvent?: any, onUpdateSuccess?: () => void, onCancel?: () => void }) {
    const [postUri, setPostUri] = useState<any>(editEvent ? `${process.env.EXPO_PUBLIC_API_URL}/geteventimage?id=${editEvent.id}` : null);
    const [content, setContent] = useState<string>(editEvent?.description || '');
    const [eventName, setEventName] = useState<string>(editEvent?.name || '');
    const [price, setPrice] = useState<string>(editEvent?.price ? editEvent.price.toString() : '');
    const [location, setLocation] = useState<any>(editEvent?.location || null);
    const [searchingLocation, setSearchingLocation] = useState<boolean>(false);
    const [startTime, setStartTime] = useState<Date>(editEvent?.startTime ? new Date(editEvent.startTime) : new Date());
    const [endTime, setEndTime] = useState<Date | null>(editEvent?.endTime ? new Date(editEvent.endTime) : null);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
    const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [nextStep, setNextStep] = useState(false);
    const router = useRouter();

    const handleImageUpload = async () => {
        // Request media library permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 2],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setPostUri(result.assets[0].uri);
        }
    }

    const handleUpload = async () => {
        if (!postUri) {
            Alert.alert('No photo selected', 'Please select a photo before uploading.');
            return;
        }

        if (!eventName) {
            Alert.alert('No event name', 'Please enter an event name before uploading.');
            return;
        }

        if (!content) {
            Alert.alert('No description', 'Please enter a description before uploading.');
            return;
        }

        if (!location) {
            Alert.alert('No location', 'Please select a location before uploading.');
            return;
        }

        if (!startTime) {
            Alert.alert('No start time', 'Please select a start time before uploading.');
            return;
        }

        if (editEvent) {
            handleUpdateEvent();
        } else {
            setNextStep(true);
        }
    }

    const handleUpdateEvent = async () => {
        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('eventId', editEvent.id);
            formData.append('name', eventName);
            formData.append('description', content);

            // Only append location if it's an object with ID (checking if it changed or is original)
            // If location is the original populated object, use its _id
            if (location && location._id) {
                formData.append('location', location._id);
            } else if (location && location.id) {
                formData.append('location', location.id);
            }

            formData.append('startTime', startTime.toISOString());
            if (endTime) {
                formData.append('endTime', endTime.toISOString());
            }

            if (price) {
                formData.append('price', price);
            }


            if (postUri && !postUri.startsWith('http')) {
                formData.append('event', {
                    uri: postUri,
                    name: 'event.jpg',
                    type: 'image/jpeg',
                } as any);
            }

            const response = await putAuth(router, '/updateevent', formData, {
                'Content-Type': 'multipart/form-data',
            });

            if (response.status === 200) {
                Alert.alert("Success", "Event updated successfully!");
                if (onUpdateSuccess) onUpdateSuccess();
            } else {
                Alert.alert("Error", response.message || "Failed to update event");
            }
        } catch (error) {
            console.error("Error updating event:", error);
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setIsUpdating(false);
        }
    }

    const handleSuccess = () => {
        setPostUri(null);
        setContent('');
        setEventName('');
        setPrice('');
        setLocation(null);
        setSearchingLocation(false);
        setStartTime(new Date());
        setEndTime(null);
        setNextStep(false);
        router.push('/tabs');
    }

    if (nextStep) {
        return (
            <EventNext
                postUri={postUri}
                onSuccess={handleSuccess}
                goback={() => setNextStep(false)}
                content={content}
                name={eventName}
                location={location}
                startTime={startTime}
                endTime={endTime}
                price={price}
            />
        );
    }

    if (searchingLocation) {
        return (
            <SearchLocation
                setLocation={(loc: any) => {
                    setLocation(loc);
                    setSearchingLocation(false);
                }}
                goback={() => setSearchingLocation(false)}
            />
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="border-b border-gray-700/50 bg-gray-800/30">
                <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
                    <View className="flex-row items-center gap-3">
                        <View className="bg-blue-600/20 p-2 rounded-full">
                            <Ionicons name={editEvent ? "create-outline" : "calendar-outline"} size={24} color="#3B82F6" />
                        </View>
                        <Text className="text-white text-xl font-bold">{editEvent ? "Edit" : "Create"}</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            onPress={handleUpload}
                            className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${isUpdating ? 'bg-gray-600' : 'bg-blue-600'}`}
                            disabled={isUpdating}
                        >
                            <Text className="text-white font-bold text-sm">
                                {isUpdating ? "Saving..." : (editEvent ? "Update" : "Preview")}
                            </Text>
                            {!isUpdating && <Ionicons name={editEvent ? "checkmark" : "arrow-forward"} size={16} color="white" />}
                        </TouchableOpacity>
                        {editEvent && (
                            <TouchableOpacity onPress={onCancel}>
                                <Ionicons name="close-circle" size={30} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 80 }}>
                <View className='w-full'>
                    {/* Event Name */}
                    <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Ionicons name="text-outline" size={18} color="#3B82F6" />
                            <Text className="text-gray-300 text-sm font-semibold">Event Name *</Text>
                        </View>
                        <TextInput
                            className="w-full text-white text-base px-0 py-1"
                            value={eventName}
                            onChangeText={setEventName}
                            placeholder="Enter event name"
                            placeholderTextColor="#6B7280"
                        />
                    </View>

                    {/* Image Upload */}
                    <View className='w-full mb-4'>
                        <View className="flex-row items-center gap-2 mb-3 px-1">
                            <Ionicons name="image-outline" size={18} color="#3B82F6" />
                            <Text className="text-gray-300 text-sm font-semibold">Event Image *</Text>
                        </View>
                        {postUri && (
                            <TouchableOpacity className="w-full" onPress={handleImageUpload} activeOpacity={0.8}>
                                <View className="relative rounded-2xl overflow-hidden border-2 border-blue-500/30">
                                    <Image source={typeof postUri === 'string' ? { uri: postUri } : postUri} className='w-full aspect-[4/2]' />
                                    <View className="absolute inset-0 bg-black/20" />
                                    <View className="absolute top-3 right-3 bg-blue-600 p-2 rounded-full">
                                        <Ionicons name="pencil" size={16} color="white" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                        {!postUri && (
                            <TouchableOpacity
                                className='w-full h-48 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center'
                                onPress={handleImageUpload}
                                activeOpacity={0.7}
                            >
                                <View className="bg-blue-600/20 p-4 rounded-full mb-3">
                                    <Ionicons name="cloud-upload-outline" size={40} color="#3B82F6" />
                                </View>
                                <Text className="text-white text-base font-semibold">Upload Event Image</Text>
                                <Text className="text-gray-400 text-sm mt-1">Tap to select from gallery</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Price in USD */}
                    <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Ionicons name="pricetag-outline" size={18} color="#10B981" />
                            <Text className="text-gray-300 text-sm font-semibold">Price (USD)</Text>
                        </View>
                        <TextInput
                            className="w-full text-white text-base px-0 py-1"
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Description */}
                    <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
                            <Text className="text-gray-300 text-sm font-semibold">Description *</Text>
                        </View>
                        <TextInput
                            className="w-full text-white text-base px-0 py-1 min-h-[80px]"
                            value={content}
                            onChangeText={setContent}
                            placeholder="Describe your event..."
                            placeholderTextColor="#6B7280"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Start Time */}
                    <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Ionicons name="calendar-outline" size={18} color="#10B981" />
                            <Text className="text-gray-300 text-sm font-semibold">Start Time *</Text>
                        </View>
                        <TouchableOpacity
                            className="w-full bg-gray-900/50 px-4 py-3 rounded-xl flex-row items-center gap-3"
                            onPress={() => setShowStartPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="time-outline" size={20} color="#10B981" />
                            <Text className='text-white text-base'>
                                {startTime.toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </TouchableOpacity>
                        {showStartPicker && (
                            Platform.OS === 'ios' ? (
                                <DateTimePicker
                                    value={startTime}
                                    mode="datetime"

                                    display='default'
                                    onChange={(_event: any, selectedDate?: Date) => {
                                        setShowStartPicker(false);
                                        if (selectedDate) {
                                            setStartTime(selectedDate);
                                        }
                                    }}
                                />
                            ) : (
                                <>
                                    {showDatePicker ? (
                                        <DateTimePicker
                                            value={startTime}
                                            mode="date"
                                            display="default"
                                            onChange={(_event: any, selectedDate?: Date) => {
                                                setShowDatePicker(false);
                                                if (selectedDate) {
                                                    setStartTime(selectedDate);
                                                }
                                            }}
                                            style={{ width: "100%" }}
                                        />
                                    ) : (
                                        <DateTimePicker
                                            value={startTime}
                                            mode="time"
                                            display="default"
                                            onChange={(_event: any, selectedDate?: Date) => {
                                                setShowStartPicker(false);
                                                setShowDatePicker(true);
                                                if (selectedDate) {
                                                    setStartTime(selectedDate);
                                                }
                                            }}
                                            style={{ width: "100%" }}
                                        />
                                    )}
                                </>
                            )
                        )}
                    </View>

                    {/* End Time */}
                    <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Ionicons name="calendar-outline" size={18} color="#EF4444" />
                            <Text className="text-gray-300 text-sm font-semibold">End Time (Optional)</Text>
                        </View>
                        <TouchableOpacity
                            className="w-full bg-gray-900/50 px-4 py-3 rounded-xl flex-row items-center gap-3"
                            onPress={() => setShowEndPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="time-outline" size={20} color="#EF4444" />
                            <Text className='text-white text-base'>
                                {endTime
                                    ? endTime.toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })
                                    : 'No end time set'
                                }
                            </Text>
                        </TouchableOpacity>
                        {showEndPicker && (
                            Platform.OS === 'ios' ? (
                                <DateTimePicker
                                    value={endTime || new Date()}
                                    mode="datetime"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(_event: any, selectedDate?: Date) => {
                                        setShowEndPicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setEndTime(selectedDate);
                                        }
                                    }}
                                />
                            ) : (
                                <>
                                    {showDatePicker ? (
                                        <DateTimePicker
                                            value={endTime || new Date()}
                                            mode="date"
                                            display="default"
                                            onChange={(_event: any, selectedDate?: Date) => {
                                                setShowDatePicker(false);
                                                if (selectedDate) {
                                                    setEndTime(selectedDate);
                                                }
                                            }}
                                            style={{ width: "100%" }}
                                        />
                                    ) : (
                                        <DateTimePicker
                                            value={endTime || new Date()}
                                            mode="time"
                                            display="default"
                                            onChange={(_event: any, selectedDate?: Date) => {
                                                setShowEndPicker(false);
                                                setShowDatePicker(true);
                                                if (selectedDate) {
                                                    setEndTime(selectedDate);
                                                }
                                            }}
                                            style={{ width: "100%" }}
                                        />
                                    )}
                                </>
                            )
                        )}
                    </View>

                    {/* Location */}
                    <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3">
                        <View className="flex-row items-center gap-2 mb-2">
                            <Ionicons name="location-outline" size={18} color="#8B5CF6" />
                            <Text className="text-gray-300 text-sm font-semibold">Location *</Text>
                        </View>
                        <TouchableOpacity
                            className="w-full bg-gray-900/50 px-4 py-3 rounded-xl flex-row items-center justify-between"
                            onPress={() => setSearchingLocation(true)}
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="pin" size={20} color="#8B5CF6" />
                                <Text className='text-white text-base'>{location?.name || 'Select location'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

        </View>
    );
}