import { Check, Copy, Edit3, Facebook, Instagram, Trash2, Twitter, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Clipboard,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getGlobalConnectedAccounts } from '../lib/connectedAccounts';

const { height, width } = Dimensions.get('window');

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: any; // Firestore timestamp
  userId: string;
  platforms?: string[];
  brandVoice?: string;
  hashtags?: string[];
  status?: string;
  scheduledDate?: any;
  images?: string[];
}

interface ViewPostProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDashboard?: boolean;
}

const PLATFORM_COLORS: Record<
  string,
  { bg: string; text: string; Icon?: any }
> = {
  facebook: { bg: '#E7F3FF', text: '#1877F2', Icon: Facebook },
  instagram: { bg: '#FFF0F6', text: '#E1306C', Icon: Instagram },
  twitter: { bg: '#E8F5FE', text: '#1DA1F2', Icon: Twitter },
  threads: { bg: '#F3E8FF', text: '#000' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  draft: { bg: '#FEF3C7', text: '#92400E', icon: '📝' },
  scheduled: { bg: '#DBEAFE', text: '#1E40AF', icon: '⏰' },
  published: { bg: '#DCFCE7', text: '#15803D', icon: '✓' },
  failed: { bg: '#FEE2E2', text: '#991B1B', icon: '✕' },
};

export default function ViewPost({
  visible,
  post,
  onClose,
  onEdit,
  onDelete,
  isDashboard = false,
}: ViewPostProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [copied, setCopied] = useState(false);
  const [previewAccountNames, setPreviewAccountNames] = useState({
    facebook: 'Your Page',
    instagram: 'your_account',
    twitterName: 'Your Account',
    twitterHandle: '@yourhandle',
  });
  const [previewAccountImages, setPreviewAccountImages] = useState({
    facebook: null as string | null,
    instagram: null as string | null,
  });

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let isActive = true;

    const loadAccountNames = async () => {
      try {
        const accounts = await getGlobalConnectedAccounts();
        if (!isActive || !accounts) return;

        setPreviewAccountNames((prev) => ({
          facebook: accounts.facebook?.pageName || prev.facebook,
          instagram: accounts.instagram?.accountName || prev.instagram,
          twitterName: accounts.twitter?.accountName || prev.twitterName,
          twitterHandle: accounts.twitter?.accountName ? `@${accounts.twitter.accountName}` : prev.twitterHandle,
        }));
        setPreviewAccountImages((prev) => ({
          facebook: accounts.facebook?.profileImageUrl || prev.facebook,
          instagram: accounts.instagram?.profileImageUrl || prev.instagram,
        }));
      } catch (error) {
        console.error('Error loading connected account names:', error);
      }
    };

    loadAccountNames();

    return () => {
      isActive = false;
    };
  }, [visible]);

  const handleCopyContent = () => {
    if (post?.content) {
      Clipboard.setString(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Date unavailable';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (dateObj.toDateString() === today.toDateString()) {
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (dateObj.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      return 'Date unavailable';
    }
  };

  const characterCount = post?.content?.length || 0;

  if (!post) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.overlayAnimated, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.animatedSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sheetContainer}>
              <View style={styles.sheet}>
              {/* Header Bar */}
              <View style={styles.headerBar}>
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                scrollEnabled={true}
                bounces={true}
                indicatorStyle="default"
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
              >
                {/* Status Badge */}
                {post.status && (
                  <View style={styles.statusSection}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: STATUS_COLORS[post.status?.toLowerCase()]?.bg || '#F3F4F6',
                        },
                      ]}
                    >
                      <Text style={[styles.statusIcon]}>
                        {STATUS_COLORS[post.status?.toLowerCase()]?.icon || '📄'}
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: STATUS_COLORS[post.status?.toLowerCase()]?.text || '#6B7280',
                          },
                        ]}
                      >
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
                  </View>
                )}

                {/* Title with Character Count */}
                <View style={styles.titleSection}>
                  <Text style={styles.title}>{post.title}</Text>
                  <Text style={styles.charCount}>{characterCount} characters</Text>
                </View>

