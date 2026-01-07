import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type EventBottomMenuProps = {
    visible: boolean,
    onEdit: () => void,
    onDelete: () => void,
    onCancel: () => void,
    title?: string,
};

const EventBottomMenu: React.FC<EventBottomMenuProps> = ({ visible, onEdit, onDelete, onCancel, title }) => {
    const sheetRef = useRef<BottomSheet>(null);

    useEffect(() => {
        if (visible) {
            sheetRef.current?.snapToIndex(0);
        } else {
            sheetRef.current?.close();
        }
    }, [visible]);

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={['35%']}
            enablePanDownToClose={false}
            backgroundStyle={{ backgroundColor: '#0f0f0f' }}
            handleIndicatorStyle={{ backgroundColor: '#888' }}
        >
            <BottomSheetView>
                <View className='flex-col justify-between items-center p-4'>
                    <Text className='text-xl text-white font-bold'>{title || 'Options'}</Text>
                </View>
                <View className='flex-col justify-between items-stretch'>
                    <TouchableOpacity className='p-4 border-b border-gray-700 flex-row justify-center' onPress={onEdit}>
                        <Text className='text-lg text-center text-white'>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='p-4 border-b border-gray-700 flex-row justify-center' onPress={onDelete}>
                        <Text className='text-lg text-center text-red-400'>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='p-4 flex-row justify-center' onPress={onCancel}>
                        <Text className='text-lg text-center text-white'>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};

export default EventBottomMenu;


