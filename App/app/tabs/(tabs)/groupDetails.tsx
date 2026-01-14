import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, BackHandler, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getAuth, postAuth } from '@/utils/request';
import { URLS } from '@/constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Profile from '@/components/Profile/profile';
import CreateGroup from '@/components/Groups/createGroup';
import { TabBarVisibilityContext } from './_layout';
import { Theme } from '@/constants/Theme';
import { eventBus } from '@/utils/eventBus';

export default function GroupDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const storedData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');
      const userId = storedData.id;
      setCurrentUserId(userId);

      const res = await getAuth(router, `/getgroup?id=${id}`);
      if (res.status === 200) {
        setGroup(res.group);
        setIsMember(res.group?.members?.includes(userId) || false);
      }
    } catch (err) {
      console.error('Error fetching group:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetch(); }, [id]);

  useFocusEffect(
    useCallback(() => {
      const backPress = () => {
        if (viewingProfile) {
          setViewingProfile(null);
          return true;
        }
        return false;
      };
      const backhandler = BackHandler.addEventListener('hardwareBackPress', backPress);

      return () => backhandler.remove();
    }, [viewingProfile])
  );

  const { setVisible: setNavBarVisible } = React.useContext(TabBarVisibilityContext);

  useFocusEffect(
    useCallback(() => {
      setNavBarVisible(false);
      return () => setNavBarVisible(true);
    }, [])
  );

  const join = async () => {
    try {
      setActionLoading(true);
      const res = await postAuth(router, '/joingroup', { id });
      if (res.status === 200) {
        fetch();
        try { eventBus.emit('groupMembershipChanged', { groupId: id, joined: true }); } catch (e) { }
      }
      else Alert.alert('Error', res.message || 'Failed to join');
    } catch (err) {
      console.error('join error', err);
    } finally { setActionLoading(false); }
  };

  const leave = async () => {
    try {
      setActionLoading(true);
      const res = await postAuth(router, '/leavegroup', { id });
      if (res.status === 200) {
        fetch();
        try { eventBus.emit('groupMembershipChanged', { groupId: id, joined: false }); } catch (e) { }
      }
      else Alert.alert('Error', res.message || 'Failed to leave');
    } catch (err) {
      console.error('leave error', err);
    } finally { setActionLoading(false); }
  };

  const addComment = async () => {
    if (!comment) return;
    const res = await postAuth(router, '/groupcomments/add', { groupId: id, content: comment });
    if (res.status === 200) { setComment(''); fetch(); } else Alert.alert('Error', res.message || 'Failed to comment');
  };

  if (loading) return <View className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color="#eb3678" /></View>;
  if (!group) return <View className="flex-1 bg-background justify-center items-center"><Text className="text-white text-lg">Group not found</Text></View>;

  if (viewingProfile) {
    return <Profile userId={viewingProfile} onBack={() => setViewingProfile(null)} />;
  }

  if (isEditing) {
    return (
      <CreateGroup
        editGroup={group}
        onCancel={() => setIsEditing(false)}
        onUpdateSuccess={() => { setIsEditing(false); fetch(); }}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white">Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Group Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1">
        {group.imageUrl && (
          <View className="relative">
            <Image
              source={{ uri: `${URLS.api}/getgroupimage?id=${group._id}` }}
              className="w-full aspect-[4/2]"
              resizeMode="cover"
            />
          </View>
        )}

        <View className="px-4 py-4">
          <Text className="text-white text-2xl font-bold mb-2">{group.name}</Text>
          <Text className="text-gray-300 mb-4">{group.city} • {group.category}</Text>
          <Text className="text-gray-200 mb-4">{group.description}</Text>

          <View className="flex-row gap-3 mb-4">
            { (typeof group.createdBy === 'object' ? group.createdBy._id : group.createdBy) === currentUserId ? (
              <>
                <TouchableOpacity onPress={() => setIsEditing(true)} className="flex-1 py-3 rounded-md items-center" style={{ backgroundColor: Theme.accent }}>
                  <Text className="text-white">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      try {
                        const res = await postAuth(router, '/deletegroup', { id: group._id });
                        if (res.status === 200) { Alert.alert('Deleted', 'Group deleted'); router.back(); }
                        else Alert.alert('Error', res.message || 'Failed to delete');
                      } catch (err) { console.error('delete group', err); Alert.alert('Error', 'Unexpected error'); }
                    }}
                  ]);
                }} className="flex-1 py-3 rounded-md items-center bg-red-600">
                  <Text className="text-white">Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {isMember ? (
                  <TouchableOpacity onPress={leave} disabled={actionLoading} className="flex-1 bg-gray-700 py-3 rounded-md items-center">
                    <Text className="text-white">Leave</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={join} disabled={actionLoading} className="flex-1 py-3 rounded-md items-center" style={{ backgroundColor: Theme.accent }}>
                    <Text className="text-white">Join</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View className="flex-row items-center gap-3 mb-3">
            <Text className="text-gray-400 text-sm">Members: {group.membersCount || group.members?.length || 0}</Text>
            {group.admins?.length > 0 && (
              <Text className="text-gray-400 text-sm">Admins: {group.admins.length}</Text>
            )}
          </View>

          <Text className="text-white text-lg font-semibold mb-2">Comments</Text>
          {group.comments && group.comments.length === 0 && <Text className="text-gray-400 mb-4">No comments yet</Text>}
          {group.comments && group.comments.map((c: any) => (
            <View key={c._id} className="bg-gray-800/40 rounded-xl p-3 mb-2">
              <TouchableOpacity onPress={() => setViewingProfile(typeof c.userId === 'object' ? c.userId._id : c.userId)}>
                <Text className="text-sm font-semibold" style={{ color: Theme.accent }}>{c.userId?.username || c.userId?.name || 'Unknown'}</Text>
              </TouchableOpacity>
              <Text className="text-white mt-1">{c.content}</Text>
              <Text className="text-gray-400 text-xs mt-1">{new Date(c.createdAt).toLocaleString()}</Text>
            </View>
          ))}

          <View className="mt-4 mb-8">
            <TextInput value={comment} onChangeText={setComment} placeholder="Write a comment..." placeholderTextColor="#6B7280" className="bg-gray-900/50 text-white rounded-md px-3 py-2 mb-3" />
            <TouchableOpacity onPress={addComment} className="py-3 rounded-md items-center" style={{ backgroundColor: Theme.accent }}><Text className="text-white">Post Comment</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
