import { TouchableOpacity, View, Text, ScrollView, ActivityIndicator } from "react-native";
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
      const userEventsRes = await getAuth(router, `/getliveevents?userOnly=true`);
      const userEvents = userEventsRes.status === 200 ? userEventsRes.events : [];
      const allEventsRes = await getAuth(router, "/getliveevents?userOnly=false");
      const allEvents = allEventsRes.status === 200 ? allEventsRes.events : [];
      const otherEvents = allEvents.filter(
        (event: any) => !userEvents.some((userEvent: any) => userEvent.id === event.id)
      );
      setLiveEvents([...userEvents, ...otherEvents]);
      setLoading(false);

      // Refresh all events
      setLoadingAllEvents(true);
      const allEventsResponse = await getAuth(router, "/getallevents?excludeLive=true");
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
        const userEventsRes = await getAuth(router, `/getliveevents?userOnly=true`);
        const userEvents = userEventsRes.status === 200 ? userEventsRes.events : [];

        // Fetch all live events
        const allEventsRes = await getAuth(router, "/getliveevents?userOnly=false");
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
        const res = await getAuth(router, "/getallevents?excludeLive=true");
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
      <View className="border-b border-gray-700/50 bg-gray-800/30">
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-blue-600/20 p-2 rounded-full">
              <Ionicons name="location" size={24} color="#3B82F6" />
            </View>
            <Text className="text-white text-2xl font-bold">Local Events</Text>
          </View>
        </View>
      </View>
      <RefreshTab onRefresh={onRefresh}>
        <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
          {/* Live Events Section */}
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
            ) : liveEvents.length > 0 ? (
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
            ) : (
              <View className="mx-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-8 items-center">
                <View className="bg-gray-700/30 p-4 rounded-full mb-3">
                  <Ionicons name="calendar-outline" size={40} color="#6B7280" />
                </View>
                <Text className="text-gray-400 text-base font-semibold">No live events</Text>
                <Text className="text-gray-500 text-sm mt-1 text-center">Check back later for events happening now</Text>
              </View>
            )}
          </View>

          {/* Upcoming Events Section */}
          <View className="mt-6">
            <View className="flex-row items-center gap-2 px-4 mb-3">
              <Ionicons name="calendar" size={22} color="#3B82F6" />
              <Text className="text-white text-xl font-bold">Upcoming Events</Text>
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
              <View className="px-4">
                {upcomingEvents.map((event) => (
                  <Event key={event.id} event={event} showTop={true} />
                ))}
              </View>
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
              <View className="px-4">
                {pastEvents.map((event) => (
                  <Event key={event.id} event={event} showTop={true} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </RefreshTab>
    </View>
  );
}
