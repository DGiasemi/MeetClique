import React, { useState } from 'react';
import UploadEvent from '@/components/UploadEvent/uploadEvent';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Add() {
  const [selection, setSelection] = useState<string | null>(null);

  if (!selection) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-white text-2xl font-bold mb-6">Create</Text>
        <TouchableOpacity className="w-full bg-blue-600 py-4 rounded-xl mb-4 flex-row items-center justify-center" onPress={() => setSelection('event')}>
          <Text className="text-white font-bold">Event</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-full bg-purple-600 py-4 rounded-xl flex-row items-center justify-center" onPress={() => setSelection('hangout')}>
          <Text className="text-white font-bold">Hangout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <UploadEvent itemType={selection} onCancel={() => setSelection(null)} />;
}