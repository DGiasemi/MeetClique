import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAuth, postAuth } from '@/utils/request';
import { URLS } from '@/constants/API';

export default function GroupDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  const fetch = async () => {
    setLoading(true);
    const res = await getAuth(router, `/getgroup?id=${id}`);
    if (res.status === 200) setGroup(res.group);
    setLoading(false);
  };

  useEffect(() => { if (id) fetch(); }, [id]);

  const join = async () => {
    const res = await postAuth(router, '/joingroup', { id });
    if (res.status === 200) fetch();
    else Alert.alert('Error', res.message || 'Failed to join');
  };

  const leave = async () => {
    const res = await postAuth(router, '/leavegroup', { id });
    if (res.status === 200) fetch();
    else Alert.alert('Error', res.message || 'Failed to leave');
  };

  const addComment = async () => {
    if (!comment) return;
    const res = await postAuth(router, '/groupcomments/add', { groupId: id, content: comment });
    if (res.status === 200) { setComment(''); fetch(); } else Alert.alert('Error', res.message || 'Failed to comment');
  };

  if (!group) return <View className="flex-1 items-center justify-center"><Text className="text-gray-400">Loading...</Text></View>;

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Group Image */}
      {group.imageUrl && (
        <View className="h-64 bg-gray-900 relative">
          <Image
            source={{ uri: `${URLS.api}/getgroupimage?id=${group._id}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </View>
      )}

      {/* Content */}
      <View className="p-4">
        <Text className="text-white text-2xl font-bold mb-2">{group.name}</Text>
        <Text className="text-gray-300 mb-4">{group.city} • {group.category}</Text>
        <Text className="text-gray-200 mb-4">{group.description}</Text>

        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity onPress={join} className="flex-1 bg-blue-600 py-3 rounded-md items-center"><Text className="text-white">Join</Text></TouchableOpacity>
          <TouchableOpacity onPress={leave} className="flex-1 bg-gray-700 py-3 rounded-md items-center"><Text className="text-white">Leave</Text></TouchableOpacity>
        </View>

        <Text className="text-white text-lg font-semibold mb-2">Comments</Text>
        {group.comments && group.comments.length === 0 && <Text className="text-gray-400 mb-4">No comments yet</Text>}
        {group.comments && group.comments.map((c: any) => (
          <View key={c._id} className="bg-gray-800/40 rounded-xl p-3 mb-2">
            <Text className="text-white">{c.content}</Text>
            <Text className="text-gray-400 text-xs mt-1">{new Date(c.createdAt).toLocaleString()}</Text>
          </View>
        ))}

        <View className="mt-4 mb-8">
          <TextInput value={comment} onChangeText={setComment} placeholder="Write a comment..." placeholderTextColor="#6B7280" className="bg-gray-900/50 text-white rounded-md px-3 py-2 mb-3" />
          <TouchableOpacity onPress={addComment} className="bg-blue-600 py-3 rounded-md items-center"><Text className="text-white">Post Comment</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
