import { router } from 'expo-router';
import { signInWithCredential } from 'firebase/auth';
import { useEffect } from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { auth } from '../firebase';
import { getFacebookCredential, useFacebookAuth } from '../lib/facebookAuth';

export default function FacebookLogin() {
  const [request, response, promptAsync] = useFacebookAuth();

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const { accessToken } = response.authentication;
      const credential = getFacebookCredential(accessToken);

      signInWithCredential(auth, credential)
        .then(() => router.replace('/(tabs)'))
        .catch(err => Alert.alert('Login failed', err.message));
    } else if (response?.type === 'error') {
      Alert.alert('Authentication error', 'Failed to authenticate with Facebook');
    }
  }, [response]);

  return (
    <TouchableOpacity
      disabled={!request}
      onPress={() => promptAsync()}
      style={{ 
        backgroundColor: !request ? '#cccccc' : '#1877F2', 
        padding: 16, 
        borderRadius: 10 
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>
        Continue with Facebook
      </Text>
    </TouchableOpacity>
  );
}
