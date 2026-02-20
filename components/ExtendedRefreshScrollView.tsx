import { RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    GestureResponderEvent,
    PanResponder,
    PanResponderGestureState,
    RefreshControl,
    ScrollView,
    ScrollViewProps,
    View,
} from 'react-native';

interface ExtendedRefreshScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  tintColor?: string;
  progressBackgroundColor?: string;
  children?: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Allow drag to roughly the middle of screen (or a bit above)
const REFRESH_DRAG_LIMIT = SCREEN_HEIGHT * 0.35;
const REFRESH_TRIGGER_THRESHOLD = 100;

export default function ExtendedRefreshScrollView({
  refreshing,
  onRefresh,
  tintColor = '#6366F1',
  progressBackgroundColor = '#fff',
  children,
  ...scrollViewProps
}: ExtendedRefreshScrollViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isRefreshTriggered, setIsRefreshTriggered] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const dragY = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        return scrollPosition === 0 && Math.abs(gestureState.dy) > 2;
      },
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        return (
          scrollPosition === 0 &&
          Math.abs(gestureState.dy) > 5 &&
          gestureState.dy > 0 &&
          !refreshing
        );
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (gestureState.dy > 0 && scrollPosition === 0) {
          const clamped = Math.min(gestureState.dy, REFRESH_DRAG_LIMIT);
          dragY.setValue(clamped);

          // Show spinner as user pulls down
          if (clamped > 0) {
            opacityAnim.setValue(Math.min(clamped / REFRESH_TRIGGER_THRESHOLD, 1));
            // Rotate spinner based on drag distance
            const rotation = (clamped / REFRESH_DRAG_LIMIT) * 360;
            spinAnim.setValue(rotation);
          }
        }
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (gestureState.dy > REFRESH_TRIGGER_THRESHOLD && scrollPosition === 0) {
          setIsRefreshTriggered(true);
          // Snap to indicator height
          Animated.spring(dragY, {
            toValue: 120,
            useNativeDriver: false,
          }).start();

          // Start continuous spin animation
          startSpinAnimation();
          onRefresh();
        } else {
          // Snap back smoothly
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: false,
            friction: 7,
            tension: 40,
          }).start(() => {
            opacityAnim.setValue(0);
            spinAnim.setValue(0);
          });
        }
      },
    })
  ).current;

  const startSpinAnimation = () => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 360,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  useEffect(() => {
    if (refreshing) {
      setIsRefreshTriggered(true);
      dragY.setValue(120);
      startSpinAnimation();
      // Pulse effect during refresh
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations when refresh completes
      spinAnim.stopAnimation();
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      Animated.timing(dragY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        setIsRefreshTriggered(false);
        opacityAnim.setValue(0);
        spinAnim.setValue(0);
      });
    }
  }, [refreshing]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {/* Custom Pull-to-Refresh Header */}
      <Animated.View
        style={{
          height: dragY,
          overflow: 'hidden',
          opacity: opacityAnim,
          backgroundColor: progressBackgroundColor,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 16,
        }}
      >
        <Animated.View
          style={{
            transform: [
              { rotate: spinInterpolate },
              { scale: pulseAnim },
            ],
          }}
        >
          <RefreshCw size={28} color={tintColor} strokeWidth={2.5} />
        </Animated.View>
      </Animated.View>

      {/* ScrollView with built-in RefreshControl as fallback */}
      <ScrollView
        ref={scrollViewRef}
        onScroll={(e) => {
          const currentOffset = e.nativeEvent.contentOffset.y;
          setScrollPosition(currentOffset);
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
            enabled={scrollPosition === 0}
          />
        }
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}
