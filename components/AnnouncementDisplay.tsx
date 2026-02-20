import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Announcement, getAnnouncements, updateAnnouncement } from '@/lib/announcementsApi';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Plus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface AnnouncementDisplayProps {
  visible: boolean;
  onClose: () => void;
  onCreateNew?: () => void;
}

export default function AnnouncementDisplay({
  visible,
  onClose,
  onCreateNew,
}: AnnouncementDisplayProps) {
  const { theme } = useTheme();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'expired' | 'hidden'>('active');

  const colors = theme === 'dark'
    ? {
        background: '#1E293B',
        text: '#F9FAFB',
        secondaryText: '#94A3B8',
        cardBg: '#334155',
        border: '#475569',
      }
    : {
        background: '#fff',
        text: '#0F172A',
        secondaryText: '#64748B',
        cardBg: '#F8FAFC',
        border: '#E5E7EB',
      };

  const typeIcons: Record<string, any> = {
    info: { icon: Info, color: '#3B82F6' },
    warning: { icon: AlertTriangle, color: '#F59E0B' },
    critical: { icon: AlertCircle, color: '#EF4444' },
    success: { icon: CheckCircle, color: '#10B981' },
  };

  useEffect(() => {
    if (visible) {
      fetchAnnouncements();
    }
  }, [visible, viewMode]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      if (viewMode === 'hidden') {
        const data = await getAnnouncements({
          includeExpired: true,
          includeHidden: true,
        });
        setAnnouncements(data.filter((item) => item.isHidden));
        return;
      }

      const showExpired = viewMode === 'expired';
      const data = await getAnnouncements({
        includeExpired: showExpired,
        onlyExpired: showExpired,
        includeHidden: false,
      });
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (announcement: Announcement) => {
    if (!announcement.expiresAt) return false;
    return announcement.expiresAt.getTime() <= Date.now();
  };

  const handleHideExpired = (announcementId: string) => {
    Alert.alert(
      'Hide Announcement',
      'Hide this expired announcement from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateAnnouncement(announcementId, { isHidden: true });
              await fetchAnnouncements();
            } catch (error) {
              console.error('Error hiding announcement:', error);
            }
          },
        },
      ]
    );
  };

  const handleUnhide = (announcementId: string) => {
    Alert.alert(
      'Unhide Announcement',
      'Make this announcement visible again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unhide',
          onPress: async () => {
            try {
              await updateAnnouncement(announcementId, { isHidden: false });
              await fetchAnnouncements();
            } catch (error) {
              console.error('Error unhiding announcement:', error);
            }
          },
        },
      ]
    );
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => {
    const typeConfig = typeIcons[item.type] || typeIcons.info;
    const IconComponent = typeConfig.icon;

    return (
      <View
        style={[
          styles.announcementCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderLeftColor: typeConfig.color,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <IconComponent size={20} color={typeConfig.color} />
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.date, { color: colors.secondaryText }]}>
              {formatDate(item.updatedAt)}
            </Text>
            {isAdmin && (viewMode === 'expired' || viewMode === 'active') && (
              <TouchableOpacity
                style={[styles.hideButton, { borderColor: colors.border }]}
                onPress={() => handleHideExpired(item.id)}
              >
                <Text style={[styles.hideButtonText, { color: colors.secondaryText }]}>Hide</Text>
              </TouchableOpacity>
            )}
            {isAdmin && viewMode === 'hidden' && (
              <TouchableOpacity
                style={[styles.hideButton, { borderColor: colors.border }]}
                onPress={() => handleUnhide(item.id)}
              >
                <Text style={[styles.hideButtonText, { color: colors.secondaryText }]}>Unhide</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.cardMessage, { color: colors.secondaryText }]}>
          {item.message}
        </Text>

        <View style={styles.typeBadgeRow}>
          <Text
            style={[
              styles.typeBadgeText,
              { backgroundColor: typeConfig.color },
            ]}
          >
            {item.type.toUpperCase()}
          </Text>
          {isExpired(item) && (
            <Text style={[styles.expiredBadge, { color: colors.secondaryText, borderColor: colors.border }]}>Expired</Text>
          )}
        </View>
        {item.expiresAt && (
          <Text style={[styles.expiryText, { color: colors.secondaryText }]}>
            {viewMode === 'expired' ? 'Expired' : viewMode === 'hidden' ? 'Was set to expire' : 'Expires'}: {formatDate(item.expiresAt)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme === 'dark' ? '#1E293B' : '#fff',
          },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Announcements
          </Text>
          {isAdmin && (
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'active' && { backgroundColor: '#3B82F6' },
                ]}
                onPress={() => setViewMode('active')}
              >
                <Text style={[
                  styles.toggleText,
                  { color: viewMode === 'active' ? '#fff' : colors.secondaryText },
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'expired' && { backgroundColor: '#3B82F6' },
                ]}
                onPress={() => setViewMode('expired')}
              >
                <Text style={[
                  styles.toggleText,
                  { color: viewMode === 'expired' ? '#fff' : colors.secondaryText },
                ]}>
                  Expired
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'hidden' && { backgroundColor: '#3B82F6' },
                ]}
                onPress={() => setViewMode('hidden')}
              >
                <Text style={[
                  styles.toggleText,
                  { color: viewMode === 'hidden' ? '#fff' : colors.secondaryText },
                ]}>
                  Hidden
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.headerActions}>
            {isAdmin && onCreateNew && (
              <TouchableOpacity 
                onPress={onCreateNew}
                style={[styles.createButton, { backgroundColor: '#3B82F6' }]}
              >
                <Plus size={20} color="#fff" />
                <Text style={[styles.createButtonText]}>New</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {viewMode === 'expired'
                ? 'No expired announcements'
                : viewMode === 'hidden'
                  ? 'No hidden announcements'
                  : 'No announcements yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={announcements}
            renderItem={renderAnnouncement}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  announcementCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  date: {
    fontSize: 12,
  },
  cardMessage: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 12,
  },
  typeBadgeRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  expiredBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '700',
  },
  expiryText: {
    marginTop: 8,
    fontSize: 12,
  },
  hideButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hideButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
