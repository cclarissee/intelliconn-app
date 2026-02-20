import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Users,
  Wand2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Slide {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: any;
}

const slides: Slide[] = [
  {
    title: 'Grow with AI',
    description:
      'Let IntelliConn nurture your creativity. Generate school-safe posts to connect your community.',
    icon: <Wand2 size={36} color="#166534" />,
    image: require('@/assets/onboarding_first_screen.png'),
  },
  {
    title: 'Plan Your Journey',
    description:
      'Map your posts, set your schedule, and watch your communication flourish — organized and effortless.',
    icon: <Calendar size={36} color="#92400E" />,
    image: require('@/assets/onboarding_second_screen.png'),
  },
  {
    title: 'Create Together',
    description:
      'Collaborate, share ideas, and publish with your team — where every voice adds to your story.',
    icon: <Users size={36} color="#065F46" />,
    image: require('@/assets/onboarding_third_screen.png'),
  },
];

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <LinearGradient
      colors={['#DBEAFE', '#FFFFFF', '#FEF3C7']}
      style={styles.container}
    >
      {/* Skip */}
      <View style={styles.skipContainer}>
        <Pressable onPress={onComplete}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      {/* Image */}
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.imageWrapper}
      >
        <Image source={slide.image} style={styles.image} />
      </Animated.View>

      {/* Card + Dots */}
      <View style={styles.middle}>
        <Animated.View
          key={index}
          entering={SlideInDown.duration(400)}
          style={styles.card}
        >
          <LinearGradient
            colors={['#DBEAFE', '#FEF3C7']}
            style={styles.iconCircle}
          >
            {slide.icon}
          </LinearGradient>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </Animated.View>

        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        <Pressable
          disabled={index === 0}
          onPress={() => setIndex(i => Math.max(i - 1, 0))}
          style={[styles.backBtn, index === 0 && styles.disabled]}
        >
          <ArrowLeft size={16} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (isLast) onComplete();
            else setIndex(i => i + 1);
          }}
          style={styles.nextBtn}
        >
          <Text style={styles.nextText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          {isLast ? <ChevronRight size={16} /> : <ArrowRight size={16} />}
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  skip: {
    color: '#1E40AF',
    fontWeight: '600',
  },

  imageWrapper: {
    height: 240,
    marginHorizontal: 28,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    marginBottom: 30,
  },

  image: {
    marginTop: 20,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  middle: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: 28,
    borderRadius: 32,
    paddingVertical: 30,
    paddingHorizontal: 29,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 12,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 14,
    textAlign: 'center',
  },

  description: {
    fontSize: 15,
    color: '#485563',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 6,
  },

dots: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 26,
  marginBottom: 10,
  gap: 8,
},

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#93C5FD',
  },

  activeDot: {
    backgroundColor: '#2563EB',
    transform: [{ scale: 1.3 }],
  },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },

  backText: {
    color: '#1D4ED8',
    fontWeight: '600',
  },

  disabled: {
    opacity: 0.4,
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#2563EB',
  },

  nextText: {
    color: '#fff',
    fontWeight: '700',
  },
});
