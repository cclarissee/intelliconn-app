import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('male');
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);


  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [courseError, setCourseError] = useState('');
  const [schoolError, setSchoolError] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const getGenderImage = (gender: string) => {
    if (gender.toLowerCase() === 'male') return require('../assets/profile/male.png');
    if (gender.toLowerCase() === 'female') return require('../assets/profile/female.png');
    return require('../assets/profile/other-gender-icon.png');
  };

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const upper = /[A-Z]/;
    const lower = /[a-z]/;
    const number = /[0-9]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;

    if (pwd.length < minLength) return 'At least 8 characters';
    if (!upper.test(pwd)) return 'Include at least one uppercase letter';
    if (!lower.test(pwd)) return 'Include at least one lowercase letter';
    if (!number.test(pwd)) return 'Include at least one number';
    if (!special.test(pwd)) return 'Include at least one special character';
    return '';
  };

  const handleSignup = async () => {
    let hasError = false;

    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setCourseError('');
    setSchoolError('');
    setSuccessMessage('');

    if (!username) { setUsernameError('Username is required'); hasError = true; }
    if (!email) { setEmailError('Email is required'); hasError = true; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email address'); hasError = true; }

    const pwdError = validatePassword(password);
    if (!password) { setPasswordError('Password is required'); hasError = true; }
    else if (pwdError) { setPasswordError(pwdError); hasError = true; }

    if (!confirmPassword) { setConfirmPasswordError('Confirm your password'); hasError = true; }
    else if (password !== confirmPassword) { setConfirmPasswordError('Passwords do not match'); hasError = true; }

    if (!school) { setSchoolError('Select a school'); hasError = true; }
    if (!course) { setCourseError('Select a course'); hasError = true; }

    if (hasError) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        username,
        gender,
        school,
        course,
        role: 'user',
        createdAt: serverTimestamp(),
      });

      setSuccessMessage('Successfully created your account!');

      setTimeout(() => router.replace('/login'), 4000);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setEmailError('Email is already in use');
      else if (err.code === 'auth/invalid-email') setEmailError('Invalid email address');
      else if (err.code === 'auth/weak-password') setPasswordError('Password is too weak');
      else setEmailError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.innerContainer}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00796b" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        {successMessage ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.title}>Create Account</Text>

        <View style={styles.card}>
          {/* Profile Image */}
          <View style={styles.genderPreviewContainer}>
            <Image
              source={getGenderImage(gender)}
              style={styles.genderImage}
              resizeMode="contain"
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    placeholder="Password"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={securePassword}
  />
  <TouchableOpacity onPress={() => setSecurePassword(!securePassword)}>
    <Ionicons
      name={securePassword ? 'eye-off' : 'eye'}
      size={20}
      color="#1E3A8A"
    />
  </TouchableOpacity>
</View>

          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    placeholder="Confirm Password"
    value={confirmPassword}
    onChangeText={setConfirmPassword}
    secureTextEntry={secureConfirmPassword}
  />
  <TouchableOpacity onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}>
    <Ionicons
      name={secureConfirmPassword ? 'eye-off' : 'eye'}
      size={20}
      color="#1E3A8A"
    />
  </TouchableOpacity>
</View>

          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

          <View style={styles.genderSelector}>
            {['male', 'female', 'neutral'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
                onPress={() => setGender(g as any)}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === g && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  {g === 'neutral' ? 'LGBTQ+' : g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={school}
              onValueChange={(itemValue) => setSchool(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select School" value="" />
              <Picker.Item label="PMFTCI" value="PMFTCI" />
            </Picker>
          </View>
          {schoolError ? <Text style={styles.errorText}>{schoolError}</Text> : null}

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={course}
              onValueChange={(itemValue) => setCourse(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Course" value="" />
              <Picker.Item label="School of Business" value="School of Business" enabled={false} />
              <Picker.Item label="School of Education / AIS" value="School of Education / AIS" enabled={false} />
              <Picker.Item label="School of Tourism Management" value="School of Tourism Management" enabled={false} />
              <Picker.Item label="School of Computer Studies" value="School of Computer Studies" enabled={true} />
              <Picker.Item label="School of Hospitality" value="School of Hospitality" enabled={false} />
              <Picker.Item label="School of Criminology" value="School of Criminology" enabled={false} />
            </Picker>
          </View>
          {courseError ? <Text style={styles.errorText}>{courseError}</Text> : null}

        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#DBEAFE' // soft blue background
  },

  innerContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  /* ---------------- BACK BUTTON ---------------- */

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },

  backText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },

/* ---------------- SUCCESS ---------------- */

successContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#DCFCE7',
  padding: 14,
  borderRadius: 14,
  width: '100%',
  marginBottom: 15,
  borderWidth: 1,
  borderColor: '#86EFAC',
},

successText: {
  color: '#166534', 
  fontWeight: '700',
  fontSize: 15,
  marginLeft: 8,
  flex: 1,
},


  /* ---------------- TITLE ---------------- */

  title: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: '#1E3A8A' 
  },

  /* ---------------- CARD ---------------- */

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },

  /* ---------------- INPUTS ---------------- */

  input: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 5,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },

  errorText: { 
    color: '#DC2626', 
    marginBottom: 10, 
    fontSize: 14 
  },

  /* ---------------- PASSWORD ---------------- */
  passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#EFF6FF',
  borderRadius: 14,
  paddingHorizontal: 14,
  marginBottom: 5,
  borderWidth: 1.5,
  borderColor: '#BFDBFE',
},

passwordInput: {
  flex: 1,
  paddingVertical: 14,
  fontSize: 16,
},


  /* ---------------- BUTTON ---------------- */

  button: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: SCREEN_WIDTH - 40,
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },

  /* ---------------- GENDER IMAGE ---------------- */

  genderPreviewContainer: { 
    alignItems: 'center', 
    marginBottom: 18, 
    marginTop: 8 
  },

  genderImage: { 
    width: 100, 
    height: 90, 
    borderRadius: 40 
  },

  /* ---------------- GENDER SELECTOR ---------------- */

  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 8,
  },

  genderButton: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  genderButtonSelected: { 
    backgroundColor: '#2563EB' 
  },

  genderText: { 
    color: '#1E3A8A', 
    fontWeight: '600' 
  },

  /* ---------------- PICKER ---------------- */

  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    marginBottom: 6,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
  },

  picker: { 
    width: '100%', 
    height: 50 
  },
});
