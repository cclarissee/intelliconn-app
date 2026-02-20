import { router } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { useThemeColor } from '../hooks/use-theme-color';
import { defaultTerms, normalizeTerms, TermsContent } from '../lib/terms';

export default function TermsAcceptScreen() {
  const { user, loading } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const [terms, setTerms] = useState<TermsContent>(defaultTerms);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const termsRef = useMemo(() => doc(db, 'legal', 'termsOfService'), []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    let isMounted = true;
    setLoadingTerms(true);
    setErrorMessage(null);
    setAgreeChecked(false);

    const loadTerms = async () => {
      try {
        const termsSnap = await getDoc(termsRef);
        const nextTerms = termsSnap.exists() ? normalizeTerms(termsSnap.data()) : defaultTerms;

        if (isMounted) {
          setTerms(nextTerms);
        }

        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const acceptedVersion = userSnap.exists() ? userSnap.data().termsAcceptedVersion : null;
        if (acceptedVersion === nextTerms.version) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        if (isMounted) {
          setTerms(defaultTerms);
          setErrorMessage('Unable to load the latest terms. Showing the default version.');
        }
      } finally {
        if (isMounted) {
          setLoadingTerms(false);
        }
      }
    };

    loadTerms();

    return () => {
      isMounted = false;
    };
  }, [loading, user, termsRef]);

  const handleAccept = async () => {
    if (!user || accepting || !agreeChecked) return;
    setAccepting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        termsAcceptedVersion: terms.version,
        termsAcceptedAt: serverTimestamp(),
      });
      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage('Unable to record acceptance. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cardBackground,
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, marginBottom: 6 }}>
        {terms.title}
      </Text>
      <Text style={{ fontSize: 12, color: iconColor, marginBottom: 16 }}>
        Version {terms.version}
      </Text>

      <ScrollView style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
          <Text style={{ fontWeight: '600' }}>Last Updated: {terms.lastUpdated}</Text>
        </Text>

        {loadingTerms ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator color={tintColor} />
          </View>
        ) : (
          terms.sections.map((section) => (
            <Text
              key={section.title}
              style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}
            >
              <Text style={{ fontWeight: '600' }}>{section.title}{"\n"}</Text>
              {section.body}
            </Text>
          ))
        )}
      </ScrollView>

      {errorMessage ? (
        <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 8 }}>
          {errorMessage}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={() => setAgreeChecked((prev) => !prev)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 16,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: agreeChecked ? tintColor : iconColor,
            backgroundColor: agreeChecked ? tintColor : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          {agreeChecked ? (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>X</Text>
          ) : null}
        </View>
        <Text style={{ fontSize: 13, color: textColor }}>
          I have read and agree to the Terms of Service.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleAccept}
        disabled={!agreeChecked || accepting}
        style={{
          marginTop: 16,
          backgroundColor: tintColor,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
          opacity: (!agreeChecked || accepting) ? 0.6 : 1,
        }}
      >
        {accepting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600' }}>Accept and Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
