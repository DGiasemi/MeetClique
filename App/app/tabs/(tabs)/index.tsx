import { TouchableOpacity, View, Text, ScrollView, ActivityIndicator, TextInput } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

import { useAppServices } from "@/hooks/useAppServices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@/utils/request";
import { useRouter, useFocusEffect } from "expo-router";
import Event from "@/components/Feed/event";
import RefreshTab from "@/components/RefreshTab/refreshTab";

export default function Home() {
  const [userData, setUserData] = useState(null as any);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAllEvents, setLoadingAllEvents] = useState(true);
  const [city, setCity] = useState<string>('All Cities');
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [cityQuery, setCityQuery] = useState<string>('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);
  const router = useRouter();

  const fetchUserData = async () => {
    const storedData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');
    if (storedData) {
      setUserData(storedData);
    }

    const res = await getAuth(router, "/getuser");
    if (res.status === 200) {
      setUserData(res);
      await AsyncStorage.setItem('userData', JSON.stringify(res));
    } else {
      console.log("Failed to fetch user data:", res.message);
    }
  };

  const fetchSocialPoints = async () => {
    const res = await getAuth(router, "/getsocialpoints");
    if (res.status === 200) {
      await AsyncStorage.setItem('socialPoints', JSON.stringify(res));
    } else {
      console.log("Failed to fetch social points data:", res.message);
    }
  };

  const fetchCitySuggestions = async (query: string) => {
    if (!query || query.trim() === '') {
      setCityResults([]);
      return;
    }
    setIsSearchingCity(true);
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&countrycodes=gr&q=${encoded}`;
      const resp = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'EventsApp/1.0 (compatible)' } });
      if (!resp.ok) {
        setCityResults([]);
        return;
      }
      const data = await resp.json();
      const filtered = (data || []).filter((item: any) => item.class === 'place' && ['city', 'town', 'village', 'county'].includes(item.type));
      const mapped = filtered.map((item: any) => {
        const addr = item.address || {};
        const name = addr.city || addr.town || addr.village || (item.display_name ? item.display_name.split(',')[0] : '');
        return { id: `city_${item.place_id}`, name };
      });
      // Prepend 'All Cities'
      const finalResults = [{ id: 'all', name: 'All Cities' }, ...mapped];
      setCityResults(finalResults);
    } catch (err) {
      console.error('Error fetching city suggestions:', err);
      setCityResults([]);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const onRefresh = async () => {
    try {
      // Refresh user data
      const res = await getAuth(router, "/getuser");
      if (res.status === 200) {
        setUserData(res);
        await AsyncStorage.setItem('userData', JSON.stringify(res));
      }

      // Refresh social points
      const socialRes = await getAuth(router, "/getsocialpoints");
      if (socialRes.status === 200) {
        await AsyncStorage.setItem('socialPoints', JSON.stringify(socialRes));
      }

      // Refresh live events
      setLoading(true);
      const cityParam = city && city !== 'All Cities' ? `&city=${encodeURIComponent(city)}` : '';
      const userEventsRes = await getAuth(router, `/getliveevents?userOnly=true${cityParam}`);
      const userEvents = userEventsRes.status === 200 ? userEventsRes.events : [];
      const allEventsRes = await getAuth(router, `/getliveevents?userOnly=false${cityParam}`);
      const allEvents = allEventsRes.status === 200 ? allEventsRes.events : [];
      const otherEvents = allEvents.filter(
        (event: any) => !userEvents.some((userEvent: any) => userEvent.id === event.id)
      );
      setLiveEvents([...userEvents, ...otherEvents]);
      setLoading(false);

      // Refresh all events
      setLoadingAllEvents(true);
      const cityParam2 = city && city !== 'All Cities' ? `&city=${encodeURIComponent(city)}` : '';
      const allEventsResponse = await getAuth(router, `/getallevents?excludeLive=true${cityParam2}`);
      if (allEventsResponse.status === 200) {
        const events = allEventsResponse.events || [];
        const currentTime = new Date();

        // Separate into upcoming and past events
        const upcoming = events.filter((event: any) => new Date(event.startTime) > currentTime);
        const past = events.filter((event: any) => new Date(event.startTime) <= currentTime);

        setAllEvents(events);
        setUpcomingEvents(upcoming);
        setPastEvents(past);
      }
      setLoadingAllEvents(false);
    } catch (error) {
      console.log("Failed to refresh:", error);
      setLoading(false);
      setLoadingAllEvents(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchSocialPoints();
  }, []);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [])
  );

  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        setLoading(true);

        // Fetch events where user is participating
        const cityParam = city && city !== 'All Cities' ? `&city=${encodeURIComponent(city)}` : '';
        const userEventsRes = await getAuth(router, `/getliveevents?userOnly=true${cityParam}`);
        const userEvents = userEventsRes.status === 200 ? userEventsRes.events : [];

        // Fetch all live events
        const allEventsRes = await getAuth(router, `/getliveevents?userOnly=false${cityParam}`);
        const allEvents = allEventsRes.status === 200 ? allEventsRes.events : [];

        // Filter out user events from all events to avoid duplicates
        const otherEvents = allEvents.filter(
          (event: any) => !userEvents.some((userEvent: any) => userEvent.id === event.id)
        );

        // Combine: user's events first, then others
        const combined = [...userEvents, ...otherEvents];
        setLiveEvents(combined);
      } catch (error) {
        console.log("Failed to fetch live events:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchLiveEvents();
    }
  }, [userData]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setLoadingAllEvents(true);

        // Fetch all events excluding live ones
        const cityParam = city && city !== 'All Cities' ? `&city=${encodeURIComponent(city)}` : '';
        const res = await getAuth(router, `/getallevents?excludeLive=true${cityParam}`);
        if (res.status === 200) {
          const events = res.events || [];
          const currentTime = new Date();

          // Separate into upcoming and past events
          const upcoming = events.filter((event: any) => new Date(event.startTime) > currentTime);
          const past = events.filter((event: any) => new Date(event.startTime) <= currentTime);

          setAllEvents(events);
          setUpcomingEvents(upcoming);
          setPastEvents(past);
        } else {
          console.error("Failed to fetch all events:", res.message);
        }
      } catch (error) {
        console.log("Failed to fetch all events:", error);
      } finally {
        setLoadingAllEvents(false);
      }
    };

    if (userData) {
      fetchAllEvents();
    }
  }, [userData]);

  useAppServices();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-gray-700/50 bg-gray-800/30" style={{ position: 'relative' }}>
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-blue-600/20 p-2 rounded-full">
              <Ionicons name="location" size={24} color="#3B82F6" />
            </View>
            <TouchableOpacity onPress={() => setShowCityPicker(!showCityPicker)} className="flex-row items-center">
              <Text className="text-white text-2xl font-bold mr-2">{city}</Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {showCityPicker && (
            <View style={{ position: 'absolute', left: 16, right: 16, top: 56, zIndex: 1000 }}>
              <View className="bg-gray-900 rounded-xl p-2 opacity-100">
                <TextInput
                  value={cityQuery}
                  onChangeText={(v) => { setCityQuery(v); fetchCitySuggestions(v); }}
                  placeholder="Search for a city..."
                  placeholderTextColor="#9CA3AF"
                  style={{ color: 'white', padding: 8, backgroundColor: 'rgba(31,41,55,0.6)', borderRadius: 8, marginBottom: 8 }}
                />
                <ScrollView style={{ maxHeight: 220 }}>
                  {isSearchingCity ? (
                    <Text className="text-gray-400 p-2">Searching...</Text>
                  ) : cityResults.length === 0 ? (
                    <TouchableOpacity key={'all'} onPress={async () => { setCity('All Cities'); setShowCityPicker(false); setCityQuery(''); setCityResults([]); await onRefresh(); }} className="px-3 py-2">
                      <Text className={`text-base ${city === 'All Cities' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}>All Cities</Text>
                    </TouchableOpacity>
                  ) : (
                    cityResults.map((c) => (
                      <TouchableOpacity key={c.id} onPress={async () => { setCity(c.name); setShowCityPicker(false); setCityQuery(''); setCityResults([]); await onRefresh(); }} className="px-3 py-2">
                        <Text className={`text-base ${city === c.name ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}>{c.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </View>
      <RefreshTab onRefresh={onRefresh}>
        <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
          {/* Live Events Section: show only while loading or when there are live events for the selected city */}
          {(loading || (liveEvents && liveEvents.length > 0)) && (
            <View className="mt-4">
              <View className="flex-row items-center gap-2 px-4 mb-3">
                <View className="bg-green-600/20 p-1.5 rounded-full">
                  <View className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </View>
                <Text className="text-white text-xl font-bold">Live Now</Text>
                {liveEvents.length > 0 && (
                  <View className="bg-green-600/20 px-2 py-1 rounded-full">
                    <Text className="text-green-400 text-xs font-semibold">{liveEvents.length}</Text>
                  </View>
                )}
              </View>
              {loading ? (
                <View className="h-48 justify-center items-center">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="text-gray-400 mt-3 text-sm">Loading live events...</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="px-4"
                  contentContainerStyle={{ gap: 16 }}
                >
                  {liveEvents.map((event, index) => (
                    <View key={event.id} className="w-80">
                      <Event event={event} showTop={true} />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Upcoming Events Section */}
          <View className="mt-6">
            <View className="flex-row items-center gap-2 px-4 mb-3">
              <Ionicons name="calendar" size={22} color="#3B82F6" />
              <Text className="text-white text-xl font-bold">Upcoming Events & Hangouts</Text>
              {upcomingEvents.length > 0 && (
                <View className="bg-blue-600/20 px-2 py-1 rounded-full">
                  <Text className="text-blue-400 text-xs font-semibold">{upcomingEvents.length}</Text>
                </View>
              )}
            </View>
            {loadingAllEvents ? (
              <View className="h-48 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-400 mt-3 text-sm">Loading events...</Text>
              </View>
            ) : upcomingEvents.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4"
                contentContainerStyle={{ gap: 16 }}
              >
                {upcomingEvents.map((event) => (
                  <View key={event.id} className="w-80">
                    <Event event={event} showTop={true} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="mx-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-8 items-center">
                <View className="bg-gray-700/30 p-4 rounded-full mb-3">
                  <Ionicons name="calendar-outline" size={40} color="#6B7280" />
                </View>
                <Text className="text-gray-400 text-base font-semibold">No upcoming events</Text>
                <Text className="text-gray-500 text-sm mt-1 text-center">New events will appear here</Text>
              </View>
            )}
          </View>

          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <View className="mt-6">
              <View className="flex-row items-center gap-2 px-4 mb-3">
                <Ionicons name="time-outline" size={22} color="#9CA3AF" />
                <Text className="text-white text-xl font-bold">Past Events</Text>
                <View className="bg-gray-600/20 px-2 py-1 rounded-full">
                  <Text className="text-gray-400 text-xs font-semibold">{pastEvents.length}</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4"
                contentContainerStyle={{ gap: 16 }}
              >
                {pastEvents.map((event) => (
                  <View key={event.id} className="w-80">
                    <Event event={event} showTop={true} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </RefreshTab>
    </View>
  );
}
