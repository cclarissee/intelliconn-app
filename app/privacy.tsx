import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const INTELLICONN = {
  primary: '#0A3D91',
  secondary: '#1565C0',
  accent: '#00C2FF',
  background: '#F4F7FB',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

export default function PrivacyPage() {
  const router = useRouter();

  const SectionCard = ({
    icon,
    title,
    content,
  }: {
    icon: string;
    title: string;
    content: string;
  }) => (
    <View
      style={{
        backgroundColor: INTELLICONN.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Ionicons name={icon as any} size={22} color={INTELLICONN.primary} />
        <Text
          style={{
            marginLeft: 10,
            fontSize: 16,
            fontWeight: '700',
            color: INTELLICONN.primary,
          }}
        >
          {title}
        </Text>
      </View>

      <Text
        style={{
          color: INTELLICONN.textSecondary,
          lineHeight: 20,
          fontSize: 14,
        }}
      >
        {content}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: INTELLICONN.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* HEADER */}
      <LinearGradient
        colors={[INTELLICONN.primary, INTELLICONN.secondary]}
        style={{
          padding: 24,
          borderRadius: 24,
          marginBottom: 24,
          marginTop: 40, 
          position: 'relative',
        }}
      >
        {/* LEFT ARROW BUTTON */}
        <TouchableOpacity
          onPress={() => router.push('/settings')} 
          style={{
            position: 'absolute',
            left: 18,
            top: 20,
            padding: 8,
            borderRadius: 50,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* TITLE */}
        <Text
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          Our Privacy Policy
        </Text>

        <Text
          style={{
            color: '#CFE3FF',
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          We are committed to maintaining your data security and institutional integrity in here.
        </Text>
      </LinearGradient>

      {/* === YOUR CONTENT BELOW (UNCHANGED) === */}

      <SectionCard
        icon="person-circle-outline"
        title="Information We Collect"
        content="What we collect: We keep it simple—just your name, email, school course, and role. When you link your social media, we use secure authentication tokens to manage the connection. Rest assured, we never see or store your social media passwords."
      />

      <SectionCard
        icon="bulb-outline"
        title="AI-Generated Content"
        content="AI-assisted captions and templates are generated securely. IntelliConn does not use student data to train AI models. All generated content remains owned by your institution."
      />

      <SectionCard
        icon="calendar-outline"
        title="Scheduled Posts & Storage"
        content="All drafts and scheduled posts are kept secure within our system. You and your authorized users retain complete flexibility to modify or delete them whenever necessary."
      />

      <SectionCard
        icon="shield-checkmark-outline"
        title="Data Security"
        content="Our platform utilizes advanced encryption and secure cloud environments to safeguard your credentials and institutional assets."
      />

      <SectionCard
        icon="share-social-outline"
        title="Social Media Integrations"
        content="We utilize official API protocols to connect with Facebook, Instagram, and X (Twitter). You maintain full control, and with this secure connection, it can be managed whenever through your account settings."
      />

      <SectionCard
        icon="trash-outline"
        title="Your Rights"
        content="Here your account management, social media disconnection, and data deletion requests are all handled in accordance with our institutional data privacy and policies."
      />

      <Text
        style={{
          marginTop: 20,
          fontSize: 12,
          color: INTELLICONN.textSecondary,
          textAlign: 'center',
        }}
      >
        © {new Date().getFullYear()} IntelliConn. All rights reserved.
      </Text>
    </ScrollView>
  );
}
