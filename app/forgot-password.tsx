import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../firebase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your registered email address.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, email.trim());

      setMessage(
        'Check your inbox. If the email is registered, you’ll find a link there.'
      );

      setTimeout(() => setMessage(''), 4000);

    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('This email is not registered in our system.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError('Something went wrong. Please try again.');
      }

      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#DBEAFE', '#FFFFFF', '#FEF3C7']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            No problem—type email to start recovery process.
          </Text>

          {/* SUCCESS MESSAGE */}
          {message ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.successText}>{message}</Text>
            </View>
          ) : null}

          {/* ERROR MESSAGE */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#1E3A8A"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.disabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.buttonText}> Send Reset Link</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  backText: {
    marginLeft: 6,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },

  subtitle: {
    textAlign: 'center',
    color: '#475569',
    marginBottom: 25,
    marginTop: 8,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 12,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#93C5FD',
    marginBottom: 20,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
  },

  button: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 22,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  disabled: {
    opacity: 0.6,
  },

  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 14,
    borderRadius: 14,
    marginBottom: 15,
  },

  successText: {
    color: '#166534',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 15,
  },

  errorText: {
    color: '#B91C1C',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});
