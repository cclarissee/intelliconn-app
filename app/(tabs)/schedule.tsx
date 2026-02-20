import CreatePost from '@/components/CreatePost';
import FloatingHeader from '@/components/FloatingHeader';
import SuccessNotification from '@/components/SuccessNotification';
import { ThemedText } from '@/components/themed-text';
import ViewPost from '@/components/ViewPost';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/firebase';
import { useSuccessNotification } from '@/hooks/useSuccessNotification';
import { deleteAnalyticsByPost } from '@/lib/analyticsDatabase';
import { deleteFromFacebook, deleteFromInstagram } from '@/lib/facebookPostApi';
import { deleteTweet } from '@/lib/twitterApi';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

/* =======================
   INTERFACES
======================= */
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  userId: string;
  status?: 'draft' | 'scheduled' | 'published';
  platforms?: string[];
  brandVoice?: string;
  hashtags?: string[];
  scheduledDate?: any;
  platformPostIds?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

/* =======================
   THEME COLORS
======================= */
const lightTheme = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  button: '#4F46E5',
  calendarBg: '#FFFFFF',
  calendarText: '#111827',
  calendarArrow: '#4B5563',
};

const darkTheme = {
  background: '#0F172A',
  card: '#1E293B',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  button: '#6366F1',
  calendarBg: '#1E293B',
  calendarText: '#F9FAFB',
  calendarArrow: '#CBD5E1',
};

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showSuccess, notificationProps } = useSuccessNotification();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  /* =======================
     FETCH SCHEDULED POSTS
  ======================= */
  useEffect(() => {
    if (!user || !user.uid) return;

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedPosts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const postData = { id: doc.id, ...doc.data() } as Post;
          // Include posts with scheduledDate OR published posts
          if (postData.scheduledDate || postData.status === 'published') {
            fetchedPosts.push(postData);
          }
        });
        // Sort by scheduledDate on the client side
        fetchedPosts.sort((a, b) => {
          const dateA = a.scheduledDate?.toDate?.() || new Date(0);
          const dateB = b.scheduledDate?.toDate?.() || new Date(0);
          return dateA.getTime() - dateB.getTime();
        });
        setPosts(fetchedPosts);
      },
      (error) => {
        // Silently handle permission errors (e.g., after logout)
        if (error.code !== 'permission-denied') {
          console.error('Error fetching scheduled posts:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  /* =======================
     MARKED DATES
  ======================= */
  const markedDates: Record<
    string,
    { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
  > = {};

  posts.forEach((post) => {
    if (post.scheduledDate?.toDate) {
      const dateStr = post.scheduledDate.toDate().toISOString().split('T')[0];
      markedDates[dateStr] = {
        marked: true,
        dotColor: '#3B82F6',
      };
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch posts by re-subscribing
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing schedule:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const postsForDate = posts.filter((post) => {
    if (post.scheduledDate?.toDate) {
      const dateStr = post.scheduledDate.toDate().toISOString().split('T')[0];
      return dateStr === selectedDate;
    }
    return false;
  });

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setShowViewModal(true);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost || !user) return;

    console.log('Post to delete:', {
      id: selectedPost.id,
      platforms: selectedPost.platforms,
      platformPostIds: selectedPost.platformPostIds,
    });

    Alert.alert(
      'Delete Post',
      'Do you want to delete this post from the app only, or also remove it from social media platforms?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'App Only',
          onPress: async () => {
            // Mark as deleting to trigger animation
            setDeletingPostIds((prev) => new Set([...prev, selectedPost.id]));
            
            try {
              await deleteDoc(doc(db, 'posts', selectedPost.id));
              // Delete associated analytics data
              await deleteAnalyticsByPost(selectedPost.id);
              setShowViewModal(false);
              showSuccess({
                title: '✅ Deleted',
                message: 'Post deleted from app!',
                duration: 3000,
              });
            } catch (error) {
              console.error('Error deleting post:', error);
              showSuccess({
                title: '❌ Error',
                message: 'Failed to delete post',
                duration: 3000,
              });
              setDeletingPostIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(selectedPost.id);
                return newSet;
              });
            }
          },
        },
        {
          text: 'Everywhere',
          style: 'destructive',
          onPress: async () => {
            // Mark as deleting
            setDeletingPostIds((prev) => new Set([...prev, selectedPost.id]));
            
            try {
              const results: string[] = [];

              console.log('=== STARTING DELETE PROCESS ===');
              console.log('Selected post:', selectedPost);
              console.log('Platform IDs:', selectedPost.platformPostIds);
              console.log('Has Facebook ID?', !!selectedPost.platformPostIds?.facebook);
              console.log('Facebook ID value:', selectedPost.platformPostIds?.facebook);

              // Delete from Facebook if it was posted there
              if (selectedPost.platformPostIds?.facebook) {
                console.log('✅ Attempting to delete from Facebook...');
                console.log('Facebook Post ID:', selectedPost.platformPostIds.facebook);
                const fbResult = await deleteFromFacebook(
                  user.uid,
                  selectedPost.platformPostIds.facebook
                );
                console.log('Facebook delete result:', fbResult);
                if (fbResult.success) {
                  results.push('✅ Deleted from Facebook');
                } else {
                  results.push(`❌ Facebook: ${fbResult.error}`);
                }
              } else {
                console.log('❌ No Facebook post ID found - skipping Facebook delete');
                console.log('Full post data:', JSON.stringify(selectedPost, null, 2));
              }

              // Delete from Instagram if it was posted there
              if (selectedPost.platformPostIds?.instagram) {
                console.log('Deleting from Instagram, ID:', selectedPost.platformPostIds.instagram);
                const igResult = await deleteFromInstagram(
                  user.uid,
                  selectedPost.platformPostIds.instagram
                );
                console.log('Instagram delete result:', igResult);
                if (igResult.success) {
                  results.push('✅ Deleted from Instagram');
                } else {
                  results.push(`❌ Instagram: ${igResult.error}`);
                }
              }

              // Delete from Twitter if it was posted there
              if (selectedPost.platformPostIds?.twitter) {
                console.log('Deleting from Twitter, ID:', selectedPost.platformPostIds.twitter);
                try {
                  await deleteTweet(selectedPost.platformPostIds.twitter);
                  results.push('✅ Deleted from Twitter');
                } catch (error: any) {
                  console.log('Twitter delete error:', error);
                  results.push(`❌ Twitter: ${error.message || 'Failed to delete'}`);
                }
              }

              // Delete from Firestore
              await deleteDoc(doc(db, 'posts', selectedPost.id));
              // Delete associated analytics data
              await deleteAnalyticsByPost(selectedPost.id);
              results.push('✅ Deleted from app');

              console.log('=== DELETE COMPLETE ===');
              console.log('Results:', results);

              setShowViewModal(false);
              showSuccess({
                title: '✅ Delete Complete',
                message: results.join('\n'),
                duration: 3000,
              });
            } catch (error) {
              console.error('Error deleting post:', error);
              showSuccess({
                title: '❌ Error',
                message: 'Failed to delete post completely',
                duration: 3000,
              });
              setDeletingPostIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(selectedPost.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SuccessNotification {...notificationProps} />
      <FloatingHeader />

      <FlatList
        data={postsForDate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: 120,
          paddingHorizontal: 16,
          paddingBottom: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.button}
            colors={[colors.button]}
          />
        }
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={[styles.headerRow, { marginTop: 10 }]}>
              <ThemedText type="title" style={{ color: colors.textPrimary }}>
                Schedule
              </ThemedText>
            </View>

            <Text
              style={[styles.subtitleText, { color: colors.textSecondary }]}
            >
              Plan and manage your content calendar posts.
            </Text>

            {/* CALENDAR */}
            <View
              style={[
                styles.calendarContainer,
                { backgroundColor: colors.calendarBg },
              ]}
            >
              <Calendar
                current={selectedDate}
                onDayPress={(day: DateData) =>
                  setSelectedDate(day.dateString)
                }
                markedDates={{
                  ...markedDates,
                  [selectedDate]: {
                    ...(markedDates[selectedDate] || {}),
                    selected: true,
                    selectedColor: colors.button,
                  },
                }}
                theme={{
                  calendarBackground: colors.calendarBg,
                  monthTextColor: colors.calendarText,
                  dayTextColor: colors.calendarText,
                  todayTextColor: '#3B82F6',
                  arrowColor: colors.calendarArrow,
                  textDayFontWeight: '600',
                  textMonthFontWeight: '700',
                  textDayHeaderFontWeight: '600',
                  selectedDayBackgroundColor: colors.button,
                }}
                style={{ borderRadius: 16, overflow: 'hidden' }}
              />
            </View>

            {/* SECTION TITLE */}
            <Text
              style={[styles.sectionTitle, { color: colors.textPrimary }]}
            >
              Posts on {selectedDate}
            </Text>

            {postsForDate.length === 0 && (
              <Text
                style={[
                  styles.noPostsText,
                  { color: colors.textSecondary },
                ]}
              >
                No posts scheduled for this date
              </Text>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const isDeleting = deletingPostIds.has(item.id);
          const isPublished = item.status === 'published';
          const canEditFacebook = isPublished && item.platformPostIds?.facebook && item.platforms?.includes('Facebook');
          const hasTwitter = isPublished && item.platformPostIds?.twitter && item.platforms?.includes('Twitter');
          const hasInstagram = isPublished && item.platformPostIds?.instagram && item.platforms?.includes('Instagram');
          
          return (
            <TouchableOpacity
              style={[styles.postCard, { backgroundColor: colors.card }]}
              onPress={() => handleViewPost(item)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.postTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.postDate,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.scheduledDate?.toDate ? item.scheduledDate.toDate().toLocaleString() : 'No date'}
                </Text>
                {item.platforms && item.platforms.length > 0 && (
                  <Text style={[styles.platformsText, { color: colors.button }]}>
                    {item.platforms.join(', ')}
                  </Text>
                )}
                
                {/* Show edit capability indicator for published posts */}
                {isPublished && (canEditFacebook || hasTwitter || hasInstagram) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 }}>
                    {canEditFacebook && (
                      <View style={{ backgroundColor: '#DEF7EC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#03543F', fontSize: 10, fontWeight: '600' }}>✓ FB Editable</Text>
                      </View>
                    )}
                    {hasTwitter && (
                      <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#92400E', fontSize: 10, fontWeight: '600' }}>⚠ Twitter (paid)</Text>
                      </View>
                    )}
                    {hasInstagram && (
                      <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#991B1B', fontSize: 10, fontWeight: '600' }}>✕ IG No edit</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={[
                styles.statusBadge, 
                item.status === 'published' ? styles.published : styles.scheduled
              ]}>
                <Text style={styles.statusText}>
                  {item.status === 'published' ? 'Published' : 'Scheduled'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* VIEW POST MODAL */}
      <ViewPost
        visible={showViewModal}
        post={selectedPost}
        onClose={() => setShowViewModal(false)}
        onEdit={() => selectedPost && handleEditPost(selectedPost)}
        onDelete={handleDeletePost}
      />

      {/* EDIT POST MODAL */}
      <CreatePost
        visible={showEditModal}
        post={selectedPost}
        onClose={() => setShowEditModal(false)}
        onNotify={showSuccess}
      />
    </View>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },

  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  subtitleText: {
    fontSize: 14,
    marginBottom: 16,
  },

  calendarContainer: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  noPostsText: {
    fontSize: 14,
    marginBottom: 12,
  },

  postCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  postTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  postDate: {
    fontSize: 12,
    marginTop: 2,
  },

  platformsText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  scheduled: { backgroundColor: '#3B82F6' },
  draft: { backgroundColor: '#FBBF24' },
  published: { backgroundColor: '#10B981' },

  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
