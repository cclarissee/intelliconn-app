import { useTheme } from '@/contexts/ThemeContext';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  Send,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from '../lib/announcementsApi';

interface AnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  announcement?: any;
  isEditing?: boolean;
}

export default function AnnouncementModal({
  visible,
  onClose,
  onSuccess,
  announcement,
  isEditing = false,
}: AnnouncementModalProps) {
  const { theme } = useTheme();
  const dayMs = 24 * 60 * 60 * 1000;
  const parseExpiresAt = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const getInitialExpiresInDays = () => {
    const expiresAt = parseExpiresAt(announcement?.expiresAt);
    if (!expiresAt) return '';
    const diffMs = expiresAt.getTime() - Date.now();
    if (!Number.isFinite(diffMs)) return '';
    return String(Math.max(0, Math.ceil(diffMs / dayMs)));
  };
  const [title, setTitle] = useState(announcement?.title || '');
  const [message, setMessage] = useState(announcement?.message || '');
  const [type, setType] = useState<'info' | 'warning' | 'critical' | 'success'>(announcement?.type || 'info');
  const [expiresInDays, setExpiresInDays] = useState(getInitialExpiresInDays());
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const colors = theme === 'dark'
    ? {
        background: '#1E293B',
        text: '#F9FAFB',
        secondaryText: '#94A3B8',
        inputBg: '#334155',
        inputBorder: '#475569',
        inputText: '#F9FAFB',
        buttonBg: '#3B82F6',
        buttonText: '#fff',
        deleteBtn: '#EF4444',
        deleteText: '#fff',
        border: '#475569',
      }
    : {
        background: '#fff',
        text: '#0F172A',
        secondaryText: '#64748B',
        inputBg: '#F8FAFC',
        inputBorder: '#E5E7EB',
        inputText: '#0F172A',
        buttonBg: '#3B82F6',
        buttonText: '#fff',
        deleteBtn: '#EF4444',
        deleteText: '#fff',
        border: '#E5E7EB',
      };

  const typeColors = {
    info: { 
      bg: '#3B82F6', 
      text: '#fff', 
      light: '#DBEAFE',
      border: '#3B82F6',
      icon: Info
    },
    warning: { 
      bg: '#F59E0B', 
      text: '#fff', 
      light: '#FEF3C7',
      border: '#F59E0B',
      icon: AlertTriangle
    },
    critical: { 
      bg: '#EF4444', 
      text: '#fff', 
      light: '#FEE2E2',
      border: '#EF4444',
      icon: AlertCircle
    },
    success: { 
      bg: '#10B981', 
      text: '#fff', 
      light: '#D1FAE5',
      border: '#10B981',
      icon: CheckCircle
    },
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.trim().length < 3) {
      setTitleError('Title must be at least 3 characters');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!message.trim()) {
      setMessageError('Message is required');
      isValid = false;
    } else if (message.trim().length < 10) {
      setMessageError('Message must be at least 10 characters');
      isValid = false;
    } else {
      setMessageError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const parsedDays = expiresInDays.trim() ? Number(expiresInDays) : null;
      const expiresAt = Number.isFinite(parsedDays) && parsedDays != null && parsedDays > 0
        ? new Date(Date.now() + parsedDays * dayMs)
        : null;
      const announcementData = {
        title: title.trim(),
        message: message.trim(),
        type,
        createdAt: isEditing ? announcement.createdAt : new Date(),
        updatedAt: new Date(),
        expiresAt,
      };

      if (isEditing && announcement?.id) {
        await updateAnnouncement(announcement.id, announcementData);
        Alert.alert('Success', 'Announcement updated successfully');
      } else {
        await createAnnouncement({
          ...announcementData,
          isHidden: false,
        });
        Alert.alert('Success', 'Announcement created successfully');
      }

      onSuccess?.();
      onClose();
      // Reset form
      setTitle('');
      setMessage('');
      setType('info');
      setExpiresInDays('');
      setTitleError('');
      setMessageError('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save announcement');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !announcement?.id) return;

    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            // Mark as deleting
            setDeletingId(announcement.id);
            
            setTimeout(async () => {
              setIsLoading(true);
              try {
                await deleteAnnouncement(announcement.id);
                Alert.alert('Success', 'Announcement deleted successfully');
                onSuccess?.();
                onClose();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete announcement');
                console.error(error);
                setDeletingId(null);
              } finally {
                setIsLoading(false);
              }
            }, 120);
          },
        },
      ],
    );
  };

  const handleReset = () => {
    setTitle(announcement?.title || '');
    setMessage(announcement?.message || '');
    setType(announcement?.type || 'info');
    setExpiresInDays(getInitialExpiresInDays());
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalBackground} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalWrapper}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.modalContent}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                <View style={[styles.iconBadge, { backgroundColor: typeColors[type].light }]}>
                  {React.createElement(typeColors[type].icon, { 
                    size: 20, 
                    color: typeColors[type].bg 
                  })}
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  onPress={() => setShowPreview(!showPreview)} 
                  disabled={isLoading}
                  style={styles.headerButton}
                >
                  {showPreview ? (
                    <EyeOff size={20} color={colors.secondaryText} />
                  ) : (
                    <Eye size={20} color={colors.secondaryText} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} disabled={isLoading} style={styles.headerButton}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {!showPreview ? (
                <>
                  {/* Type Selector - Moved to top */}
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Announcement Type <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                      Choose the urgency level of your announcement
                    </Text>
                    <View style={styles.typeGrid}>
                      {(['info', 'success', 'warning', 'critical'] as const).map((t) => {
                        const TypeIcon = typeColors[t].icon;
                        return (
                          <TouchableOpacity
                            key={t}
                            style={[
                              styles.typeCard,
                              {
                                backgroundColor: type === t ? typeColors[t].light : colors.inputBg,
                                borderColor: type === t ? typeColors[t].border : colors.inputBorder,
                                borderWidth: type === t ? 2 : 1,
                              },
                            ]}
                            onPress={() => setType(t)}
                            disabled={isLoading}
                          >
                            <TypeIcon 
                              size={24} 
                              color={type === t ? typeColors[t].bg : colors.secondaryText} 
                            />
                            <Text
                              style={[
                                styles.typeCardText,
                                {
                                  color: type === t ? typeColors[t].bg : colors.inputText,
                                  fontWeight: type === t ? '600' : '400',
                                },
                              ]}
                            >
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Title Input */}
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Title <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                      A short, descriptive title for your announcement
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: titleError ? '#EF4444' : colors.inputBorder,
                          color: colors.inputText,
                        },
                      ]}
                      placeholder="e.g., System Maintenance Scheduled"
                      placeholderTextColor={colors.secondaryText}
                      value={title}
                      onChangeText={(text) => {
                        setTitle(text);
                        if (titleError) setTitleError('');
                      }}
                      maxLength={100}
                      editable={!isLoading}
                    />
                    {titleError ? (
                      <Text style={styles.errorText}>{titleError}</Text>
                    ) : (
                      <Text style={[styles.charCount, { color: colors.secondaryText }]}>
                        {title.length}/100 characters
                      </Text>
                    )}
                  </View>

                  {/* Message Input */}
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Message <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                      Detailed information about the announcement
                    </Text>
                    <TextInput
                      style={[
                        styles.messageInput,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: messageError ? '#EF4444' : colors.inputBorder,
                          color: colors.inputText,
                        },
                      ]}
                      placeholder="Provide detailed information about your announcement..."
                      placeholderTextColor={colors.secondaryText}
                      value={message}
                      onChangeText={(text) => {
                        setMessage(text);
                        if (messageError) setMessageError('');
                      }}
                      maxLength={500}
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical="top"
                      editable={!isLoading}
                    />
                    {messageError ? (
                      <Text style={styles.errorText}>{messageError}</Text>
                    ) : (
                      <Text style={[styles.charCount, { color: colors.secondaryText }]}>
                        {message.length}/500 characters
                      </Text>
                    )}
                  </View>

                  {/* Expiration */}
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Expires in days (optional)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.inputText,
                        },
                      ]}
                      placeholder="e.g., 7"
                      placeholderTextColor={colors.secondaryText}
                      value={expiresInDays}
                      onChangeText={setExpiresInDays}
                      keyboardType="number-pad"
                      editable={!isLoading}
                    />
                  </View>

                  {/* Quick Tips */}
                  <View style={[styles.tipsContainer, { backgroundColor: colors.inputBg }]}>
                    <Info size={16} color={colors.secondaryText} />
                    <Text style={[styles.tipsText, { color: colors.secondaryText }]}>
                      Tip: Use the preview button to see how your announcement will look to users
                    </Text>
                  </View>
                </>
              ) : (
                /* Preview Mode */
                <View style={styles.previewContainer}>
                  <Text style={[styles.previewLabel, { color: colors.text }]}>
                    Preview
                  </Text>
                  <View
                    style={[
                      styles.previewCard,
                      {
                        backgroundColor: theme === 'dark' ? '#1E293B' : '#fff',
                        borderLeftColor: typeColors[type].bg,
                      },
                    ]}
                  >
                    <View style={styles.previewHeader}>
                      {React.createElement(typeColors[type].icon, { 
                        size: 24, 
                        color: typeColors[type].bg 
                      })}
                      {title ? (
                        <Text style={[styles.previewTitle, { color: colors.text }]}>
                          {title}
                        </Text>
                      ) : (
                        <Text style={[styles.previewPlaceholder, { color: colors.secondaryText }]}>
                          No title yet
                        </Text>
                      )}
                    </View>
                    {message ? (
                      <Text style={[styles.previewMessage, { color: colors.secondaryText }]}>
                        {message}
                      </Text>
                    ) : (
                      <Text style={[styles.previewPlaceholder, { color: colors.secondaryText }]}>
                        No message yet
                      </Text>
                    )}
                    <View style={[styles.previewBadge, { backgroundColor: typeColors[type].light }]}>
                      <Text style={[styles.previewBadgeText, { color: typeColors[type].bg }]}>
                        {type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <View style={styles.actionsRow}>
                {isEditing && (
                  <Animated.View>
                  
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: colors.deleteBtn }]}
                      onPress={handleDelete}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={colors.deleteText} size="small" />
                      ) : (
                        <>
                          <Trash2 size={18} color={colors.deleteText} />
                          <Text style={[styles.buttonText, { color: colors.deleteText }]}>
                            Delete
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                )}

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={[styles.buttonText, { color: colors.inputText }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton, 
                    { backgroundColor: typeColors[type].bg }
                  ]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Send size={18} color="#fff" />
                      <Text style={[styles.buttonText, { color: '#fff' }]}>
                        {isEditing ? 'Update' : 'Publish'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '92%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: '400',
  },
  messageInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 140,
    fontWeight: '400',
  },
  charCount: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeCardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  previewMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewPlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  previewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
