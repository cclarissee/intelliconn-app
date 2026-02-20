import SuccessNotification from '@/components/SuccessNotification';
import { useTheme } from '@/contexts/ThemeContext';
import { useSuccessNotification } from '@/hooks/useSuccessNotification';
import { deleteAnalyticsByPost } from '@/lib/analyticsDatabase';
import { deleteFromFacebook, deleteFromInstagram } from '@/lib/facebookPostApi';
import { deleteTweet } from '@/lib/twitterApi';
import type { Post } from '@/types/Post';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, LayoutAnimation, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase';
import CreatePost from './CreatePost';
import ViewPost from './ViewPost';

interface ShowPostProps {
  searchQuery?: string;
  statusFilter?: string;
  isDashboard?: boolean;
  onNotify?: (options: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
  }) => void;
}

interface PostItemProps {
  item: Post;
  isDashboard: boolean;
  heldPostId: string | null;
  swipedPostId: string | null;
  swipeDirection: 'left' | 'right' | null;
  deletingPostIds: Set<string>;
  colors: any;
  onLongPress: (post: Post) => void;
  onTapOutside: (postId: string) => void;
  onSwipe: (postId: string, direction: 'left' | 'right') => void;
  onResetSwipe: (postId: string) => void;
  onSwipeAction: (post: Post, action: 'edit' | 'delete') => void;
  onViewPost: (post: Post) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (post: Post) => void;
  animValues: { scale: Animated.Value; opacity: Animated.Value; swipeX: Animated.Value };
  overlayAnim: Animated.Value;
}

// Separate component for post item to avoid hook violations
const PostItem: React.FC<PostItemProps> = ({
  item,
  isDashboard,
  heldPostId,
  swipedPostId,
  swipeDirection,
  deletingPostIds,
  colors,
  onLongPress,
  onTapOutside,
  onSwipe,
  onResetSwipe,
  onSwipeAction,
  onViewPost,
  onEditPost,
  onDeletePost,
  animValues,
  overlayAnim,
}) => {
  const isDeleting = deletingPostIds.has(item.id);
  const deleteSpin = useRef(new Animated.Value(0)).current;
  const deletePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isDeleting) {
      deleteSpin.stopAnimation();
      deleteSpin.setValue(0);
      deletePulse.stopAnimation();
      deletePulse.setValue(1);
      return;
    }

    const spinLoop = Animated.loop(
      Animated.timing(deleteSpin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(deletePulse, {
          toValue: 0.35,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(deletePulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [isDeleting, deleteSpin, deletePulse]);

  const spin = deleteSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // PanResponder for this specific post item
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isDashboard && heldPostId === item.id,
      onMoveShouldSetPanResponder: () => isDashboard && heldPostId === item.id,
      onPanResponderMove: (evt, gestureState) => {
        if (!heldPostId || heldPostId !== item.id) return;
        
        // Threshold of 30 pixels to trigger swipe
        if (Math.abs(gestureState.dx) > 30) {
          const direction = gestureState.dx > 0 ? 'right' : 'left';
          if (swipedPostId !== item.id || swipeDirection !== direction) {
            onSwipe(item.id, direction);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (swipedPostId === item.id) {
          if (Math.abs(gestureState.dx) > 80) {
          } else {
            onResetSwipe(item.id);
          }
        }
      },
    })
  ).current;

  const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        bg: '#F3F4F6',
        text: '#374151',
        border: '#E5E7EB',
      };
    case 'pending':
      return {
        label: 'Pending',
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FCD34D',
      };
    case 'approved':
      return {
        label: 'Approved',
        bg: '#D1FAE5',
        text: '#065F46',
        border: '#6EE7B7',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#FCA5A5',
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        bg: '#EDE9FE',
        text: '#5B21B6',
        border: '#C4B5FD',
      };
    case 'published':
      return {
        label: 'Published',
        bg: '#DBEAFE',
        text: '#1E40AF',
        border: '#93C5FD',
      };
    default:
      return {
        label: 'Unknown',
        bg: '#E5E7EB',
        text: '#374151',
        border: '#D1D5DB',
      };
  }
};

  const statusStyle = getStatusStyle(item.status);
  
  return (
    <Animated.View
      style={{
        transform: [{ scale: animValues.scale }],
        opacity: animValues.opacity,
      }}
    >
      <View {...panResponder.panHandlers}>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isDeleting}
          onPress={() => {
            if (isDashboard && heldPostId === item.id) {
              onTapOutside(item.id);
            } else {
              onViewPost(item);
            }
          }}
          onLongPress={() => onLongPress(item)}
          delayLongPress={300}
          style={[
            styles.postContainer,
            {
              backgroundColor: colors.card,
              borderColor: heldPostId === item.id ? colors.accent : colors.border,
              borderWidth: heldPostId === item.id ? 2 : 1,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
              shadowRadius: colors.shadowRadius,
              elevation: colors.elevation,
            },
          ]}
        >
