import { useTheme } from '@/contexts/ThemeContext';
import { Announcement, getAnnouncements } from '@/lib/announcementsApi';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnnouncementBannerProps {
  limit?: number;
  onPressViewAll?: () => void;
}

export default function AnnouncementBanner({ limit = 3, onPressViewAll }: AnnouncementBannerProps) {
  const { theme } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const colors = theme === 'dark'
    ? {
        background: '#0F172A',
        card: '#1E293B',
        text: '#F9FAFB',
        subtext: '#94A3B8',
        border: '#334155',
      }
    : {
        background: '#F9FAFB',
        card: '#FFFFFF',
        text: '#0F172A',
        subtext: '#6B7280',
        border: '#E5E7EB',
      };

  const typeColors = {
    info: { color: '#3B82F6', icon: Info },
    warning: { color: '#F59E0B', icon: AlertTriangle },
    critical: { color: '#EF4444', icon: AlertCircle },
    success: { color: '#10B981', icon: CheckCircle },
  } as const;

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data.slice(0, limit));
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Announcements</Text>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      </View>
    );
  }

  if (!loading && announcements.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Announcements</Text>
          {onPressViewAll && (
            <TouchableOpacity onPress={onPressViewAll}>
              <Text style={[styles.link, { color: '#3B82F6' }]}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.emptyText, { color: colors.subtext }]}>No announcements yet.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Announcements</Text>
        {onPressViewAll && (
          <TouchableOpacity onPress={onPressViewAll}>
            <Text style={[styles.link, { color: '#3B82F6' }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {announcements.map((item) => {
        const typeConfig = typeColors[item.type] || typeColors.info;
        const Icon = typeConfig.icon;
        return (
          <View key={item.id} style={[styles.card, { borderColor: colors.border }]}> 
            <View style={styles.cardHeader}>
              <View style={styles.typeRow}>
                <Icon size={16} color={typeConfig.color} />
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={[styles.badge, { backgroundColor: typeConfig.color }]}>{item.type.toUpperCase()}</Text>
            </View>
            <Text style={[styles.message, { color: colors.subtext }]} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
  },
  card: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
