import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from '@/utils/request';
import { useFocusEffect } from 'expo-router';
import { URLS } from '@/constants/API';

export default function GroupsList() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuth(router, '/getgroups');
      if (res.status === 200) setGroups(res.groups || []);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useFocusEffect(useCallback(() => { fetchGroups(); }, [fetchGroups]));

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>;

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-white text-2xl font-bold mb-4">Groups</Text>
      {groups.map(g => (
        <TouchableOpacity key={g._id} className="bg-gray-800/40 rounded-xl overflow-hidden mb-3 active:opacity-75" onPress={() => router.push(`/tabs/groupDetails?id=${g._id}`)}>
          {/* Group Image */}
          {g.imageUrl && (
            <View className="h-32 bg-gray-900 relative">
              <Image
                source={{ uri: `${URLS.api}/getgroupimage?id=${g._id}` }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/80" />
            </View>
          )}
          {/* Content */}
          <View className="p-4">
            <Text className="text-white text-lg font-semibold">{g.name}</Text>
            <Text className="text-gray-400">{g.city} • {g.category} • {g.membersCount || 0} members</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
