import SuccessNotification from '@/components/SuccessNotification';
import WarningNotification from '@/components/WarningNotification';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useSuccessNotification } from '@/hooks/useSuccessNotification';
import { useWarningNotification } from '@/hooks/useWarningNotification';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  platform: string[];
  public: boolean;
  userId: string;
  createdAt: Date;
  isAdminTemplate?: boolean;
  creatorRole?: string;
}

interface CreateTemplateProps {
  visible: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
  editingTemplate?: Template | null;
  onNotify?: (options: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
  }) => void;
}

const categories = ['Announcements', 'Events', 'Achievements', 'News', 'Promotional'];
const platforms = ['Twitter', 'Facebook', 'Instagram'];
const { height } = Dimensions.get('window');

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'Twitter':
      return 'logo-twitter';
    case 'Facebook':
      return 'logo-facebook';
    case 'Instagram':
      return 'logo-instagram';
    default:
      return 'globe-outline';
  }
};

export default function CreateTemplate({
  visible,
  onClose,
  onTemplateCreated,
  editingTemplate,
  onNotify,
}: CreateTemplateProps) {
  const { user, role } = useAuth();
  const { showSuccess, notificationProps } = useSuccessNotification();
  const { showWarning, notificationProps: warningNotificationProps } = useWarningNotification();
  const notify = onNotify ?? showSuccess;
  const shouldRenderNotification = !onNotify;

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isAdminTemplate, setIsAdminTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingProgress, setCreatingProgress] = useState('');
  const [errors, setErrors] = useState<{ name?: boolean; content?: boolean; platform?: boolean }>({});

  /**
   * Validates required fields and updates error state
   * Returns true if all validations pass, false otherwise
   */
  const validateFields = () => {
    const newErrors: typeof errors = {};
    let hasErrors = false;

    if (!name.trim()) {
      newErrors.name = true;
      hasErrors = true;
    }

    if (!content.trim()) {
      newErrors.content = true;
      hasErrors = true;
    }

    if (platform.length === 0) {
      newErrors.platform = true;
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const notifyAndClose = (options: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
  }) => {
    if (onNotify) {
      onClose();
      setTimeout(() => {
        notify(options);
      }, 250);
    } else {
      notify(options);
      onClose();
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim, slideAnim]);

  useEffect(() => {
    if (loading) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [loading, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setCategory(editingTemplate.category);
      setContent(editingTemplate.content);
      setPlatform(Array.isArray(editingTemplate.platform) ? editingTemplate.platform : [editingTemplate.platform]);
      setIsPublic(editingTemplate.public);
      setIsAdminTemplate(editingTemplate.isAdminTemplate || false);
      setErrors({});
    } else {
      setName('');
      setCategory(categories[0]);
      setContent('');
      setPlatform([]);
      setIsPublic(false);
      setIsAdminTemplate(false);
      setErrors({});
    }
  }, [editingTemplate, visible]);

  const handleSubmit = async () => {
    if (!validateFields()) {
      showWarning({
        title: '⚠️ Missing Fields',
        message: 'Please fill in template name, content, and select at least one platform.',
        duration: 4000,
      });
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    setCreatingProgress(editingTemplate ? 'Updating template...' : 'Creating template...');
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        category,
        content: content.trim(),
        platform,
        public: isPublic,
        userId: user.uid,
        createdAt: editingTemplate?.createdAt ?? new Date(),
        isAdminTemplate: role === 'admin' ? isAdminTemplate : false,
        creatorRole: role || 'user',
      };

      if (editingTemplate) {
        await setDoc(doc(db, 'templates', editingTemplate.id), data, { merge: true });
      } else {
        const id = Date.now().toString();
        await setDoc(doc(db, 'templates', id), { id, ...data });
      }

      onTemplateCreated();
      notifyAndClose({
        title: editingTemplate ? '✅ Updated' : '✅ Created',
        message: editingTemplate ? 'Template updated successfully.' : 'Template created successfully.',
        duration: 3000,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {shouldRenderNotification && <SuccessNotification {...notificationProps} />}
      <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          <WarningNotification {...warningNotificationProps} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.header}>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </Text>

            {/* Name */}
            <Text style={styles.label}>Template name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Eg. Event Announcement"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (text.trim()) setErrors(prev => ({ ...prev, name: false }));
              }}
            />
            {errors.name && <Text style={styles.errorText}>⚠️ Template name is required</Text>}

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    category === item && styles.chipActive,
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === item && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Platform */}
            <Text style={styles.label}>Platform</Text>
            <View style={[styles.chipRow, errors.platform && styles.chipRowError]}>
              {platforms.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    platform.includes(item) && styles.chipActive,
                  ]}
                  onPress={() => {
                    setPlatform(prev =>
                      prev.includes(item)
                        ? prev.filter(p => p !== item)
                        : [...prev, item]
                    );
                    setErrors(prev => ({ ...prev, platform: false }));
                  }}
                >
                  <Ionicons
                    name={getPlatformIcon(item)}
                    size={16}
                    color={platform.includes(item) ? '#fff' : '#374151'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      platform.includes(item) && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.platform && <Text style={styles.errorText}>⚠️ Select at least one platform</Text>}

            {/* Content */}
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.content && styles.inputError]}
              placeholder="Write your post template here..."
              multiline
              value={content}
              onChangeText={(text) => {
                setContent(text);
                if (text.trim()) setErrors(prev => ({ ...prev, content: false }));
              }}
            />
            {errors.content && <Text style={styles.errorText}>⚠️ Content is required</Text>}

            {/* Public Toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleText}>Make public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ true: '#6366F1' }}
              />
            </View>

            {/* Admin Template Toggle (only for admins) */}
            {role === 'admin' && (
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleText}>Admin Template</Text>
                  <Text style={styles.toggleSubtext}>
                    All users can view, but only you can delete it
                  </Text>
                </View>
                <Switch
                  value={isAdminTemplate}
                  onValueChange={setIsAdminTemplate}
                  trackColor={{ true: '#F59E0B' }}
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primary, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.primaryText}>
                  {loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {shouldRenderNotification && (
        <SuccessNotification {...notificationProps} />
      )}

      {loading && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="sync" size={48} color="#10B981" />
              </Animated.View>
              <Text style={styles.loadingTitle}>Saving Template...</Text>
              <Text style={styles.loadingText}>{creatingProgress}</Text>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEE2E2',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  chipRowError: {
    borderWidth: 2,
    borderColor: '#EF4444',
    padding: 8,
    borderRadius: 14,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#6366F1',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -12,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    maxWidth: 250,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
  },
  primary: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  primaryText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
