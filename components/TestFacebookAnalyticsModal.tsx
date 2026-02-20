import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { testFacebookAnalyticsConnection } from '@/lib/analyticsUpdater';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TestResult {
  connected: boolean;
  hasToken: boolean;
  hasPageId: boolean;
  pageName?: string;
  apiTest?: {
    success: boolean;
    message: string;
    details?: any;
  };
}

export default function TestFacebookAnalyticsModal() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const colors =
    theme === 'dark'
      ? {
          background: '#0F172A',
          cardBg: '#1E293B',
          textPrimary: '#F9FAFB',
          textSecondary: '#94A3B8',
          border: '#334155',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
          primary: '#6366F1',
        }
      : {
          background: '#F9FAFB',
          cardBg: '#FFFFFF',
          textPrimary: '#0F172A',
          textSecondary: '#64748B',
          border: '#E2E8F0',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
          primary: '#6366F1',
        };

  const handleTest = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to test analytics');
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const testResult = await testFacebookAnalyticsConnection(user.uid);
      setResult(testResult);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to test analytics');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌';
  };

  return (
    <>
      {/* Button to open modal */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
          marginVertical: 10,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
          Test Facebook Analytics
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 20,
              width: '90%',
              maxHeight: '80%',
            }}
          >
            <ScrollView>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Facebook Analytics Test
              </Text>

              {!result && !testing && (
                <View>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      marginBottom: 20,
                      lineHeight: 20,
                    }}
                  >
                    This will test your Facebook connection and verify if analytics
                    can be fetched from the Facebook Graph API.
                  </Text>

                  <TouchableOpacity
                    onPress={handleTest}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      Run Test
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {testing && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      marginTop: 16,
                    }}
                  >
                    Testing Facebook connection...
                  </Text>
                </View>
              )}

              {result && (
                <View>
                  <View
                    style={{
                      backgroundColor: colors.background,
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.textPrimary,
                        marginBottom: 12,
                      }}
                    >
                      Connection Status
                    </Text>

                    <View style={{ gap: 8 }}>
                      <Text style={{ color: colors.textPrimary }}>
                        {getStatusIcon(result.connected)} Connected:{' '}
                        {result.connected ? 'Yes' : 'No'}
                      </Text>
                      <Text style={{ color: colors.textPrimary }}>
                        {getStatusIcon(result.hasToken)} Has Access Token:{' '}
                        {result.hasToken ? 'Yes' : 'No'}
                      </Text>
                      <Text style={{ color: colors.textPrimary }}>
                        {getStatusIcon(result.hasPageId)} Has Page ID:{' '}
                        {result.hasPageId ? 'Yes' : 'No'}
                      </Text>
                      {result.pageName && (
                        <Text style={{ color: colors.textPrimary }}>
                          📄 Page: {result.pageName}
                        </Text>
                      )}
                    </View>
                  </View>

                  {result.apiTest && (
                    <View
                      style={{
                        backgroundColor: result.apiTest.success
                          ? colors.success + '20'
                          : colors.error + '20',
                        padding: 16,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: result.apiTest.success
                          ? colors.success
                          : colors.error,
                        marginBottom: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: result.apiTest.success
                            ? colors.success
                            : colors.error,
                          marginBottom: 8,
                        }}
                      >
                        {result.apiTest.success ? '✅ API Test Passed' : '❌ API Test Failed'}
                      </Text>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          marginBottom: 12,
                        }}
                      >
                        {result.apiTest.message}
                      </Text>

                      {result.apiTest.details && result.apiTest.success && (
                        <View style={{ gap: 6 }}>
                          <Text style={{ color: colors.textPrimary }}>
                            Page Name: {result.apiTest.details.pageName}
                          </Text>
                          {result.apiTest.details.fanCount !== undefined && (
                            <Text style={{ color: colors.textPrimary }}>
                              Fans: {result.apiTest.details.fanCount.toLocaleString()}
                            </Text>
                          )}
                          {result.apiTest.details.followersCount !== undefined && (
                            <Text style={{ color: colors.textPrimary }}>
                              Followers:{' '}
                              {result.apiTest.details.followersCount.toLocaleString()}
                            </Text>
                          )}
                        </View>
                      )}

                      {result.apiTest.details && !result.apiTest.success && (
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            fontFamily: 'monospace',
                          }}
                        >
                          {JSON.stringify(result.apiTest.details, null, 2)}
                        </Text>
                      )}
                    </View>
                  )}

                  <View
                    style={{
                      backgroundColor: colors.warning + '20',
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 13,
                        lineHeight: 18,
                      }}
                    >
                      💡 Note: Even if the API test passes, you may need to wait
                      24-48 hours after posting for Facebook to generate insights
                      data.
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleTest}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      Run Test Again
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setVisible(false);
                  setResult(null);
                }}
                style={{
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
