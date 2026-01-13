import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from '@/utils/request';
import { useFocusEffect } from 'expo-router';

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
        <TouchableOpacity key={g._id} className="bg-gray-800/40 rounded-xl p-4 mb-3" onPress={() => router.push(`/tabs/groupDetails?id=${g._id}`)}>
          <Text className="text-white text-lg font-semibold">{g.name}</Text>
          <Text className="text-gray-400">{g.city} • {g.category} • {g.membersCount || 0} members</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
