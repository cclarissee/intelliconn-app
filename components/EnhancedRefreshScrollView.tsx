import { RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    RefreshControl,
    ScrollView,
    ScrollViewProps,
    View,
} from 'react-native';

interface EnhancedRefreshScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  tintColor?: string;
  progressBackgroundColor?: string;
  children?: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Allow drag to the middle area of the screen (around 40%)
const REFRESH_DRAG_LIMIT = SCREEN_HEIGHT * 0.4;
const REFRESH_TRIGGER_THRESHOLD = 120;

export default function EnhancedRefreshScrollView({
  refreshing,
  onRefresh,
  tintColor = '#6366F1',
  progressBackgroundColor = '#fff',
  children,
  contentContainerStyle,
  scrollEventThrottle = 16,
  onScroll,
  ...scrollViewProps
}: EnhancedRefreshScrollViewProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [manualScroll, setManualScroll] = useState(false);
  const dragY = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const lastGestureY = useRef(0);

  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    setScrollPosition(contentOffset.y);
    setManualScroll(true);
    onScroll?.(event);
  };

  // Simulate drag-to-refresh
  const startSpinAnimation = () => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 360,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  };

  useEffect(() => {
    if (refreshing) {
      dragY.setValue(REFRESH_TRIGGER_THRESHOLD);
      startSpinAnimation();

      // Pulse effect during refresh
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Scale animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Show opacity
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations when refresh completes
      spinAnim.stopAnimation();
      pulseAnim.stopAnimation();

      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        pulseAnim.setValue(1);
        spinAnim.setValue(0);
        dragY.setValue(0);
      });
    }
  }, [refreshing]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Custom Pull-to-Refresh Header with Enhanced Animation */}
      <Animated.View
        style={{
          height: Animated.add(
            Animated.multiply(
              Animated.divide(dragY, REFRESH_TRIGGER_THRESHOLD),
              new Animated.Value(REFRESH_TRIGGER_THRESHOLD)
            ),
            new Animated.Value(0)
          ),
          overflow: 'hidden',
          backgroundColor: progressBackgroundColor,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 16,
          minHeight: 0,
        }}
      >
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [
              { rotate: spinInterpolate },
              { scale: pulseAnim },
              { scale: scaleAnim },
            ],
          }}
        >
          <RefreshCw
            size={32}
            color={tintColor}
            strokeWidth={2.5}
          />
        </Animated.View>
      </Animated.View>

      {/* ScrollView with RefreshControl */}
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
            progressBackgroundColor={progressBackgroundColor}
          />
        }
        contentContainerStyle={contentContainerStyle}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}
