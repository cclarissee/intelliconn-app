import { RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    View
} from 'react-native';

interface CustomRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  tintColor?: string;
  progressBackgroundColor?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const REFRESH_DRAG_LIMIT = SCREEN_HEIGHT / 2.5; // Allow drag to ~40% of screen height (roughly middle-ish)
const REFRESH_TRIGGER_THRESHOLD = 80;

export default function CustomRefreshControl({
  refreshing,
  onRefresh,
  tintColor = '#6366F1',
  progressBackgroundColor = '#fff',
}: CustomRefreshControlProps) {
  const [isRefreshTriggered, setIsRefreshTriggered] = useState(false);
  const dragY = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !refreshing && !isRefreshTriggered,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0 && !refreshing;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          const clamped = Math.min(gestureState.dy, REFRESH_DRAG_LIMIT);
          dragY.setValue(clamped);

          // Show spinner as user pulls down
          if (clamped > 0) {
            opacityAnim.setValue(Math.min(clamped / REFRESH_TRIGGER_THRESHOLD, 1));
            // Rotate spinner based on drag distance
            const rotation = (clamped / REFRESH_DRAG_LIMIT) * 180;
            spinAnim.setValue(rotation);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > REFRESH_TRIGGER_THRESHOLD) {
          setIsRefreshTriggered(true);
          // Snap to full position
          Animated.spring(dragY, {
            toValue: 100,
            useNativeDriver: false,
          }).start();

          // Start continuous spin animation
          startSpinAnimation();
          onRefresh();
        } else {
          // Snap back to top
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: false,
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
      dragY.setValue(100);
      startSpinAnimation();
      // Pulse effect during refresh
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
    <View style={{ position: 'relative' }}>
      {/* Custom Refresh Indicator */}
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
          <RefreshCw size={24} color={tintColor} strokeWidth={2.5} />
        </Animated.View>
      </Animated.View>

      {/* Pan Responder Area - Invisible but touchable */}
      <View
        {...panResponder.panHandlers}
        style={{
          height: REFRESH_TRIGGER_THRESHOLD,
          backgroundColor: 'transparent',
        }}
      />
    </View>
  );
}
