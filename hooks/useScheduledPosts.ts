import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { postToFacebook, postToInstagram } from '../lib/facebookPostApi';
import { notifyPostPublished } from '../lib/notifications';

interface Post {
  id: string;
  title: string;
  content: string;
  scheduledDate?: any;
  status?: string;
  platforms?: string[];
  images?: string[];
  urls?: string[];
  userId: string;
}

export const useScheduledPosts = (userId: string | undefined) => {
  // ✅ FIXED TYPE (React Native safe)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (!userId) return;

    // Function to check and publish scheduled posts
    const checkScheduledPosts = async () => {
      const now = new Date();

      // Prevent multiple simultaneous checks
      const currentTime = Date.now();
      if (currentTime - lastCheckRef.current < 30000) {
        return;
      }
      lastCheckRef.current = currentTime;

      const q = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        where('status', '==', 'scheduled')
      );

      const unsubscribe = onSnapshot(
        q,
        async (querySnapshot) => {
          const postsToPublish: Post[] = [];

          querySnapshot.forEach((docSnap) => {
            const post = { id: docSnap.id, ...docSnap.data() } as Post;

            if (post.scheduledDate?.toDate) {
              const scheduledTime = post.scheduledDate.toDate();
              if (scheduledTime <= now) {
                postsToPublish.push(post);
              }
            }
          });

          for (const post of postsToPublish) {
            try {
              console.log(`Publishing scheduled post: ${post.title}`);

              const postData = {
                message: post.content,
                images: post.images || [],
                link:
                  post.urls && post.urls.length > 0
                    ? post.urls[0]
                    : undefined,
              };

              const platformPostIds: {
                facebook?: string;
                instagram?: string;
              } = {};

              const results: {
                platform: string;
                success: boolean;
                error?: string;
              }[] = [];

              if (post.platforms?.includes('Facebook')) {
                try {
                  const fbResult = await postToFacebook(post.userId, postData);
                  results.push({
                    platform: 'Facebook',
                    success: fbResult.success,
                    error: fbResult.error,
                  });
                  if (fbResult.success && fbResult.postId) {
                    platformPostIds.facebook = fbResult.postId;
                  }
                } catch (error: any) {
                  results.push({
                    platform: 'Facebook',
                    success: false,
                    error: error.message,
                  });
                }
              }

              if (post.platforms?.includes('Instagram')) {
                try {
                  const igResult = await postToInstagram(post.userId, postData);
                  results.push({
                    platform: 'Instagram',
                    success: igResult.success,
                    error: igResult.error,
                  });
                  if (igResult.success && igResult.postId) {
                    platformPostIds.instagram = igResult.postId;
                  }
                } catch (error: any) {
                  results.push({
                    platform: 'Instagram',
                    success: false,
                    error: error.message,
                  });
                }
              }

              await updateDoc(doc(db, 'posts', post.id), {
                status: 'published',
                publishedAt: new Date(),
                platformPostIds,
              });

              const userDoc = await getDoc(doc(db, 'users', post.userId));
              const notificationsEnabled = userDoc.exists()
                ? userDoc.data()?.notificationsEnabled ?? true
                : true;

              if (notificationsEnabled) {
                const successful = results.filter((r) => r.success);
                if (successful.length > 0) {
                  await notifyPostPublished(
                    post.title,
                    successful.map((r) => r.platform)
                  );
                }
              }
            } catch (error) {
              console.error('Error publishing post:', error);
            }
          }
        },
        (error) => {
          if (error.code !== 'permission-denied') {
            console.error('Error in scheduled posts listener:', error);
          }
        }
      );

      return unsubscribe;
    };

    checkScheduledPosts();

    intervalRef.current = setInterval(() => {
      checkScheduledPosts();
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);
};
