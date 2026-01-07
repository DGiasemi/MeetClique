import { Image, Text, TouchableOpacity, View, ScrollView, Animated } from "react-native";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { getAuth, postAuth } from "@/utils/request";
import { useRouter } from "expo-router";
import * as Location from 'expo-location';

export default function AddLocation({
    setLocation,
    goback,
}: {
    setLocation: (location: any) => void;
    goback: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionShort, setDescriptionShort] = useState("");
    const [address, setAddress] = useState("");
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onSave = async () => {
        const payload = {
            name,
            address,
            description,
        };

        try {
            const res = await postAuth(router, "/createlocation", payload);
            if (res.status !== 200) {
                console.log("Failed to create location", res.status);
                return;
            }
        } catch (err) {
            // handle error if needed
        }

        setLocation(payload);
    };

    const types = ["Cafe", "Home", "Restaurant", "Bar", "Other"] as const;

    return (
        <View className="h-full bg-background">
            {/* Header with gradient accent */}
            <LinearGradient
                colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
                className="absolute top-0 left-0 right-0 h-32"
            />

            <View className="flex-row justify-between items-center py-4 px-4 pt-6">
                <TouchableOpacity
                    onPress={goback}
                    className="w-10 h-10 rounded-full bg-gray-800/80 items-center justify-center"
                    style={{ elevation: 2 }}
                >
                    <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="flex-1 items-center">
                    <Text className="text-white text-2xl font-bold">Add Location</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">Create a new place</Text>
                </View>

                <TouchableOpacity
                    onPress={onSave}
                    disabled={!name.trim()}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{
                        backgroundColor: !name.trim() ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 1)',
                        elevation: !name.trim() ? 0 : 4,
                    }}
                >
                    <Ionicons
                        name="checkmark"
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>
            </View>

            <Animated.View
                style={{
                    flex: 1,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20, paddingTop: 8 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Location Name Input */}
                    <View className="w-full mb-5">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="location" size={16} color="#8B5CF6" />
                            <Text className="text-gray-300 text-sm font-semibold ml-2">Location Name</Text>
                            <Text className="text-red-400 ml-1">*</Text>
                        </View>
                        <View
                            className="rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: focusedField === 'name' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(31, 41, 55, 0.6)',
                                borderWidth: 2,
                                borderColor: focusedField === 'name' ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
                            }}
                        >
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="text-white p-4 text-base"
                                placeholder="e.g., Central Park Cafe"
                                placeholderTextColor="#6B7280"
                            />
                        </View>
                    </View>

                    {/* Address Input */}
                    <View className="w-full mb-5">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="navigate" size={16} color="#8B5CF6" />
                            <Text className="text-gray-300 text-sm font-semibold ml-2">Address</Text>
                        </View>
                        <View
                            className="rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: focusedField === 'address' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(31, 41, 55, 0.6)',
                                borderWidth: 2,
                                borderColor: focusedField === 'address' ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
                            }}
                        >
                            <TextInput
                                value={address}
                                onChangeText={setAddress}
                                onFocus={() => setFocusedField('address')}
                                onBlur={() => setFocusedField(null)}
                                className="text-white p-4 text-base"
                                placeholder="123 Main Street, City"
                                placeholderTextColor="#6B7280"
                            />
                        </View>
                    </View>

                    {/* Description Input */}
                    <View className="w-full mb-5">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="document-text" size={16} color="#8B5CF6" />
                            <Text className="text-gray-300 text-sm font-semibold ml-2">Description</Text>
                            <Text className="text-gray-500 text-xs ml-2">(Optional)</Text>
                        </View>
                        <View
                            className="rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: focusedField === 'description' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(31, 41, 55, 0.6)',
                                borderWidth: 2,
                                borderColor: focusedField === 'description' ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
                            }}
                        >
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                onFocus={() => setFocusedField('description')}
                                onBlur={() => setFocusedField(null)}
                                className="text-white p-4 text-base"
                                style={{ minHeight: 100, textAlignVertical: 'top' }}
                                placeholder="Tell us more about this place..."
                                placeholderTextColor="#6B7280"
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </View>

                    {/* Info Card */}
                    <View className="bg-purple-900/20 rounded-2xl p-4 flex-row items-start border border-purple-500/30">
                        <Ionicons name="information-circle" size={20} color="#A78BFA" />
                        <Text className="text-gray-300 text-xs ml-3 flex-1 leading-5">
                            This location will be saved and can be used for events, moments, and posts. Make sure the name is descriptive!
                        </Text>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
}