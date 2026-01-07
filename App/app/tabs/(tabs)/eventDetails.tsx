import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { getAuth, postAuth, deleteAuth } from "@/utils/request";
import { eventBus } from '@/utils/eventBus';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Profile from "@/components/Profile/profile";
import { TabBarVisibilityContext } from "./_layout";
import UploadEvent from "@/components/UploadEvent/uploadEvent";

export default function EventDetails() {
    const { eventId } = useLocalSearchParams();
    const router = useRouter();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAttending, setIsAttending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [viewingProfile, setViewingProfile] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                setLoading(true);

                // Get current user data
                const storedData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');
                const userId = storedData.id;
                console.log("user id: ", userId);
                setCurrentUserId(userId);

                // Fetch event details - we'll get it from the live events or all events
                const liveEventsRes = await getAuth(router, "/getliveevents?userOnly=false");
                const allEventsRes = await getAuth(router, "/getallevents?excludeLive=false");

                let foundEvent = null;

                if (liveEventsRes.status === 200) {
                    foundEvent = liveEventsRes.events.find((e: any) => e.id === eventId);
                }

                if (!foundEvent && allEventsRes.status === 200) {
                    foundEvent = allEventsRes.events.find((e: any) => e.id === eventId);
                }

                if (foundEvent) {
                    setEvent(foundEvent);
                    // Check if current user is attending
                    setIsAttending(foundEvent.attendees?.includes(userId) || false);

                    // If user is the event owner, fetch attendees
                    const eventOwnerId = typeof foundEvent.userID === 'object' ? foundEvent.userID._id : foundEvent.userID;
                    if (eventOwnerId === userId) {
                        fetchAttendees(foundEvent.id);
                    }
                } else {
                    Alert.alert("Error", "Event not found");
                    router.back();
                }
            } catch (error) {
                console.log("Error fetching event details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId, refreshKey]);

    const { setVisible: setNavBarVisible } = React.useContext(TabBarVisibilityContext);


    useFocusEffect(
        useCallback(() => {
            setNavBarVisible(false);
            return () => {
                setNavBarVisible(true);
            };
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const backPress = () => {
                if (viewingProfile) {
                    setViewingProfile(null);
                    return true;
                }
                if (isEditing) {
                    setIsEditing(false);
                    return true;
                }
                return false;
            };
            const backhandler = BackHandler.addEventListener('hardwareBackPress', backPress);

            return () => {
                backhandler.remove();
            };
        }, [viewingProfile])
    );

    const handleJoinLeave = async () => {
        if (!event || !currentUserId) return;

        try {
            setActionLoading(true);
            const endpoint = isAttending ? "/leaveevent" : "/joinevent";
            const result = await postAuth(router, endpoint, { eventId: event.id });

            if (result.status === 200) {
                setIsAttending(!isAttending);
                // Update the event data with the new attendee count
                setEvent((prev: any) => ({
                    ...prev,
                    attendeesCount: isAttending
                        ? prev.attendeesCount - 1
                        : prev.attendeesCount + 1,
                    attendees: isAttending
                        ? prev.attendees.filter((id: string) => id !== currentUserId)
                        : [...(prev.attendees || []), currentUserId]
                }));
                Alert.alert(
                    "Success",
                    isAttending ? "You have left the event" : "You have joined the event!"
                );
                    try {
                        // notify other parts of the app to refresh attended lists
                        eventBus.emit('attendChanged', { eventId: event.id, attending: !isAttending });
                    } catch (e) {
                        console.error('Failed to emit attendChanged', e);
                    }
            } else {
                Alert.alert("Error", result.message || "Failed to update event status");
            }
        } catch (error) {
            console.error("Error joining/leaving event:", error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event) return;
        Alert.alert(
            'Delete Event',
            'Are you sure you want to delete this event? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            const res = await deleteAuth(router, `/deleteevent?eventId=${event.id}`);
                            if (res && res.status === 200) {
                                try { eventBus.emit('eventDeleted', { eventId: event.id }); } catch (e) { console.error('emit eventDeleted', e); }
                                Alert.alert('Deleted', 'Event deleted successfully');
                                router.back();
                            } else {
                                Alert.alert('Error', res ? res.message || 'Delete failed' : 'Delete failed');
                            }
                        } catch (err) {
                            console.error('Error deleting event:', err);
                            Alert.alert('Error', 'An unexpected error occurred');
                        }
                    }
                }
            ]
        );
    };

    const fetchAttendees = async (eventId: string) => {
        try {
            setLoadingAttendees(true);
            const result = await getAuth(router, `/geteventattendees?eventId=${eventId}`);
            if (result.status === 200 && result.attendees) {
                setAttendees(result.attendees);
            }
        } catch (error) {
            console.error("Error fetching attendees:", error);
        } finally {
            setLoadingAttendees(false);
        }
    };

    // Helper function to get the actual user ID (handles both string and object formats)
    const getEventUserId = () => {
        if (!event?.userID) return null;
        return typeof event.userID === 'object' ? event.userID._id : event.userID;
    };

    const handleHostPress = async () => {
        try {
            const userId = typeof event.userID === 'object' ? event.userID._id : event.userID;
            router.push({ pathname: '/tabs/(tabs)/chats', params: { openMemberId: userId } });
        } catch (err) {
            console.error('Error opening chat for host:', err);
        }
    };

    const getTimeUntilEvent = () => {
        if (!event?.startTime) return null;

        const now = new Date();
        const startTime = new Date(event.startTime);
        const endTime = event?.endTime ? new Date(event.endTime) : null;

        // Check if event is live
        if (endTime && now >= startTime && now <= endTime) {
            return { text: "Live Now", color: "text-green-400" };
        }

        // Check if event has passed
        if (now > startTime) {
            const diffMs = now.getTime() - startTime.getTime();
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return { text: `${days} day${days > 1 ? 's' : ''} ago`, color: "text-gray-500" };
            if (hours > 0) return { text: `${hours} hour${hours > 1 ? 's' : ''} ago`, color: "text-gray-500" };
            if (minutes > 0) return { text: `${minutes} minute${minutes > 1 ? 's' : ''} ago`, color: "text-gray-500" };
            return { text: "Just now", color: "text-gray-500" };
        }

        // Event is in the future
        const diffMs = startTime.getTime() - now.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return { text: `in ${days} day${days > 1 ? 's' : ''}`, color: "text-blue-400" };
        if (hours > 0) return { text: `in ${hours} hour${hours > 1 ? 's' : ''}`, color: "text-blue-400" };
        if (minutes > 0) return { text: `in ${minutes} minute${minutes > 1 ? 's' : ''}`, color: "text-blue-400" };
        return { text: "Starting soon", color: "text-blue-400" };
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getEventStatus = () => {
        if (!event?.startTime) return 'upcoming';

        const now = new Date();
        const startTime = new Date(event.startTime);
        const endTime = event?.endTime ? new Date(event.endTime) : null;

        // Check if event is live
        if (endTime && now >= startTime && now <= endTime) {
            return 'live';
        }

        // Check if event has ended
        if (endTime && now > endTime) {
            return 'ended';
        }

        // Check if event has passed (no end time but start time has passed)
        if (!endTime && now > startTime) {
            return 'ended';
        }

        return 'upcoming';
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#eb3678" />
            </View>
        );
    }

    if (!event) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <Text className="text-white text-lg">Event not found</Text>
            </View>
        );
    }

    const timeInfo = getTimeUntilEvent();

    // If viewing a profile, show the Profile component
    if (viewingProfile) {
        return (
            <Profile
                userId={viewingProfile}
                onBack={() => setViewingProfile(null)}
            />
        );
    }

    if (isEditing) {
        return (
            <UploadEvent
                editEvent={event}
                onCancel={() => setIsEditing(false)}
                onUpdateSuccess={() => {
                    setIsEditing(false);
                    setRefreshKey(prev => prev + 1);
                }}
            />
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">Event Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1">
                {/* Event Image */}
                <View className="relative">
                    <Image
                        source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/geteventimage?id=${event.id}` }}
                        className="w-full aspect-[4/2]"
                        resizeMode="cover"
                    />
                    {event.type === 'hangout' ? (
                        <Text className={`absolute top-4 right-4 font-bold px-3 py-2 rounded-full text-sm bg-blue-600 text-white`}>
                            Hangout
                        </Text>
                    ) : (
                        <Text className={`absolute top-4 right-4 font-bold px-3 py-2 rounded-full text-sm ${event.price === 0 ? "bg-yellow-500 text-black" : "bg-green-500 text-black"}`}>
                            {event.price === 0 ? "Free" : `$${event.price}`}
                        </Text>
                    )}
                </View>

                {/* Event Info */}
                <View className="px-4 py-4">
                    {/* Event Name */}
                    <Text className="text-white text-2xl font-bold mb-2">{event.name}</Text>

                    {/* Host tag for hangouts (clickable) */}
                    {event.type === 'hangout' && (
                        <View className="flex-row items-center gap-2 mb-3">
                            <TouchableOpacity onPress={handleHostPress} className="px-2 py-1 bg-gray-800/30 rounded-md">
                                <Text className="text-sm text-gray-300">@{typeof event.userID === 'object' ? event.userID.username : event.userIDUsername || 'host'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Time Status */}
                    {timeInfo && (
                        <View className="flex-row items-center gap-2 mb-3">
                            <Text className={`text-sm font-semibold ${timeInfo.color}`}>
                                {timeInfo.text}
                            </Text>
                            {getEventUserId() === currentUserId ? (
                                <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-yellow-500">
                                    <Ionicons name="star" size={12} color="white" />
                                    <Text className="text-white text-xs font-semibold">
                                        Your Event
                                    </Text>
                                </View>
                            ) : isAttending && (
                                <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-purple-600">
                                    <Ionicons name="checkmark-circle" size={12} color="white" />
                                    <Text className="text-white text-xs font-semibold">
                                        You're Attending
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Location & City */}
                    <View className="mb-3">
                        <View className="flex-row items-center">
                            <Ionicons name="location" size={20} color="#eb3678" />
                            <View className="ml-2 flex-1">
                                <Text className="text-white font-semibold">
                                    {event.location?.name ? (event.city ? `${event.location.name}, ${event.city}` : event.location.name) : (event.city || "Location not specified")}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Date & Time */}
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="calendar" size={20} color="#eb3678" />
                        <View className="ml-2">
                            <Text className="text-gray-300 text-base">
                                {formatDateTime(event.startTime)}
                            </Text>
                            {event.endTime && (
                                <Text className="text-gray-400 text-sm">
                                    to {formatDateTime(event.endTime)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Attendees Count */}
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="people" size={20} color="#eb3678" />
                        <Text className="text-gray-300 text-base ml-2">
                            {event.attendeesCount || 0} {event.attendeesCount === 1 ? 'person' : 'people'} attending
                        </Text>
                    </View>

                    {/* Description */}
                    <View className="mb-4">
                        <Text className="text-white text-lg font-semibold mb-2">About</Text>
                        <Text className="text-gray-300 text-base leading-6">{event.description}</Text>
                    </View>

                    {/* Join/Leave Button or Owner Actions */}
                    {(() => {
                        const eventStatus = getEventStatus();
                        const isOwner = getEventUserId() === currentUserId;

                        // Owners see Edit Event button instead
                        if (isOwner) {
                            return (
                                <>
                                    <TouchableOpacity
                                        className="py-4 rounded-lg items-center bg-blue-600 mb-3"
                                        onPress={() => {
                                            // TODO: Navigate to edit event screen
                                            setIsEditing(true);
                                        }}
                                    >
                                        <View className="flex-row items-center gap-2">
                                            <Ionicons name="create-outline" size={20} color="white" />
                                            <Text className="text-white text-lg font-bold">
                                                Edit Event
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            className="flex-1 py-4 rounded-lg items-center bg-purple-600"
                                            onPress={() => {
                                                setIsEditing(true);
                                            }}
                                        >
                                            <Text className="text-white text-lg font-bold">Edit Event</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            className="flex-1 py-4 rounded-lg items-center bg-red-600"
                                            onPress={handleDelete}
                                        >
                                            <Text className="text-white text-lg font-bold">Delete Event</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            );
                        }

                        const isDisabled = eventStatus === 'live' || eventStatus === 'ended';

                        let buttonText = isAttending ? "Leave Event" : "Join Event";
                        let buttonStyle = isAttending ? "bg-red-600" : "bg-pink-600";

                        if (eventStatus === 'live') {
                            buttonText = isAttending ? "Leave Event (Live)" : "Event is Live Now";
                            buttonStyle = isAttending ? "bg-red-600" : "bg-gray-600";
                        } else if (eventStatus === 'ended') {
                            buttonText = "Event Has Ended";
                            buttonStyle = "bg-gray-600";
                        }

                        return (
                            <TouchableOpacity
                                onPress={handleJoinLeave}
                                disabled={actionLoading || isDisabled}
                                className={`py-4 rounded-lg items-center ${buttonStyle} ${(actionLoading || isDisabled) ? "opacity-50" : ""}`}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-lg font-bold">
                                        {buttonText}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })()}

                    {/* Attendees List (Only for Event Owners) */}
                    {getEventUserId() === currentUserId && (
                        <View className="mt-6">
                            <Text className="text-white text-lg font-semibold mb-3">
                                Attendees ({attendees.length})
                            </Text>
                            {loadingAttendees ? (
                                <View className="py-4">
                                    <ActivityIndicator color="#eb3678" />
                                </View>
                            ) : attendees.length > 0 ? (
                                <View className="bg-gray-800/30 rounded-lg border border-gray-700/50">
                                    {attendees.map((attendee, index) => (
                                        <TouchableOpacity
                                            key={attendee.id}
                                            onPress={() => setViewingProfile(attendee.id)}
                                            className={`flex-row items-center p-3 ${index !== attendees.length - 1 ? 'border-b border-gray-700/50' : ''
                                                }`}
                                        >
                                            <Image
                                                source={{
                                                    uri: `${process.env.EXPO_PUBLIC_API_URL}/getprofilepic?id=${attendee.id}&t=${Date.now()}`
                                                }}
                                                className="w-12 h-12 rounded-full mr-3"
                                            />
                                            <View className="flex-1">
                                                <Text className="text-white font-semibold text-base">
                                                    {attendee.name}
                                                </Text>
                                                <Text className="text-gray-400 text-sm">
                                                    @{attendee.username}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View className="bg-gray-800/30 rounded-lg border border-gray-700/50 p-6 items-center">
                                    <Ionicons name="people-outline" size={48} color="#6B7280" />
                                    <Text className="text-gray-400 text-sm mt-3">No attendees yet</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
