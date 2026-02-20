import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase';
import { useThemeColor } from '../hooks/use-theme-color';
import { defaultTerms, normalizeTerms, TermsContent } from '../lib/terms';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export default function TermsOfServiceModal({ visible, onClose, user }: TermsOfServiceModalProps) {
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const [terms, setTerms] = useState<TermsContent>(defaultTerms);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const termsRef = useMemo(() => doc(db, 'legal', 'termsOfService'), []);

  useEffect(() => {
    if (!visible) return;

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

        if (user) {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          const acceptedVersion = userSnap.exists() ? userSnap.data().termsAcceptedVersion : null;
          if (isMounted) {
            setIsAccepted(acceptedVersion === nextTerms.version);
          }
        } else if (isMounted) {
          setIsAccepted(false);
        }
      } catch (error) {
        if (isMounted) {
          setTerms(defaultTerms);
          setIsAccepted(false);
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
  }, [visible, user, termsRef]);

  const handleAccept = async () => {
    if (!user || accepting || isAccepted) return;
    if (!agreeChecked) {
      setErrorMessage('Please check the agreement box first.');
      return;
    }
    
    setAccepting(true);
    setErrorMessage(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        termsAcceptedVersion: terms.version,
        termsAcceptedAt: serverTimestamp(),
      });
      setIsAccepted(true);
    } catch (error) {
      console.error('Error accepting terms:', error);
      setErrorMessage(`Unable to record acceptance. ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setAccepting(false);
    }
  };

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: cardBackground,
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 500,
          maxHeight: '80%',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, marginBottom: 6 }}>
          {terms.title}
        </Text>
        <Text style={{ fontSize: 12, color: iconColor, marginBottom: 16 }}>
          Version {terms.version}
        </Text>

        <ScrollView style={{ maxHeight: 400 }}>
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
          <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 12, fontWeight: '500' }}>
            ⚠️ {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={() => !isAccepted && setAgreeChecked((prev) => !prev)}
          disabled={isAccepted}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            opacity: isAccepted ? 0.7 : 1,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: (agreeChecked || isAccepted) ? tintColor : iconColor,
              backgroundColor: (agreeChecked || isAccepted) ? tintColor : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            {(agreeChecked || isAccepted) ? (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>✓</Text>
            ) : null}
          </View>
          <Text style={{ fontSize: 13, color: textColor }}>
            I have read and agree to the Terms of Service.
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              backgroundColor: iconColor,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAccept}
            disabled={!agreeChecked || accepting || isAccepted || !user}
            style={{
              flex: 1,
              backgroundColor: tintColor,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              opacity: (!agreeChecked || accepting || isAccepted || !user) ? 0.6 : 1,
            }}
          >
            {accepting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {isAccepted ? 'Accepted' : 'Accept'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

