import { useRef, useState } from 'react';
import { Animated } from 'react-native';

export interface UseAnimatedRefreshReturn {
  spinAnim: Animated.Value;
  pulseAnim: Animated.Value;
  scaleAnim: Animated.Value;
  glowAnim: Animated.Value;
  isAnimating: boolean;
  startAnimation: () => void;
  stopAnimation: () => void;
}

export function useAnimatedRefresh(): UseAnimatedRefreshReturn {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 360,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
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

    // Scale in animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const stopAnimation = () => {
    if (!isAnimating) return;
    
    spinAnim.stopAnimation();
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();

    // Fade out animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      spinAnim.setValue(0);
      scaleAnim.setValue(1);
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
      setIsAnimating(false);
    });
  };

  return {
    spinAnim,
    pulseAnim,
    scaleAnim,
    glowAnim,
    isAnimating,
    startAnimation,
    stopAnimation,
  };
}
