import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { auth, db } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /* ---------------- LOAD REMEMBERED EMAIL ---------------- */

  useEffect(() => {
    const loadRememberedUser = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.log('Failed to load remembered email');
      }
    };

    loadRememberedUser();
  }, []);

  /* ---------------- PREMIUM CARD ANIMATION ---------------- */

  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);

  useEffect(() => {
    translateY.value = withDelay(
      300,
      withSpring(0, { damping: 20, stiffness: 110 })
    );

    opacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );

    scale.value = withDelay(300, withTiming(1, { duration: 800 }));
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
  transform: [
    { translateY: translateY.value },
    { scale: scale.value },
  ] as any,
  opacity: opacity.value,
}));

  /* ---------------- GOOGLE AUTH ---------------- */

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.select({
      ios: '<YOUR_IOS_CLIENT_ID>',
      android: '<YOUR_ANDROID_CLIENT_ID>',
      web: '<YOUR_WEB_CLIENT_ID>',
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (!token) return;

      const credential = GoogleAuthProvider.credential(token);
      signInWithCredential(auth, credential)
        .then(() => router.replace('/(tabs)'))
        .catch(() => setLoginError('Google sign-in failed'));
    }
  }, [response]);

  /* ---------------- VALIDATION ---------------- */

  const validateInputs = () => {
    let hasError = false;

    setEmailError('');
    setPasswordError('');
    setLoginError('');
    setSuccessMessage('');

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Minimum 8 characters required');
      hasError = true;
    }

    return hasError;
  };

  /* ---------------- EMAIL LOGIN ---------------- */

  const handleLogin = async () => {
    if (validateInputs()) return;

    try {
      setLoading(true);
      setLoginError('');
      setSuccessMessage('');

      const userCredential = await signInWithEmailAndPassword(
  auth,
  email.trim(),
  password
);

const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

if (!userDoc.exists()) {
  await auth.signOut();
  setLoginError(
    'Your account has been removed by admin. Please contact support or sign up again.'
  );
  return;
}

if (rememberMe) {
  await AsyncStorage.setItem('rememberedEmail', email.trim());
} else {
  await AsyncStorage.removeItem('rememberedEmail');
}

setSuccessMessage('Login Successful! You are now signed in.');

setTimeout(() => {
  router.replace('/(tabs)');
}, 1500);


} catch (err: any) {
  if (err.code === 'auth/user-not-found') {
    setLoginError(
      'This account no longer exists. It may have been removed. Please sign up again or contact your administrator.'
    );
  } else if (err.code === 'auth/wrong-password') {
    setLoginError(
      'Incorrect password. Please try again.'
    );
  } else if (err.code === 'auth/invalid-credential') {
    setLoginError(
      'Invalid login credentials. Please check email and password.'
    );
  } else if (err.code === 'auth/too-many-requests') {
    setLoginError(
      'Too many login attempts. Please try again later.'
    );
  } else {
    setLoginError(
      'Login failed. Please try again.'
    );
  }
} finally {
  setLoading(false);
}
  };

  /* ---------------- UI ---------------- */

  return (
    <LinearGradient
      colors={['#DBEAFE', '#FFFFFF', '#FEF3C7']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/images/intelliconn-app.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome to IntelliConn</Text>
          <Text style={styles.subtitle}>
            Smart social media management for schools
          </Text>

          {successMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <Animated.View style={[styles.card as any, animatedCardStyle]}>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#6B7280"
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Ionicons
                  name={secureText ? 'eye-off' : 'eye'}
                  size={20}
                  color="#1E3A8A"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checked]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </Pressable>

              <TouchableOpacity
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {loginError ? (
              <Text style={styles.errorText}>{loginError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Text style={styles.googleText}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signup}>
                Don’t have an account? Sign up
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}


/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrapper: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 110, height: 110, borderRadius: 10 },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },

  subtitle: {
    textAlign: 'center',
    color: '#374151',
    marginBottom: 25,
  },

  successContainer: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },

  successText: {
    color: '#155724',
    fontWeight: '600',
    textAlign: 'center',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#93C5FD',
    marginBottom: 5,
  },

  input: { flex: 1, paddingVertical: 16 },
  passwordInput: { flex: 1, paddingVertical: 16 },

  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  forgot: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checked: { backgroundColor: '#2563EB' },

  rememberText: {
    fontSize: 13,
    color: '#1E3A8A',
  },

  primaryBtn: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 8,
  },

  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#93C5FD',
  },

  dividerText: {
    marginHorizontal: 10,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  googleBtn: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    padding: 16,
    borderRadius: 22,
    alignItems: 'center',
  },

  googleText: {
    fontWeight: '600',
    color: '#1E3A8A',
  },

  signup: {
    textAlign: 'center',
    marginTop: 18,
    color: '#2563EB',
    fontWeight: '600',
  },

  disabled: { opacity: 0.6 },
});
 