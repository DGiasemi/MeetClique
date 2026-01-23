import { Text, TouchableOpacity, View, Animated, ScrollView } from "react-native";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { getAuth } from "@/utils/request";
import { useRouter } from "expo-router";
import * as Location from 'expo-location';

export default function SearchLocation({ setLocation, goback }: { setLocation: (location: any) => void, goback: () => void }) {

    const [userLocation, setUserLocation] = useState<any>(null);
    const [defaultLocations, setDefaultLocations] = useState<Array<any>>([]);
    const [locationValue, setLocationValue] = useState<string>('');
    const [locations, setLocations] = useState<Array<any>>([]);
    
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

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Location permission not granted');
                    return;
                }
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
                if (pos && pos.coords) {
                    setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                }
            } catch (err) {
                console.error('Failed to get user location:', err);
            }
        })();
    }, []);

    const searchLocation = async (query: string) => {
        setIsSearching(true);
        try {
            if (query.trim() === '') {
                setLocations(defaultLocations || []);
                setIsSearching(false);
                return;
            }

            // Use OpenStreetMap Nominatim: do a nearby-biased query plus a broader query
            // then merge results so nearby items are prioritized but other matches still appear.
            const encoded = encodeURIComponent(query);
            const base = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encoded}`;

            // Build local (viewbox) URL if user location available
            let localUrl: string | null = null;
            if (userLocation && userLocation.latitude && userLocation.longitude) {
                const delta = 0.05; // ~5km bias
                const lat = parseFloat(userLocation.latitude);
                const lon = parseFloat(userLocation.longitude);
                const minLon = lon - delta;
                const minLat = lat - delta;
                const maxLon = lon + delta;
                const maxLat = lat + delta;
                localUrl = `${base}&limit=8&viewbox=${minLon},${minLat},${maxLon},${maxLat}`;
            }

            // Broader URL limited to Greece to keep results relevant
            const globalUrl = `${base}&limit=12&countrycodes=gr`;

            try {
                // Fetch both (local first if available)
                let localData: any[] = [];
                if (localUrl) {
                    const r = await fetch(localUrl, { headers: { Accept: 'application/json', 'User-Agent': 'MeetClique/1.0 (compatible)' } });
                    if (r.ok) localData = await r.json();
                }

                const g = await fetch(globalUrl, { headers: { Accept: 'application/json', 'User-Agent': 'MeetClique/1.0 (compatible)' } });
                const globalData = g.ok ? await g.json() : [];

                // Map function
                const mapItems = (arr: any[]) => (arr || []).map((item: any) => {
                    const display = item.display_name || '';
                    return {
                        id: `nominatim_${item.place_id}`,
                        place_id: item.place_id,
                        name: (item.namedetails && item.namedetails.name) ? item.namedetails.name : (display.split(',')[0] || display),
                        address: display,
                        description: item.type || item.class || display,
                        lat: item.lat,
                        lon: item.lon,
                        raw: item,
                    };
                });

                const mappedLocal = mapItems(localData);
                const mappedGlobal = mapItems(globalData);

                // Merge: include local first, then global items that don't duplicate by place_id
                const seen = new Set(mappedLocal.map((i: any) => i.place_id));
                const merged = [...mappedLocal];
                for (const item of mappedGlobal) {
                    if (!seen.has(item.place_id)) {
                        merged.push(item);
                        seen.add(item.place_id);
                    }
                }

                // Limit total results
                const final = merged.slice(0, 10);
                setLocations(final);
            } catch (err) {
                console.error('Error searching locations:', err);
                // fallback to backend locations endpoint
                try {
                    const response = await getAuth(router, "/getlocations?name=" + query);
                    if (response && response.status === 200 && response.result) {
                        setLocations(Array.isArray(response.result) ? response.result : []);
                    } else {
                        setLocations([]);
                    }
                } catch (e) {
                    setLocations([]);
                }
            }
        } catch (error) {
            console.error('Error searching locations:', error);
            setLocations([]);
        } finally {
            setIsSearching(false);
        }
    }

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (locationValue) {
                searchLocation(locationValue);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [locationValue]);

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
                    <Text className="text-gray-400 text-xs mt-0.5">Find the place you need here</Text>
                </View>

                <View style={{ width: 40 }} />
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
                    {(locations?.length ?? 0) === 0 && locationValue.length > 0 ? (
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
                            {(locations ?? []).map((location, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        const addr = (location.raw && location.raw.address) ? location.raw.address : {};
                                        const cityName = addr.city || addr.town || addr.village || addr.county || '';
                                        const locWithCity = { ...location, city: cityName };
                                        setLocation(locWithCity);
                                    }}
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