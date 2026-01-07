import { BackHandler, Image, KeyboardAvoidingView, Text, TextInput, ToastAndroid, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { launchImageLibraryAsync } from "expo-image-picker";
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { TabBarVisibilityContext } from "@/app/tabs/(tabs)/_layout";

const EditProfile = (
    props: {
        pictureUri?: string;
        name?: string;
        username?: string;
        onSave?: (name: string, username: string, saved: boolean) => void;
        uploadPicture?: (uri: string) => void;
    }
) => {

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                props.onSave && props.onSave("", "", false);
                return true;
            };

            const backhandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                backhandler.remove();
            };
        }, [props.onSave])
    );

    const [name, setName] = useState(props.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [username, setUsername] = useState(props.username || "");

    const { setVisible: setNavBarVisible } = React.useContext(TabBarVisibilityContext);

    useEffect(() => {
        setNavBarVisible(false);
        return () => setNavBarVisible(true);
    }, []);

    return (
        <View className="h-full bg-background p-4">
            <KeyboardAvoidingView
                behavior="padding"
                keyboardVerticalOffset={80}
                className="flex-1"
            >
                <View className="flex-row justify-between z-10 bg-background items-center">
                    <TouchableOpacity className="flex-1 basis-0 text-start" onPress={() => props.onSave && props.onSave("", "", false)}>
                        <Text className="text-2xl font-bold">
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </Text>
                    </TouchableOpacity>
                    <Text className="text-white text-2xl font-bold flex-1 basis-0 text-center">Edit Profile</Text>
                    <TouchableOpacity className="flex-1 basis-0 items-end" onPress={() => {
                        if (props.onSave && !isSaving) {
                            setIsSaving(true);
                            props.onSave(name, username, true);
                        }
                    }}>
                        <Text className={(isSaving ? "text-gray-500" : "text-blue-500") + " font-bold"}>Save</Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-1 justify-center items-center p-4">
                    {/* Profile Picture with Gradient Ring */}
                    <View className="relative mb-8">
                        {/* Gradient ring */}
                        <View className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-75" />
                        <View className="bg-background p-1 rounded-full">
                            <Image
                                source={{ uri: props.pictureUri }}
                                className="w-32 h-32 rounded-full"
                            />
                        </View>
                        <TouchableOpacity
                            className="absolute bottom-0 right-0 bg-blue-600 p-3 rounded-full shadow-lg border-2 border-background"
                            activeOpacity={0.8}
                            onPress={() => {
                                launchImageLibraryAsync({
                                    mediaTypes: "images",
                                    allowsEditing: true,
                                    aspect: [1, 1],
                                    quality: 1,
                                }).then((result) => {
                                    if (!result.canceled) {
                                        const uri = result.assets[0].uri;
                                        props.uploadPicture && props.uploadPicture(uri);
                                    }
                                });
                            }}
                        >
                            <Ionicons name="camera" size={22} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Form Section */}
                    <View className="w-full max-w-md">
                        {/* Username Field */}
                        <View className="mb-5">
                            <Text className="text-base font-semibold mb-2 text-gray-300">Username</Text>
                            <View className="border border-gray-600/50 rounded-xl bg-gray-800/30 w-full flex-row items-center px-3 py-1">
                                <Ionicons name="at" size={18} color="#9CA3AF" />
                                <TextInput
                                    className="p-2 pl-2 flex-1 text-white text-base"
                                    placeholder="Enter your username"
                                    placeholderTextColor="#6B7280"
                                    value={username}
                                    onChangeText={setUsername}
                                    editable={false}
                                />
                                <Ionicons name="lock-closed" size={16} color="#6B7280" />
                            </View>
                        </View>

                        {/* Name Field */}
                        <View className="mb-5">
                            <Text className="text-base font-semibold mb-2 text-gray-300">Name</Text>
                            <View className="border border-gray-600/50 rounded-xl bg-gray-800/30 w-full flex-row items-center px-3 py-1">
                                <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                                <TextInput
                                    className="p-2 pl-2 flex-1 text-white text-base"
                                    placeholder="Enter your name"
                                    placeholderTextColor="#6B7280"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default EditProfile;