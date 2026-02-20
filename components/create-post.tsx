// app/create-post.tsx
import CreatePost from '@/components/CreatePost';
import { useLocalSearchParams } from 'expo-router';

export default function CreatePostRoute() {
  const { scheduledDate } = useLocalSearchParams<{
    scheduledDate?: string;
  }>();

}
