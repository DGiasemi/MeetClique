import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import log from '@/utils/logger';

const ProfileSettings: React.FC<{ visible: boolean, onClose: () => void }> = ({ visible, onClose }) => {
    const sheetRef = useRef<BottomSheet>(null);

    React.useEffect(() => {
        if (visible) {
            sheetRef.current?.expand();
        } else {
            sheetRef.current?.close();
        }
    }, [visible]);

    return (
        <View className='absolute top-0 left-0 right-0 bottom-0 z-50' pointerEvents={visible ? 'auto' : 'none'}>
            {visible && (
                <TouchableOpacity
                    className='absolute top-0 left-0 right-0 bottom-0'
                    onPress={onClose}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                />
            )}
            <BottomSheet
                ref={sheetRef}
                index={-1}
                snapPoints={['50%']}
                enablePanDownToClose={true}
                backgroundStyle={{ backgroundColor: '#0f0f0f' }}
                handleIndicatorStyle={{ backgroundColor: '#888' }}
                onClose={onClose}
            >
                <BottomSheetView>
                    <View className='flex-col justify-between items-center p-4'>
                        <TouchableOpacity className='p-4 border-b border-red-500 flex-row w-full justify-between z-50' onPress={() => { log.info('Block User pressed'); }}>
                            <Text className='text-lg text-center text-white'>Block User</Text>
                            <Ionicons name="ban" size={24} color="white" className='text-center' />
                        </TouchableOpacity>
                        <TouchableOpacity className='p-4 border-b border-red-500 flex-row w-full justify-between' onPress={() => { }}>
                            <Text className='text-lg text-center text-white'>Report User</Text>
                            <Ionicons name="flag" size={24} color="white" className='text-center' />
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
};

export default ProfileSettings;