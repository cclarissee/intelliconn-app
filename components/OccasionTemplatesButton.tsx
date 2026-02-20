import { initializeOccasionTemplates } from '@/lib/occasionTemplates';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface OccasionTemplatesButtonProps {
  colors?: {
    primary?: string;
    accent?: string;
    textSecondary?: string;
  };
}

export default function OccasionTemplatesButton({ colors }: OccasionTemplatesButtonProps) {
  const [loading, setLoading] = useState(false);
  const buttonColor = colors?.accent || colors?.primary || '#4F46E5';
  const textColor = colors?.textSecondary || '#6B7280';

  const handleInitialize = async () => {
    Alert.alert(
      'Initialize Occasion Templates',
      'This will add 17 pre-made templates for holidays, birthdays, anniversaries, milestones, promotions, and seasonal occasions to your database. Continue?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Initialize',
          onPress: async () => {
            try {
              setLoading(true);
              await initializeOccasionTemplates();
              Alert.alert(
                'Success! ✅',
                'Occasion templates have been initialized successfully. You can now use them when creating posts!'
              );
            } catch (error: any) {
              if (
                error.message?.includes('already exist') ||
                error.message?.includes('already exists')
              ) {
                Alert.alert(
                  'Already Initialized',
                  'Occasion templates have already been added to your database.'
                );
              } else {
                Alert.alert(
                  'Error',
                  error.message || 'Failed to initialize templates. Please try again.'
                );
              }
            } finally {
              setLoading(false);
            }
          },
          style: 'default',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={handleInitialize}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonText}> Initializing...</Text>
          </>
        ) : (
          <>
            <Ionicons name="gift-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}> Initialize Occasion Templates</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={[styles.description, { color: textColor }]}>
        Add 17 pre-made templates for holidays, birthdays, anniversaries, milestones, promotions,
        and seasonal occasions
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
