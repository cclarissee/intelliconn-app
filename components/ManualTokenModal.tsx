import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import { saveGlobalConnectedAccount } from '../lib/connectedAccounts';
import { getFacebookPages, getInstagramAccounts } from '../lib/facebookAuth';

interface ManualTokenModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export default function ManualTokenModal({
  visible,
  onClose,
  onSuccess,
  user,
}: ManualTokenModalProps) {
  const [manualAccessToken, setManualAccessToken] = useState('');
  const [fetchingPages, setFetchingPages] = useState(false);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [facebookLoading, setFacebookLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'icon');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  /* ---------------- LOGIC (UNCHANGED) ---------------- */

  const handleManualTokenConnect = async () => {
    if (!user) return;
    if (!manualAccessToken.trim()) {
      Alert.alert('Error', 'Please enter an access token');
      return;
    }

    setFetchingPages(true);
    try {
      const pages = await getFacebookPages(manualAccessToken.trim());

      if (pages.length === 0) {
        Alert.alert(
          'No Pages Found',
          'No Facebook pages found for this account. Make sure you have page management permissions.'
        );
        setFetchingPages(false);
        return;
      }

      setFacebookPages(pages);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch Facebook pages. Please check your access token.');
    } finally {
      setFetchingPages(false);
    }
  };

  const handlePageSelection = async (pageId: string) => {
    if (!user) return;
    const selectedPage = facebookPages.find((p) => p.id === pageId);
    if (!selectedPage) return;

    setFacebookLoading(true);
    try {
      await saveGlobalConnectedAccount(
        'facebook',
        {
          platform: 'facebook',
          connected: true,
          accessToken: selectedPage.accessToken,
          pageId: selectedPage.id,
          pageName: selectedPage.name,
          profileImageUrl: selectedPage.profileImageUrl || null,
          permissions: ['pages_manage_posts', 'pages_read_engagement'],
        },
        user.uid
      );

      try {
        const igAccount = await getInstagramAccounts(
          selectedPage.id,
          selectedPage.accessToken
        );
        if (igAccount) {
          await saveGlobalConnectedAccount(
            'instagram',
            {
              platform: 'instagram',
              connected: true,
              accessToken: selectedPage.accessToken,
              accountId: igAccount.id,
              accountName: igAccount.username,
              profileImageUrl: igAccount.profileImageUrl || null,
            },
            user.uid
          );
        }
      } catch {}

      handleClose();
      Alert.alert(
        'Success',
        `Facebook page "${selectedPage.name}" connected for all users!`
      );
      onSuccess();
    } catch {
      Alert.alert('Error', 'Failed to save Facebook connection.');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleClose = () => {
    setManualAccessToken('');
    setFacebookPages([]);
    setSelectedPageId('');
    setFetchingPages(false);
    setFacebookLoading(false);
    onClose();
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
          onPress={handleClose}
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

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: textColor,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            Connect Facebook
          </Text>

          {facebookPages.length === 0 ? (
            <>
              <Text
                style={{
                  fontSize: 14,
                  color: iconColor,
                  marginBottom: 18,
                  textAlign: 'center',
                }}
              >
                Enter Facebook Page access token. You can view it in your Meta Developer Console.
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: textColor,
                  marginBottom: 8,
                }}
              >
                Access Token
              </Text>

              <TextInput
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor,
                  borderRadius: 14,
                  padding: 16,
                  color: textColor,
                  marginBottom: 18,
                  minHeight: 120,
                  textAlignVertical: 'top',
                }}
                multiline
                value={manualAccessToken}
                onChangeText={setManualAccessToken}
                placeholder="Paste Facebook access token here..."
                placeholderTextColor={iconColor}
                editable={!fetchingPages}
              />

              <Text
                style={{
                  fontSize: 12,
                  color: iconColor,
                  marginBottom: 24,
                  lineHeight: 18,
                }}
              >
                To get your access token:{'\n'}
                1. Go to Meta Developer Console. {'\n'}
                2. Select your app.{'\n'}
                3. Go to Tools → Graph API Explorer.{'\n'}
                4. Generate a User Access Token.{'\n'}
                5. Grant permissions: pages_show_list, pages_manage_posts.{'\n'}
                6. Copy and paste the token above.
              </Text>

              <TouchableOpacity
                onPress={handleManualTokenConnect}
                disabled={fetchingPages || !manualAccessToken.trim()}
                style={{
                  backgroundColor: tintColor,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginBottom: 20,
                  opacity:
                    fetchingPages || !manualAccessToken.trim() ? 0.6 : 1,
                }}
              >
                {fetchingPages ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Fetch Pages
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 14,
                  color: iconColor,
                  marginBottom: 18,
                  textAlign: 'center',
                }}
              >
                Select a Facebook page to connect:
              </Text>

              {facebookPages.map((page) => (
                <TouchableOpacity
                  key={page.id}
                  onPress={() => setSelectedPageId(page.id)}
                  style={{
                    backgroundColor:
                      selectedPageId === page.id ? tintColor : '#fff',
                    borderWidth: 1,
                    borderColor:
                      selectedPageId === page.id ? tintColor : borderColor,
                    borderRadius: 16,
                    padding: 18,
                    marginBottom: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color:
                        selectedPageId === page.id ? '#fff' : textColor,
                      marginBottom: 4,
                    }}
                  >
                    {page.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        selectedPageId === page.id ? '#fff' : iconColor,
                    }}
                  >
                    {page.category || 'Facebook Page'} • ID: {page.id}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => handlePageSelection(selectedPageId)}
                disabled={facebookLoading || !selectedPageId}
                style={{
                  backgroundColor: tintColor,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginBottom: 16,
                  opacity:
                    facebookLoading || !selectedPageId ? 0.6 : 1,
                }}
              >
                {facebookLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Connect Selected Page
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setFacebookPages([]);
                  setSelectedPageId('');
                }}
                disabled={facebookLoading}
                style={{
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: iconColor, fontWeight: '600' }}>
                  Back to Token Input
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={handleClose}
            disabled={fetchingPages || facebookLoading}
            style={{ alignItems: 'center', marginTop: 10 }}
          >
            <Text style={{ color: iconColor, fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}