{/* Platform Badges */}
{post.platforms && post.platforms.length > 0 && (
  <View style={styles.platformsContainer}>
    <Text style={styles.sectionLabel}>Posted to:</Text>

    <View style={styles.platformsRow}>
      {[...post.platforms]
        .sort((a, b) => {
          const order = ['facebook', 'instagram', 'twitter', 'threads'];
          return (
            order.indexOf(a.toLowerCase()) -
            order.indexOf(b.toLowerCase())
          );
        })
        .map((plat) => {
          const platformKey = plat.toLowerCase();
          const platformData =
            PLATFORM_COLORS[platformKey] || {
              bg: '#F3F4F6',
              text: '#6B7280',
            };

          const IconComponent = platformData.Icon;

          return (
            <View
              key={plat}
              style={[
                styles.platformBadge,
                { backgroundColor: platformData.bg },
              ]}
            >
              {IconComponent ? (
                <IconComponent size={16} color={platformData.text} />
              ) : (
                <Text style={styles.platformIcon}>📱</Text>
              )}

              <Text
                style={[
                  styles.platformName,
                  { color: platformData.text },
                ]}
              >
                {plat.charAt(0).toUpperCase() + plat.slice(1)}
              </Text>
            </View>
          );
        })}
    </View>
  </View>
)}


                {/* Brand Voice */}
                {post.brandVoice && (
                  <View style={styles.metaSection}>
                    <Text style={styles.sectionLabel}>Brand Voice:</Text>
                    <View style={styles.brandVoiceContainer}>
                      <Text style={styles.brandVoiceIcon}>🎤</Text>
                      <Text style={styles.brandVoiceText}>{post.brandVoice}</Text>
                    </View>
                  </View>
                )}

                {/* Content Card with Copy Button */}
                <View style={styles.contentSection}>
                  <View style={styles.contentHeader}>
                    <Text style={styles.sectionLabel}>Preview</Text>
                    <TouchableOpacity
                      onPress={handleCopyContent}
                      style={styles.copyBtn}
                    >
                      {copied ? (
                        <>
                          <Check size={16} color="#10B981" />
                          <Text style={styles.copyBtnText}>Copied!</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={16} color="#6B7280" />
                          <Text style={styles.copyBtnText}>Copy</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Platform-Specific Previews */}
                  {post.platforms && post.platforms.length > 0 ? (
                    post.platforms.map((platform) => {
                      const platformLower = platform?.toLowerCase();
                      const platformColor = PLATFORM_COLORS[platformLower];

                      return (
                        <View key={platform} style={styles.platformPreviewContainer}>
                          {/* Facebook Preview */}
                          {platformLower === 'facebook' && (
                            <View style={styles.facebookPreview}>
                              <View style={styles.fbHeader}>
                                {previewAccountImages.facebook ? (
                                  <Image source={{ uri: previewAccountImages.facebook }} style={styles.fbAvatar} />
                                ) : (
                                  <View style={styles.fbAvatar} />
                                )}
                                <View style={styles.fbHeaderText}>
                                  <Text style={styles.fbName}>{previewAccountNames.facebook}</Text>
                                  <Text style={styles.fbTime}>Just now</Text>
                                </View>
                              </View>
                              <Text style={styles.fbContent}>{post.content}</Text>
                              {post.images && post.images.length > 0 && (
                                <Image
                                  source={{ uri: post.images[0] }}
                                  style={styles.fbImage}
                                  resizeMode="cover"
                                />
                              )}
                              <View style={styles.fbActions}>
                                <View style={styles.fbActionItem}>
                                  <Text style={styles.fbActionIcon}>f</Text>
                                  <Text style={styles.fbActionText}>Like</Text>
                                </View>
                                <View style={styles.fbActionItem}>
                                  <Text style={styles.fbActionIcon}>💬</Text>
                                  <Text style={styles.fbActionText}>Comment</Text>
                                </View>
                                <View style={styles.fbActionItem}>
                                  <Text style={styles.fbActionIcon}>↗️</Text>
                                  <Text style={styles.fbActionText}>Share</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Instagram Preview */}
                          {platformLower === 'instagram' && (
                            <View style={styles.instagramPreview}>
                              <View style={styles.igHeader}>
                                {previewAccountImages.instagram ? (
                                  <Image source={{ uri: previewAccountImages.instagram }} style={styles.igAvatar} />
                                ) : (
                                  <View style={styles.igAvatar} />
                                )}
                                <View style={styles.igHeaderText}>
                                  <Text style={styles.igUsername}>{previewAccountNames.instagram}</Text>
                                  <Text style={styles.igLocation}>Shared 1 minute ago</Text>
                                </View>
                                <Text style={styles.igMenu}>⋯</Text>
                              </View>
                              {post.images && post.images.length > 0 && (
                                <Image
                                  source={{ uri: post.images[0] }}
                                  style={styles.igImage}
                                  resizeMode="cover"
                                />
                              )}
                              <View style={styles.igContentArea}>
                                <Text style={styles.igContent}>{post.content}</Text>
                              </View>
                              <View style={styles.igActions}>
                                <View style={styles.igActionGroup}>
                                  <Text style={styles.igActionIcon}>❤️</Text>
                                  <Text style={styles.igActionIcon}>💬</Text>
                                  <Text style={styles.igActionIcon}>➤</Text>
                                </View>
                                <Text style={styles.igActionIcon}>🔖</Text>
                              </View>
                              <Text style={styles.igLikes}>0 likes</Text>
                            </View>
                          )}

                          {/* Twitter/X Preview */}
                          {platformLower === 'twitter' && (
                            <View style={styles.twitterPreview}>
                              <View style={styles.twHeader}>
                                <View style={styles.twAvatar} />
                                <View style={styles.twHeaderText}>
                                  <Text style={styles.twName}>{previewAccountNames.twitterName}</Text>
                                  <Text style={styles.twHandle}>{previewAccountNames.twitterHandle}</Text>
                                </View>
                                <Text style={styles.twMenu}>⋯</Text>
                              </View>
                              <Text style={styles.twContent}>{post.content}</Text>
                              {post.images && post.images.length > 0 && (
                                <Image
                                  source={{ uri: post.images[0] }}
                                  style={styles.twImage}
                                  resizeMode="cover"
                                />
                              )}
                              <View style={styles.twActions}>
                                <Text style={styles.twActionItem}>💬 0</Text>
                                <Text style={styles.twActionItem}>🔄 0</Text>
                                <Text style={styles.twActionItem}>❤️ 0</Text>
                                <Text style={styles.twActionItem}>📤</Text>
                              </View>
                            </View>
                          )}

                          {/* Threads Preview */}
                          {platformLower === 'threads' && (
                            <View style={styles.threadsPreview}>
                              <View style={styles.thHeader}>
                                <View style={styles.thAvatar} />
                                <View style={styles.thHeaderText}>
                                  <Text style={styles.thName}>Your Account</Text>
                                  <Text style={styles.thTime}>now</Text>
                                </View>
                                <Text style={styles.thMenu}>⋯</Text>
                              </View>
                              <Text style={styles.thContent}>{post.content}</Text>
                              {post.images && post.images.length > 0 && (
                                <Image
                                  source={{ uri: post.images[0] }}
                                  style={styles.thImage}
                                  resizeMode="cover"
                                />
                              )}
                              <View style={styles.thActions}>
                                <Text style={styles.thActionItem}>❤️</Text>
                                <Text style={styles.thActionItem}>💬</Text>
                                <Text style={styles.thActionItem}>↗️</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.contentCard}>
                      <Text style={styles.content}>{post.content}</Text>
                    </View>
                  )}
                </View>

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <View style={styles.hashtagsSection}>
                    <Text style={styles.sectionLabel}>Hashtags ({post.hashtags.length})</Text>
                    <View style={styles.hashtagsRow}>
                      {post.hashtags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={styles.hashtagBadge}
                        >
                          <Text style={styles.hashtag}>#{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Scheduled Date if applicable */}
                {post.scheduledDate && (
                  <View style={styles.scheduledSection}>
                    <Text style={styles.sectionLabel}>Scheduled for:</Text>
                    <View style={styles.scheduledCard}>
                      <Text style={styles.scheduledIcon}>⏰</Text>
                      <Text style={styles.scheduledDate}>
                        {formatDate(post.scheduledDate)}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.spacer} />
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                {!isDashboard ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.primaryBtn]}
                      onPress={onEdit}
                    >
                      <Edit3 size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.dangerBtn]}
                      onPress={() => {
                        Alert.alert(
                          'Delete Post',
                          'Are you sure you want to delete this post?',
                          [
                            { text: 'Cancel', onPress: () => {} },
                            {
                              text: 'Delete',
                              onPress: onDelete,
                              style: 'destructive',
                            },
                          ]
                        );
                      }}
                    >
                      <Trash2 size={18} color="#DC2626" />
                      <Text style={styles.dangerBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                  >
                  </TouchableOpacity>
                )}
              </View>
            </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayAnimated: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  animatedSheet: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheetContainer: {
    justifyContent: 'flex-end',
    flex: 1,
    pointerEvents: 'box-none',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '95%',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    flex: 1,
    display: 'flex',
  },

  /* Header */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  closeBtn: {
    padding: 8,
    marginLeft: 8,
  },

  /* Scroll Content */
  scrollContent: {
    flex: 1,
    minHeight: 100,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },

  /* Status Section */
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  /* Title Section */
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 32,
  },
  charCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  /* Section Label */
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  /* Platforms Section */
  platformsContainer: {
    marginBottom: 24,
  },
platformsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 8,
},
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  platformIcon: {
    fontSize: 16,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Meta Section */
  metaSection: {
    marginBottom: 20,
  },
  brandVoiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  brandVoiceIcon: {
    fontSize: 18,
  },
  brandVoiceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#78350F',
  },

  /* Content Section */
  contentSection: {
    marginBottom: 14,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  contentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minHeight: 100,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1F2937',
    fontWeight: '400',
  },

  /* Platform Previews */
  platformPreviewContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },

  /* Facebook Preview */
  facebookPreview: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fbHeader: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fbAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1877F2',
    marginRight: 10,
  },
  fbHeaderText: {
    flex: 1,
  },
  fbName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  fbTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  fbContent: {
    fontSize: 14,
    color: '#111827',
    padding: 12,
    lineHeight: 26,
  },
  fbImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  fbActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 8,
  },
  fbActionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  fbActionIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1877F2',
  },
  fbActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  /* Instagram Preview */
  instagramPreview: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  igHeader: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  igAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E1306C',
    marginRight: 10,
  },
  igHeaderText: {
    flex: 1,
  },
  igUsername: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  igLocation: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  igMenu: {
    fontSize: 18,
    color: '#6B7280',
  },
  igImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  igContentArea: {
    padding: 12,
    minHeight: 80,
  },
  igContent: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  igActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  igActionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  igActionIcon: {
    fontSize: 16,
  },
  igLikes: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },

  /* Twitter Preview */
  twitterPreview: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#2F3336',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  twHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  twAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DA1F2',
    marginRight: 12,
  },
  twHeaderText: {
    flex: 1,
  },
  twName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E7E9EA',
  },
  twHandle: {
    fontSize: 12,
    color: '#71767B',
    marginTop: 2,
  },
  twMenu: {
    fontSize: 18,
    color: '#71767B',
  },
  twContent: {
    fontSize: 15,
    color: '#E7E9EA',
    lineHeight: 20,
    marginBottom: 12,
  },
  twImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#2F3336',
    borderRadius: 12,
    marginBottom: 12,
  },
  twActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2F3336',
  },
  twActionItem: {
    fontSize: 12,
    color: '#71767B',
    fontWeight: '500',
  },

  /* Threads Preview */
  threadsPreview: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  thHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  thAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333EA',
    marginRight: 12,
  },
  thHeaderText: {
    flex: 1,
  },
  thName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  thTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  thMenu: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  thContent: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 12,
  },
  thImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
  },
  thActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  thActionItem: {
    fontSize: 16,
  },

  /* Hashtags Section */
  hashtagsSection: {
    marginBottom: 24,
  },
  hashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  hashtag: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Scheduled Section */
  scheduledSection: {
    marginBottom: 24,
  },
  scheduledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
  },
  scheduledIcon: {
    fontSize: 18,
  },
  scheduledDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
  },

  spacer: {
    height: 12,
  },

  /* Actions Container */
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  /* Action Buttons */
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  dangerBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
});
