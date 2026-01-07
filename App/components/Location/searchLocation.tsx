import { Text, TouchableOpacity, View, Animated, ScrollView } from "react-native";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { getAuth } from "@/utils/request";
import { useRouter } from "expo-router";
import * as Location from 'expo-location';
import AddLocation from "./addLocation";

export default function SearchLocation({ setLocation, goback }: { setLocation: (location: any) => void, goback: () => void }) {

    const [userLocation, setUserLocation] = useState<any>(null);
    const [defaultLocations, setDefaultLocations] = useState<Array<any>>([]);
    const [locationValue, setLocationValue] = useState<string>('');
    const [locations, setLocations] = useState<Array<any>>([]);
    const [addLocation, setAddLocation] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);
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

    const updateLocationAndDistances = async (location: Location.LocationObject | null) => {
        const _userLocation = location;
        if (_userLocation === null) {
            console.log("Unable to get user location");
            return;
        }
        const newLocation = {
            latitude: _userLocation.coords.latitude,
            longitude: _userLocation.coords.longitude,
        };
        setUserLocation(newLocation);
    };

    const searchLocation = async (query: string) => {
        setIsSearching(true);
        if (query.trim() === '') {
            setLocations(defaultLocations);
            setIsSearching(false);
            return;
        }
        const response = await getAuth(router, "/getlocations?name=" + query);
        if (response.status === 200 && response.result) {
            setLocations(response.result);
        } else {
            setLocations([]);
        }
        setIsSearching(false);
    }

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (locationValue) {
                searchLocation(locationValue);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [locationValue]);

    if (addLocation) {
        return (
            <AddLocation
                setLocation={(loc: any) => {
                    setLocation(loc);
                    setAddLocation(false);
                }}
                goback={() => setAddLocation(false)}
            />
        );
    }

    return (
        <View className="h-full bg-background">
            {/* Gradient Header Background */}
            <LinearGradient
                colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
                className="absolute top-0 left-0 right-0 h-40"
            />

            {/* Header */}
            <View className="flex-row justify-between items-center pt-6 px-4 pb-4">
                <TouchableOpacity
                    onPress={goback}
                    className="w-10 h-10 rounded-full bg-gray-800/80 items-center justify-center"
                    style={{ elevation: 2 }}
                >
                    <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="flex-1 items-center">
                    <Text className="text-white text-2xl font-bold">Search Location</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">Find or create a place</Text>
                </View>

                <TouchableOpacity
                    onPress={() => setAddLocation(true)}
                    className="w-10 h-10 rounded-full bg-purple-600 items-center justify-center"
                    style={{ elevation: 4 }}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <Animated.View
                style={{
                    flex: 1,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
                className="px-4"
            >
                {/* Search Bar */}
                <View className="w-full mb-5">
                    <View
                        className="rounded-2xl overflow-hidden flex-row items-center px-4"
                        style={{
                            backgroundColor: 'rgba(31, 41, 55, 0.6)',
                            borderWidth: 2,
                            borderColor: isSearching ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.2)',
                            elevation: 3,
                        }}
                    >
                        <Ionicons name="search" size={20} color="#8B5CF6" />
                        <TextInput
                            value={locationValue}
                            onChangeText={setLocationValue}
                            onFocus={() => setIsSearching(true)}
                            onBlur={() => setIsSearching(false)}
                            placeholder="Search for a location..."
                            placeholderTextColor="#6B7280"
                            className="flex-1 text-white px-3 py-4 text-base"
                            autoFocus
                            selectTextOnFocus
                        />
                        {locationValue.length > 0 && (
                            <TouchableOpacity onPress={() => setLocationValue('')}>
                                <Ionicons name="close-circle" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Results */}
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {locations.length === 0 && locationValue.length > 0 ? (
                        <View className="items-center justify-center py-16">
                            <View className="w-20 h-20 rounded-full bg-gray-800/50 items-center justify-center mb-4">
                                <Ionicons name="location-outline" size={40} color="#6B7280" />
                            </View>
                            <Text className="text-gray-400 text-base mb-2">No locations found</Text>
                            <Text className="text-gray-500 text-sm text-center px-8">
                                Try a different search or create a new location
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {locations.map((location, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setLocation(location)}
                                    activeOpacity={0.7}
                                    className="rounded-2xl overflow-hidden"
                                    style={{
                                        backgroundColor: 'rgba(31, 41, 55, 0.6)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(139, 92, 246, 0.2)',
                                    }}
                                >
                                    <LinearGradient
                                        colors={['rgba(139, 92, 246, 0.05)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="p-4 flex-row items-center"
                                    >
                                        <View className="w-12 h-12 rounded-full bg-purple-600/20 items-center justify-center mr-4">
                                            <Ionicons name="location" size={24} color="#8B5CF6" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white text-lg font-semibold mb-1">
                                                {location.name}
                                            </Text>
                                            {location.address && (
                                                <Text className="text-gray-400 text-sm" numberOfLines={1}>
                                                    {location.address}
                                                </Text>
                                            )}
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
}