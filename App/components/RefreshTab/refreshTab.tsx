import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import React, { useRef, useState } from 'react';

type Props = {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
};

const THRESHOLD = 100;
const MAX_PULL = 150;

const RefreshTab: React.FC<Props> = ({ onRefresh, children }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5 && !refreshing,
      onPanResponderMove: (_, gesture) => {
        if (!refreshing && gesture.dy > 0) {
          const limitedPull = Math.min(gesture.dy, MAX_PULL);
          translateY.setValue(limitedPull);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > THRESHOLD) {
          setRefreshing(true);
          Animated.timing(translateY, {
            toValue: 60,
            duration: 200,
            useNativeDriver: true,
          }).start();

          const maybePromise = onRefresh();

          const endRefresh = () => {
            Animated.timing(translateY, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setRefreshing(false));
          };

          if (maybePromise instanceof Promise) {
            maybePromise.finally(endRefresh);
          } else {
            endRefresh();
          }
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  };

  return (
    <View onLayout={onLayout}>
      <Animated.View
        style={[{ transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.spinnerContainer}>
          {refreshing && <ActivityIndicator size="small" color="#2196F3" />}
        </View>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RefreshTab;
