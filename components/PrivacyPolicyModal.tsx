import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const buttonTextColor = useThemeColor({ light: '#fff', dark: '#fff' }, 'background');

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
        <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, marginBottom: 16 }}>
          Privacy Policy
        </Text>

        <ScrollView style={{ maxHeight: 400 }}>
          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>Last Updated: January 18, 2026</Text>
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>1. Information We Collect{"\n"}</Text>
            We collect information you provide directly to us when you create an account, including your name, email address, and profile information. We also collect information about your social media accounts when you connect them to our service.
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>2. How We Use Your Information{"\n"}</Text>
            We use the information we collect to:
            {"\n"}• Provide, maintain, and improve our services
            {"\n"}• Process and complete transactions
            {"\n"}• Send you technical notices and support messages
            {"\n"}• Respond to your comments and questions
            {"\n"}• Schedule and publish posts to your connected social media accounts
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>3. Information Sharing{"\n"}</Text>
            We do not sell, trade, or rent your personal information to third parties. We may share your information with:
            {"\n"}• Social media platforms you connect to our service
            {"\n"}• Service providers who assist us in operating our application
            {"\n"}• Law enforcement when required by law
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>4. Data Security{"\n"}</Text>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>5. Your Rights{"\n"}</Text>
            You have the right to:
            {"\n"}• Access your personal information
            {"\n"}• Correct inaccurate information
            {"\n"}• Request deletion of your information
            {"\n"}• Object to processing of your information
            {"\n"}• Export your data
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>6. Cookies and Tracking{"\n"}</Text>
            We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>7. Third-Party Services{"\n"}</Text>
            Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties.
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>8. Children's Privacy{"\n"}</Text>
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>9. Changes to Privacy Policy{"\n"}</Text>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Text>

          <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>10. Contact Us{"\n"}</Text>
            If you have any questions about this Privacy Policy, please contact us at support@intelliconn.com
          </Text>
        </ScrollView>

        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: tintColor,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <Text style={{ color: buttonTextColor, fontWeight: '600' }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
