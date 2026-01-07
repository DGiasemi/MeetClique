import { Image, View } from "react-native";
import React from "react";

export default function ProfilePicsBubble({ userIDs }: { userIDs: string[] }) {

    return (
        <View className="flex flex-row items-center relative w-[100%] h-12">
            {userIDs.map((userID, index) => (
                <View key={userID} className="w-12 h-12 rounded-full overflow-hidden absolute" style={{ left: index * 8 }}>
                    <Image source={{ uri: process.env.EXPO_PUBLIC_API_URL + '/getprofilepic?id=' + userID }} className="w-full h-full" />
                </View>
            ))}
        </View>
    );
}