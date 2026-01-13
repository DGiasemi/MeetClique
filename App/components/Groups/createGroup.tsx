import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { postAuth } from '@/utils/request';
import { useRouter } from 'expo-router';

export default function CreateGroup({ onCancel }: { onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Athens');
  const [category, setCategory] = useState('Fun');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [cityQuery, setCityQuery] = useState<string>('');
  const [cityResults, setCityResults] = useState<Array<any>>([]);
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow gallery access to upload an image');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 2],
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) setImageUri(res.assets[0].uri);
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
      const resp = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'MeetClique/1.0 (compatible)' }
      });
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
      setCityResults(mapped);
    } catch (err) {
      console.error('Error fetching city suggestions:', err);
      setCityResults([]);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !description || !city || !category) {
      Alert.alert('Missing fields', 'Please fill all required fields');
      return;
    }
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('city', city);
      formData.append('category', category);
      if (imageUri) {
        formData.append('image', { uri: imageUri, name: 'group.jpg', type: 'image/jpeg' } as any);
      }
      const res = await postAuth(router, '/creategroup', formData, { 'Content-Type': 'multipart/form-data' });
      if (res && res.status === 200) {
        Alert.alert('Success', 'Group created');
        router.push('/tabs/groups');
      } else {
        Alert.alert('Error', res.message || 'Failed to create group');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network or server error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-gray-700/50 bg-gray-800/30">
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-green-600/20 p-2 rounded-full">
              <Ionicons name={"people"} size={24} color="#22c55e" />
            </View>
            <Text className="text-white text-xl font-bold">Create Group</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleCreate} disabled={isCreating} className={`px-4 py-2 rounded-full ${isCreating ? 'bg-gray-600' : 'bg-blue-600'}`}>
              <Text className="text-white font-bold text-sm">{isCreating ? 'Creating...' : 'Create'}</Text>
            </TouchableOpacity>
            {onCancel && (
              <TouchableOpacity onPress={onCancel}>
                <Ionicons name="close-circle" size={30} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="text-outline" size={18} color="#3B82F6" />
              <Text className="text-gray-300 text-sm font-semibold">Group Name *</Text>
            </View>
            <TextInput
              className="w-full text-white text-base px-0 py-1"
              value={name}
              onChangeText={setName}
              placeholder="Enter group name"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
              <Text className="text-gray-300 text-sm font-semibold">Description *</Text>
            </View>
            <TextInput
              className="w-full text-white text-base px-0 py-1 min-h-[80px]"
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us about your group here"
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
            />
          </View>
          
        <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="business" size={18} color="#3B82F6" />
                <Text className="text-gray-300 text-sm font-semibold">City *</Text>
            </View>
            <TouchableOpacity
                className="w-full bg-gray-900/50 px-4 py-3 rounded-xl flex-row items-center justify-between"
                onPress={() => setShowCityPicker(!showCityPicker)}
                activeOpacity={0.7}
            >
                <View className="flex-row items-center gap-3">
                <Text className='text-white text-base'>{city || 'Select city'}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            {showCityPicker && (
                <View className="mt-2 p-2 bg-gray-900 rounded-xl">
                <TextInput
                    value={cityQuery}
                    onChangeText={(v) => { setCityQuery(v); fetchCitySuggestions(v); }}
                    placeholder="Search for a city..."
                    placeholderTextColor="#6B7280"
                    className="text-white px-3 py-2 rounded-md bg-gray-800/40 mb-2"
                />
                <ScrollView style={{ maxHeight: 180 }}>
                    {cityResults.map((c) => (
                    <TouchableOpacity key={c.id} className="py-2 px-2 rounded-md" onPress={() => { setCity(c.name); setShowCityPicker(false); setCityQuery(''); setCityResults([]); }}>
                        <Text className="text-white">{c.name}</Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
                </View>
            )}
        </View>

        <View className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3 mb-4">
          <Text className="text-gray-300 mb-2 mt-4">Category</Text>
          <View className="flex-row gap-2 mb-3 flex-wrap">
            {['Fun','Travel','Hobbies','Learning','Food','Other'].map(cat => (
              <TouchableOpacity key={cat} onPress={() => setCategory(cat)} className={`px-3 py-2 rounded-md ${category===cat ? 'bg-blue-600' : 'bg-gray-800/40'}`}>
                <Text className={`${category===cat ? 'text-white' : 'text-gray-300'}`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

          <Text className="text-gray-300 mb-2 mt-4">Image (optional)</Text>
          {!imageUri ? (
            <TouchableOpacity
              className="w-full h-48 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center"
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <View className="bg-blue-600/20 p-4 rounded-full mb-3">
                <Ionicons name="cloud-upload-outline" size={40} color="#3B82F6" />
              </View>
              <Text className="text-white text-base font-semibold">Upload Group Image</Text>
              <Text className="text-gray-400 text-sm mt-1">Tap to select from gallery</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 160, borderRadius: 12 }} />
            </TouchableOpacity>
          )}
      </ScrollView>
    </View>
  );
}