<View style={styles.postHeader}>
  <Text style={[styles.postTitle, { color: colors.textPrimary }]}>
    {item.title}
  </Text>

{/* STATUS BADGE */}
<View style={{ marginLeft: 10 }}>
  <View
    style={[
      styles.statusBadge,
      {
        backgroundColor: statusStyle.bg,
        borderColor: statusStyle.border,
      },
    ]}
  >
    <Text
      style={[
        styles.statusBadgeText,
        { color: getStatusStyle(item.status).text },
      ]}
    >
      {getStatusStyle(item.status).label}
    </Text>
  </View>
</View>
</View>          
          {isDashboard && !heldPostId ? (
            <Text style={[styles.postContent, { color: colors.textSecondary, fontStyle: 'italic' }]}>
              Tap to view • Hold for actions
            </Text>
          ) : (
            <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
              {item.content}
            </Text>
          )}
          
          {item.status === 'published' && (
            <Text style={[styles.scheduledDate, { color: colors.publishedBadgeText }]}>
              ✓ Published
            </Text>
          )}
          {item.status === 'draft' && (
  <TouchableOpacity
  style={{
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 100,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  }}
  onPress={async () => {
    await updateDoc(doc(db, 'posts', item.id), {
      status: 'pending',
    });
  }}
>
  <Send size={14} color="#fff" />
  <Text
    style={{
      color: '#fff',
      fontWeight: '600',
      fontSize: 13,
    }}
  >
    Submit
  </Text>
</TouchableOpacity>
)}
          {item.scheduledDate && item.status !== 'published' && (
            <Text style={[styles.scheduledDate, { color: colors.accent }]}>
              📅 Scheduled: {item.scheduledDate?.toDate ? item.scheduledDate.toDate().toLocaleString() : 'Invalid date'}
            </Text>
          )}
          <Text style={[styles.postDate, { color: colors.textSecondary }]}>
            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Date unavailable'}
          </Text>
          {item.platforms && item.platforms.length > 0 && (
            <Text style={[styles.postPlatforms, { color: colors.accent }]}>
              Platforms: {item.platforms.join(', ')}
            </Text>
          )}

          {/* Hold Overlay Actions - Only in Dashboard */}
          {isDashboard && heldPostId === item.id && (
            <>
              {/* Swipe Action Background */}
              <Animated.View
                style={[
                  styles.swipeActionBackground,
                  {
                    transform: [{ translateX: animValues.swipeX }],
                  },
                ]}
                pointerEvents="none"
              >
                {/* Right Swipe (Edit) */}
                {swipedPostId === item.id && swipeDirection === 'right' && (
                  <View style={[styles.swipeAction, styles.editActionBg]}>
                    <Text style={styles.swipeActionText}>✏️ Edit</Text>
                  </View>
                )}
                {/* Left Swipe (Delete) */}
                {swipedPostId === item.id && swipeDirection === 'left' && (
                  <View style={[styles.swipeAction, styles.deleteActionBg]}>
                    <Text style={styles.swipeActionText}>🗑️ Delete</Text>
                  </View>
                )}
              </Animated.View>

              {/* Center Overlay with Buttons */}
              <Animated.View
                style={[
                  styles.holdOverlay,
                  {
                    opacity: overlayAnim,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                ]}
                pointerEvents="auto"
              >
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => onSwipeAction(item, 'edit')}
                  >
                    <Text style={styles.actionButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => onSwipeAction(item, 'delete')}
                  >
                    <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </>
          )}

          {isDeleting && !isDashboard && (
            <View style={styles.deletingOverlay} pointerEvents="none">
              <Animated.View style={[styles.deletingSpinner, { transform: [{ rotate: spin }] }]}>
                <Text style={styles.deletingSpinnerText}>⏳</Text>
              </Animated.View>
              <Animated.Text style={[styles.deletingText, { opacity: deletePulse }]}>
                Deleting...
              </Animated.Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const ShowPost: React.FC<ShowPostProps> = ({ searchQuery = '', statusFilter = 'All', isDashboard = false, onNotify }) => {
  const { theme } = useTheme();
  const { showSuccess, notificationProps } = useSuccessNotification();
  const notify = onNotify ?? showSuccess;
  const shouldRenderNotification = !onNotify;
  const colors = theme === 'dark'
    ? {
        background: '#0F172A',
        card: '#1E293B',
        border: '#334155',
        textPrimary: '#F9FAFB',
        textSecondary: '#9CA3AF',
        accent: '#6366F1',
        error: '#EF4444',
        publishedBadgeBg: '#064E3B',
        publishedBadgeText: '#A7F3D0',
        scheduledBadgeBg: '#3B2F12',
        scheduledBadgeText: '#FDE68A',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      }
    : {
        background: '#F9FAFB',
        card: '#fff',
        border: '#E5E7EB',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        accent: '#6366F1',
        error: '#EF4444',
        publishedBadgeBg: '#D1FAE5',
        publishedBadgeText: '#065F46',
        scheduledBadgeBg: '#FEF3C7',
        scheduledBadgeText: '#92400E',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      };

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(new Set());
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [pendingDeletePost, setPendingDeletePost] = useState<Post | null>(null);
  const [deletingOverlayVisible, setDeletingOverlayVisible] = useState(false);
  const [deletingOverlayText, setDeletingOverlayText] = useState('Deleting post...');
  const [heldPostId, setHeldPostId] = useState<string | null>(null);
  const [swipedPostId, setSwipedPostId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  // Animation values for each post
  const animationValues = useRef<Map<string, { scale: Animated.Value; opacity: Animated.Value; swipeX: Animated.Value }>>(new Map());
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const deletingOverlaySpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!deletingOverlayVisible) {
      deletingOverlaySpin.stopAnimation();
      deletingOverlaySpin.setValue(0);
      return;
    }

    const spinLoop = Animated.loop(
      Animated.timing(deletingOverlaySpin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );

    spinLoop.start();

    return () => spinLoop.stop();
  }, [deletingOverlayVisible, deletingOverlaySpin]);

  // Get or create animation values for a post
  const getOrCreateAnimValues = (postId: string) => {
    if (!animationValues.current.has(postId)) {
      animationValues.current.set(postId, {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        swipeX: new Animated.Value(0),
      });
    }
    return animationValues.current.get(postId)!;
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const postsData: Post[] = [];
        querySnapshot.forEach((doc) => {
          postsData.push({ id: doc.id, ...doc.data() } as Post);
        });
        setPosts(postsData);
        setLoading(false);
      },
      (err) => {
        // Silently handle permission errors (e.g., after logout)
        if (err.code !== 'permission-denied') {
          console.error('Error fetching posts:', err);
          setError(`Failed to load posts: ${err.message}`);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter((post) => {
  // 🔎 SEARCH FILTER
  const matchesSearch =
    !searchQuery ||
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.hashtags?.some((tag) =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    post.platforms?.some((platform) =>
      platform.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // 🎯 STATUS FILTER
  let matchesStatus = true;

  if (statusFilter !== "All") {
    matchesStatus = post.status === statusFilter.toLowerCase();
  }

  return matchesSearch && matchesStatus;
});

  const handleViewPost = (post: Post) => {
    if (isDashboard && heldPostId === post.id) {
      return; // Don't open modal if user is holding
    }
    setSelectedPost(post);
    setShowViewModal(true);
  };

  const handleLongPress = (post: Post) => {
    if (!isDashboard) return;
    setHeldPostId(post.id);
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const hideOverlay = () => {
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setHeldPostId(null);
    });
  };

  const handleTapOutside = (postId: string) => {
    if (isDashboard && heldPostId === postId) {
      hideOverlay();
    }
  };

  const handleSwipe = (postId: string, direction: 'left' | 'right') => {
    if (!isDashboard || heldPostId !== postId) return;
    
    setSwipedPostId(postId);
    setSwipeDirection(direction);
    
    const animValues = getOrCreateAnimValues(postId);
    const swipeDistance = direction === 'right' ? 80 : -80;
    
    Animated.timing(animValues.swipeX, {
      toValue: swipeDistance,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const resetSwipe = (postId: string) => {
    const animValues = getOrCreateAnimValues(postId);
    Animated.timing(animValues.swipeX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSwipedPostId(null);
      setSwipeDirection(null);
    });
  };

  const handleSwipeAction = (post: Post, action: 'edit' | 'delete') => {
    resetSwipe(post.id);
    if (action === 'edit') {
      hideOverlay();
      handleEditPost(post);
    } else {
      hideOverlay();
      handleDeletePost(post);
    }
  };

const handleEditPost = (post: Post) => {
  if (post.status === 'pending') {
    notify({
      title: '⏳ Waiting for Approval',
      message: 'You cannot edit a post while it is pending approval.',
      duration: 2500,
    });
    return;
  }

  setSelectedPost(post);
  setShowViewModal(false);
  setShowEditModal(true);
};

  const runDelete = async (post: Post, deleteEverywhere: boolean) => {
    if (isDashboard) {
      setDeletingOverlayText(deleteEverywhere ? 'Deleting post everywhere...' : 'Deleting post...');
      setDeletingOverlayVisible(true);
    }

    // Mark as deleting to trigger exit animation
    setDeletingPostIds((prev) => new Set([...prev, post.id]));

    // Get animation values for this post
    const animValues = getOrCreateAnimValues(post.id);

    // Subtle scale to indicate deletion while keeping content visible
    Animated.timing(animValues.scale, {
      toValue: 0.97,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      // Allow animation to play before removal
      await new Promise((resolve) => setTimeout(resolve, 350));

      if (deleteEverywhere) {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const results: string[] = [];

        if (post.platformPostIds?.facebook) {
          const fbResult = await deleteFromFacebook(
            user.uid,
            post.platformPostIds.facebook
          );
          if (fbResult.success) {
            results.push('✅ Deleted from Facebook');
          } else {
            results.push(`❌ Facebook: ${fbResult.error}`);
          }
        }

        if (post.platformPostIds?.instagram) {
          const igResult = await deleteFromInstagram(
            user.uid,
            post.platformPostIds.instagram
          );
          if (igResult.success) {
            results.push('✅ Deleted from Instagram');
          } else {
            results.push(`❌ Instagram: ${igResult.error}`);
          }
        }

        if (post.platformPostIds?.twitter) {
          try {
            await deleteTweet(post.platformPostIds.twitter);
            results.push('✅ Deleted from Twitter');
          } catch (error: any) {
            results.push(`❌ Twitter: ${error.message || 'Failed to delete'}`);
          }
        }

        if (results.length > 0) {
          notify({
            title: '✅ Delete Complete',
            message: results.join('\n'),
            duration: 3000,
          });
        }
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await deleteDoc(doc(db, 'posts', post.id));
      // Delete associated analytics data
      await deleteAnalyticsByPost(post.id);
      notify({
        title: '✅ Deleted',
        message: 'Post deleted successfully.',
        duration: 2500,
      });
      setShowViewModal(false);
      // Clean up animation values
      animationValues.current.delete(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      notify({
        title: '❌ Error',
        message: 'Failed to delete post. Please try again.',
        duration: 3000,
      });
      // Remove from deleting set and reset animation on error
      setDeletingPostIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
      // Reset animation values
      animValues.scale.setValue(1);
      animValues.opacity.setValue(1);
    } finally {
      if (isDashboard) {
        setDeletingOverlayVisible(false);
      }
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (isDashboard) {
      setPendingDeletePost(post);
      setConfirmDeleteVisible(true);
      return;
    }

    Alert.alert(
      'Delete Post',
      'Do you want to delete this post from the app only, or also remove it from social media platforms?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'App Only',
          onPress: async () => {
            await runDelete(post, false);
          },
        },
        {
          text: 'Everywhere',
          style: 'destructive',
          onPress: async () => {
            await runDelete(post, true);
          },
        },
      ]
    );
  };

  const handleConfirmDelete = async (deleteEverywhere: boolean) => {
    if (!pendingDeletePost) return;
    const postToDelete = pendingDeletePost;
    setConfirmDeleteVisible(false);
    setPendingDeletePost(null);
    await runDelete(postToDelete, deleteEverywhere);
  };

  if (loading) return <Text style={[styles.messageText, { color: colors.textSecondary }]}>Loading posts...</Text>;
  if (error) return <Text style={[styles.messageText, { color: colors.error }]}>{error}</Text>;
  if (posts.length === 0) return <Text style={[styles.messageText, { color: colors.textSecondary }]}>No posts yet. Create your first post!</Text>;
  if (filteredPosts.length === 0) return <Text style={[styles.messageText, { color: colors.textSecondary }]}>No posts match your search criteria.</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {shouldRenderNotification && (
        <SuccessNotification {...notificationProps} />
      )}
      {isDashboard && (
        <Modal
          visible={confirmDeleteVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmDeleteVisible(false)}
        >
          <View style={styles.confirmOverlay}>
            <View
              style={[
                styles.confirmCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.shadowColor,
                  shadowOpacity: colors.shadowOpacity,
                  shadowRadius: colors.shadowRadius,
                  elevation: colors.elevation,
                },
              ]}
            >
              <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Delete this post?</Text>
              <Text style={[styles.confirmText, { color: colors.textSecondary }]}>Choose where to remove it.</Text>
              {pendingDeletePost?.title ? (
                <View style={styles.confirmPostRow}>
                  <Text style={[styles.confirmPostLabel, { color: colors.textSecondary }]}>Post:</Text>
                  <Text style={[styles.confirmPostTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {pendingDeletePost.title}
                  </Text>
                </View>
              ) : null}
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    styles.confirmCancel,
                    { backgroundColor: colors.border, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setConfirmDeleteVisible(false);
                    setPendingDeletePost(null);
                  }}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: colors.accent }]}
                  onPress={() => handleConfirmDelete(false)}
                >
                  <Text style={styles.confirmPrimaryText}>App Only</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: colors.error }]}
                  onPress={() => handleConfirmDelete(true)}
                >
                  <Text style={styles.confirmPrimaryText}>Everywhere</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {isDashboard && deletingOverlayVisible && (
        <Modal visible transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: deletingOverlaySpin.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="sync" size={48} color="#10B981" />
              </Animated.View>
              <Text style={styles.loadingTitle}>Deleting Post...</Text>
              <Text style={styles.loadingText}>{deletingOverlayText}</Text>
            </View>
          </View>
        </Modal>
      )}
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
      {filteredPosts.map((item) => {
        const animValues = getOrCreateAnimValues(item.id);
        
        return (
          <PostItem
            key={item.id}
            item={item}
            isDashboard={isDashboard}
            heldPostId={heldPostId}
            swipedPostId={swipedPostId}
            swipeDirection={swipeDirection}
            deletingPostIds={deletingPostIds}
            colors={colors}
            onLongPress={handleLongPress}
            onTapOutside={handleTapOutside}
            onSwipe={handleSwipe}
            onResetSwipe={resetSwipe}
            onSwipeAction={handleSwipeAction}
            onViewPost={handleViewPost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            animValues={animValues}
            overlayAnim={overlayAnim}
          />
        );
      })}

      <ViewPost
        visible={showViewModal}
        post={selectedPost}
        onClose={() => setShowViewModal(false)}
        onEdit={() => selectedPost && handleEditPost(selectedPost)}
        onDelete={() => selectedPost && handleDeletePost(selectedPost)}
        isDashboard={isDashboard}
      />
      <CreatePost
        visible={showEditModal}
        post={selectedPost}
        onClose={() => setShowEditModal(false)}
        onNotify={notify}
      />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  holdOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  editActionBg: {
    backgroundColor: '#4F46E5',
  },
  deleteActionBg: {
    backgroundColor: '#EF4444',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  swipeHintContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  swipeHint: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#4F46E5',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deletingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletingSpinnerText: {
    fontSize: 18,
  },
  deletingText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  confirmText: {
    fontSize: 13,
    marginBottom: 12,
  },
  confirmPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  confirmPostLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmPostTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  confirmActions: {
    gap: 10,
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancel: {
    borderWidth: 1,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
statusBadge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  borderWidth: 1,
  alignSelf: 'flex-start',
},

statusBadgeText: {
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 0.3,
},

  scheduledDate: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  postContent: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
  postDate: {
    fontSize: 12,
  },
  postPlatforms: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  messageText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
  },
});

export default ShowPost;
