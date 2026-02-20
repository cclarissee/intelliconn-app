import { Feather, FontAwesome } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import {
  removeGlobalConnectedAccount,
  saveGlobalConnectedAccount,
} from '../lib/connectedAccounts';
import { getTwitterUserInfo } from '../lib/twitterAuth';

interface ConnectedAccountsModalProps {
  visible: boolean;
  onClose: () => void;
  connectedAccounts: {
    facebook: boolean;
    instagram: boolean;
    twitter: boolean;
  };
  onUpdateAccounts: (accounts: {
    facebook?: boolean;
    instagram?: boolean;
    twitter?: boolean;
  }) => void;
  onOpenManualToken: () => void;
  facebookLoading: boolean;
  twitterLoading: boolean;
  setFacebookLoading: (loading: boolean) => void;
  setTwitterLoading: (loading: boolean) => void;
  user: any;
  db: any;
  isSuperAdmin?: boolean;
}

export default function ConnectedAccountsModal({
  visible,
  onClose,
  connectedAccounts,
  onUpdateAccounts,
  onOpenManualToken,
  facebookLoading,
  twitterLoading,
  setFacebookLoading,
  setTwitterLoading,
  user,
  db,
  isSuperAdmin = false,
}: ConnectedAccountsModalProps) {
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleFacebookConnect = async () => {
    if (!isSuperAdmin) {
      Alert.alert('Super Admin Only');
      return;
    }
    onOpenManualToken();
  };

  const handleFacebookDisconnect = async () => {
    if (!user || !isSuperAdmin) return;
    setFacebookLoading(true);
    try {
      await removeGlobalConnectedAccount('facebook');
      onUpdateAccounts({ facebook: false, instagram: false });
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleTwitterConnect = async () => {
    if (!user || !isSuperAdmin) return;
    setTwitterLoading(true);
    try {
      const userInfo = await getTwitterUserInfo();
      if (userInfo?.data) {
        await saveGlobalConnectedAccount(
          'twitter',
          {
            platform: 'twitter',
            connected: true,
            accountId: userInfo.data.id,
            accountName: userInfo.data.username,
            permissions: ['tweet.read', 'tweet.write', 'users.read'],
          },
          user.uid
        );
        onUpdateAccounts({ twitter: true });
      }
    } finally {
      setTwitterLoading(false);
    }
  };

  const handleTwitterDisconnect = async () => {
    if (!user || !isSuperAdmin) return;
    setTwitterLoading(true);
    try {
      await removeGlobalConnectedAccount('twitter');
      onUpdateAccounts({ twitter: false });
    } finally {
      setTwitterLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 26,
          maxHeight: '92%',
          paddingTop: 30,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        {/* CLOSE BUTTON */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <Feather name="x" size={20} color="#374151" />
        </TouchableOpacity>

        {/* HEADER */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            textAlign: 'center',
            color: textColor,
            marginBottom: 6,
          }}
        >
          Social Accounts
        </Text>

        <Text
          style={{
            fontSize: 14,
            textAlign: 'center',
            color: '#6B7280',
            marginBottom: 28,
          }}
        >
          Connect platforms to publish and track engagement
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* FACEBOOK CARD */}
          <View style={cardStyle('#EFF6FF', '#BFDBFE')}>
            {iconCircle('#1877F2', 'facebook')}
            <Text style={titleStyle}>Facebook</Text>
            <Text style={descStyle}>
              Connect your Facebook Pages to post and track engagement
            </Text>
            {connectedAccounts.facebook ? (
              <>
                {connectedPill()}
                {disconnectButton(
                  handleFacebookDisconnect,
                  facebookLoading
                )}
              </>
            ) : (
              connectButton(handleFacebookConnect, facebookLoading, '#2563EB')
            )}
          </View>

          {/* INSTAGRAM */}
          <View style={cardStyle('#FDF2F8', '#FBCFE8')}>
            {iconCircle('#E4405F', 'instagram')}
            <Text style={titleStyle}>Instagram</Text>
            <Text style={descStyle}>
              Connect your Instagram Business account
            </Text>
            {connectedAccounts.instagram ? (
              <>
                {connectedPill()}
                {disconnectButton(() =>
                  onUpdateAccounts({ instagram: false })
                )}
              </>
            ) : (
              connectButton(
                () => onUpdateAccounts({ instagram: true }),
                false,
                '#E4405F'
              )
            )}
          </View>

          {/* TWITTER */}
          <View style={cardStyle('#EFF6FF', '#BFDBFE')}>
            {iconCircle('#000', 'twitter')}
            <Text style={titleStyle}>Twitter / X</Text>
            <Text style={descStyle}>
              Connect your Twitter account to post tweets
            </Text>
            {connectedAccounts.twitter ? (
              <>
                {connectedPill()}
                {disconnectButton(
                  handleTwitterDisconnect,
                  twitterLoading
                )}
              </>
            ) : (
              connectButton(handleTwitterConnect, twitterLoading, '#000')
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/* ---------- UI HELPERS ---------- */

const cardStyle = (bg: string, border: string) => ({
  backgroundColor: bg,
  borderWidth: 1.2,
  borderColor: border,
  borderRadius: 22,
  padding: 24,
  marginBottom: 24,
  alignItems: 'center' as const,
});

const iconCircle = (color: string, name: any) => (
  <View
    style={{
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 6,
    }}
  >
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FontAwesome name={name} size={24} color="#fff" />
    </View>
  </View>
);

const titleStyle = {
  fontSize: 18,
  fontWeight: '600' as const,
  marginBottom: 6,
};

const descStyle = {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center' as const,
  marginBottom: 16,
  paddingHorizontal: 10,
};

const connectedPill = () => (
  <View
    style={{
      width: '100%',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#86EFAC',
      backgroundColor: '#DCFCE7',
      alignItems: 'center',
      marginBottom: 12,
    }}
  >
    <Text style={{ color: '#16A34A', fontWeight: '600' }}>
      ✓ Connected
    </Text>
  </View>
);

const disconnectButton = (onPress: any, loading = false) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: '100%',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FCA5A5',
      backgroundColor: '#FEF2F2',
      alignItems: 'center',
    }}
  >
    <Text style={{ color: '#DC2626', fontWeight: '600' }}>
      {loading ? 'Disconnecting...' : 'Disconnect'}
    </Text>
  </TouchableOpacity>
);

const connectButton = (
  onPress: any,
  loading = false,
  color = '#2563EB'
) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: '100%',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: color,
      alignItems: 'center',
    }}
  >
    <Text style={{ color, fontWeight: '600' }}>
      {loading ? 'Connecting...' : '+ Connect'}
    </Text>
  </TouchableOpacity>
);
