import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function TabsIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}