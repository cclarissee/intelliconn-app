import { useSuccessNotification } from '@/hooks/useSuccessNotification';
import { useWarningNotification } from '@/hooks/useWarningNotification';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView, Share, Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db, storage } from '../firebase';
import { getGlobalConnectedAccounts } from '../lib/connectedAccounts';
import { editFacebookPost, postToFacebook, postToInstagram } from '../lib/facebookPostApi';
import { fetchGeminiApiKey } from '../lib/geminiApi';
import { editTweet, postTweet } from '../lib/twitterApi';
import { fetchUnsplashApiKey } from '../lib/unsplashApi';
import SuccessNotification from './SuccessNotification';
import WarningNotification from './WarningNotification';
import { styles } from './styles/createpost.styles';

const { height } = Dimensions.get('window');

// Add this at the top, define keyword-based hashtag suggestions
const keywordHashtags: { keyword: string; hashtag: string }[] = [
  { keyword: 'marketing', hashtag: '#marketing' },
  { keyword: 'social', hashtag: '#socialmedia' },
  { keyword: 'business', hashtag: '#business' },
  { keyword: 'tech', hashtag: '#tech' },
  { keyword: 'lifestyle', hashtag: '#lifestyle' },
  { keyword: 'food', hashtag: '#food' },
  { keyword: 'travel', hashtag: '#travel' },
  { keyword: 'fitness', hashtag: '#fitness' },
  { keyword: 'fashion', hashtag: '#fashion' },
  { keyword: 'photo', hashtag: '#photography' },
];

/**
 * Maps platform names to their corresponding Ionicons icon names
 * @param platform - The social media platform name (Facebook, Instagram, or Twitter)
 * @returns The Ionicons icon name for the platform
 */
const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'Facebook':
      return 'logo-facebook';
    case 'Instagram':
      return 'logo-instagram';
    case 'Twitter':
      return 'logo-twitter';
    default:
      return 'logo-facebook';
  }
};


interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  userId: string;

  // 🔄 Updated status workflow
  status?: 
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'scheduled'
    | 'published'
    | 'failed';

  // ✅ Approval system
  approvedBy?: string | null;
  approvedAt?: any | null;
  rejectionReason?: string | null;

  // Existing fields
  platforms?: string[];
  brandVoice?: string;
  hashtags?: string[];
  scheduledDate?: any;
  images?: string[];
  urls?: string[];
  platformPostIds?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}


type OnlineImageResult = {
  id: string;
  previewUrl: string;
  fullUrl: string;
  photographer?: string;
  profileUrl?: string;
};

type NotifyOptions = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

export default function CreatePost({ visible, onClose, post, onNotify }: { visible: boolean; onClose: () => void; post?: Post | null; onNotify?: (options: NotifyOptions) => void }) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [contentSuggestions, setContentSuggestions] = useState<string[]>([]);
  const { showSuccess, notificationProps } = useSuccessNotification();
  const { showWarning, notificationProps: warningNotificationProps } = useWarningNotification();
  const notify = onNotify ?? showSuccess;
  const shouldRenderNotification = true; // Always render to show warnings and success
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [engagementScore, setEngagementScore] = useState<number | null>(null);
const [hookStrength, setHookStrength] = useState<string>('');
const [sentiment, setSentiment] = useState<string>('');
const [platformSuggestions, setPlatformSuggestions] = useState<string[]>([]);
const [isAnalyzingPost, setIsAnalyzingPost] = useState(false);

  const STOCK_PHOTOS = [
  {
    id: 'tech1',
    source: require('../assets/stock/tech1.jpg'),
  },
  {
    id: 'tech2',
    source: require('../assets/stock/tech2.jpg'),
  },
  {
    id: 'education1',
    source: require('../assets/stock/tech3.jpg'),
  },
  {
    id: 'coding1',
    source: require('../assets/stock/tech4.jpg'),
  },
];

  const notifyAndClose = (options: NotifyOptions) => {
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
  const finishSave = (options?: {
    suppressSuccessToast?: boolean;
    successTitle?: string;
    successMessage?: string;
    skipClose?: boolean;
  }) => {
    if (options?.suppressSuccessToast) {
      if (!options.skipClose) {
        onClose();
      }
      return;
    }

    notifyAndClose({
      title: options?.successTitle ?? (post ? '✅ Updated' : '✅ Created'),
      message: options?.successMessage ?? (post ? 'Post updated successfully.' : 'Post created successfully.'),
      duration: 3000,
    });
  };

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [brandVoice, setBrandVoice] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [prompt, setPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState<OnlineImageResult[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [showImageResults, setShowImageResults] = useState(false);
  const imageResultsAnim = useRef(new Animated.Value(0)).current;
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [creatingProgress, setCreatingProgress] = useState('');
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const contentSpinAnim = useRef(new Animated.Value(0)).current;
  const hashtagSpinAnim = useRef(new Animated.Value(0)).current;
  const [errors, setErrors] = useState<{ title?: boolean; content?: boolean; platforms?: boolean }>({});
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Custom schedule options
  const [customSchedules, setCustomSchedules] = useState<Array<{id?: string; label: string; minutes?: number; hours?: number; days?: number}>>([]);
  const [quickSchedules, setQuickSchedules] = useState<Array<{id: string; label: string; minutes?: number; hours?: number; days?: number; icon?: string; color?: string}>>([]);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [scheduleLabel, setScheduleLabel] = useState('');
  const [scheduleValue, setScheduleValue] = useState('');
  const [scheduleUnit, setScheduleUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{index: number; label: string} | null>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const scheduleAddAnim = useRef(new Animated.Value(0)).current;
  const scheduleDeleteAnim = useRef(new Animated.Value(0)).current;
  const [isContentFocused, setIsContentFocused] = useState(false);
  const [previewAccountNames, setPreviewAccountNames] = useState({
    facebook: 'Your Page Name',
    instagram: 'your_username',
    twitterName: 'Your Account',
    twitterHandle: '@username',
  });
  const [previewAccountImages, setPreviewAccountImages] = useState({
    facebook: null as string | null,
    instagram: null as string | null,
  });

  
  // Start spin animation when creating post
  useEffect(() => {
    if (isCreatingPost) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isCreatingPost]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animation for AI content generation
  useEffect(() => {
    if (isGeneratingContent) {
      contentSpinAnim.setValue(0);
      Animated.loop(
        Animated.timing(contentSpinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isGeneratingContent]);

  const contentSpin = contentSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animation for AI hashtag generation
  useEffect(() => {
    if (isGeneratingHashtags) {
      hashtagSpinAnim.setValue(0);
      Animated.loop(
        Animated.timing(hashtagSpinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isGeneratingHashtags]);

  const hashtagSpin = hashtagSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animation for schedule addition
  useEffect(() => {
    if (isAddingSchedule) {
      scheduleAddAnim.setValue(0);
      Animated.loop(
        Animated.timing(scheduleAddAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isAddingSchedule]);

  const scheduleAddSpin = scheduleAddAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animation for schedule deletion
  useEffect(() => {
    if (isDeletingSchedule) {
      scheduleDeleteAnim.setValue(0);
      Animated.loop(
        Animated.timing(scheduleDeleteAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isDeletingSchedule]);

  const scheduleDeleteSpin = scheduleDeleteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (!showPreview) return;
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
  }, [showPreview]);

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

      // Pre-fill fields if editing
      if (post) {
        setTitle(post.title || '');
        setContent(post.content || '');
        setPlatforms(post.platforms || []);
        setBrandVoice(post.brandVoice || '');
        setHashtags(post.hashtags || []);
        setScheduledDate(post.scheduledDate?.toDate ? post.scheduledDate.toDate() : null);
        setImages(post.images || []);
        setUrls(post.urls || []);
      } else {
        // Reset fields for new post
        setTitle('');
        setContent('');
        setPlatforms([]);
        setBrandVoice('');
        setHashtags([]);
        setScheduledDate(null);
        setPrompt('');
        setImages([]);
        setUrls([]);
        setNewUrl('');
        setErrors({});
      }
    } else {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
    }
  }, [visible, post]);

  // Load custom schedules from Firestore when component mounts
  useEffect(() => {
    const loadCustomSchedules = async () => {
      const user = getAuth().currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, 'customSchedules'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const schedules = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{id: string; label: string; minutes?: number; hours?: number; days?: number}>;
        setCustomSchedules(schedules);
      } catch (error) {
        console.error('Error loading custom schedules:', error);
      }
    };

    loadCustomSchedules();
  }, []);

  // Load quick schedules from Firestore
  useEffect(() => {
    const loadQuickSchedules = async () => {
      try {
        const q = query(collection(db, 'quickSchedules'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const schedules = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{id: string; label: string; minutes?: number; hours?: number; days?: number; icon?: string; color?: string}>;
        setQuickSchedules(schedules);
      } catch (error) {
        console.error('Error loading quick schedules:', error);
        // Fallback to default quick schedules if collection doesn't exist
        setQuickSchedules([
          { id: '1', label: '10 min', minutes: 10, icon: 'timer-outline', color: '#1E40AF' },
          { id: '2', label: '30 min', minutes: 30, icon: 'timer-outline', color: '#1E40AF' },
          { id: '3', label: '1 hour', hours: 1, icon: 'hourglass-outline', color: '#BE185D' },
          { id: '4', label: '2 hours', hours: 2, icon: 'hourglass-outline', color: '#BE185D' },
          { id: '5', label: 'Tomorrow', days: 1, icon: 'sunny', color: '#4338CA' },
          { id: '6', label: 'Next Week', days: 7, icon: 'calendar-sharp', color: '#4338CA' },
        ]);
      }
    };

    loadQuickSchedules();
  }, []);

  useEffect(() => {
    if (content.trim().length === 0) {
      setContentSuggestions([]);
      return;
    }

    const lowerContent = content.toLowerCase();
    const suggestions = keywordHashtags
      .filter(h => lowerContent.includes(h.keyword) && !hashtags.includes(h.hashtag))
      .map(h => h.hashtag);

    setContentSuggestions(suggestions);
  }, [content, hashtags]);

  /**
   * Validates required fields and updates error state
   * Returns true if all validations pass, false otherwise
   */
  const validateFields = () => {
    const newErrors: typeof errors = {};
    let hasErrors = false;

    if (!content.trim()) {
      newErrors.content = true;
      hasErrors = true;
    }

    if (platforms.length === 0) {
      newErrors.platforms = true;
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  /**
   * Toggles the selection of a social media platform
   * Adds the platform if not selected, removes it if already selected
   * @param p - The platform name to toggle
   */
  const togglePlatform = (p: string) => {
    setPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  /**
   * Adds a new hashtag to the hashtags list
   * Automatically adds '#' prefix if not present
   * Prevents duplicate hashtags
   */
  const addHashtag = () => {
    const tag = newHashtag.trim();
    if (!tag) return; // ignore empty
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!hashtags.includes(formattedTag)) {
      setHashtags([...hashtags, formattedTag]);
    }
    setNewHashtag('');
  };

  /**
   * Updates the hashtag input field value
   * @param text - The new hashtag text input
   */
  const handleHashtagChange = (text: string) => {
    setNewHashtag(text);
  };

  /**
   * Selects a suggested hashtag from the suggestions list
   * Populates the hashtag input field with the selected suggestion
   * @param suggestion - The selected hashtag suggestion
   */
  const selectSuggestion = (suggestion: string) => {
    setNewHashtag(suggestion);
    setShowSuggestions(false);
  };

  /**
   * Generates AI content using Google's Gemini API based on user prompt
   * Uses the Gemini 2.0 Flash model to create content suggestions
   * Shows loading animation during generation
   */
  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      showWarning({
        title: '⚠️ Empty Prompt',
        message: 'Please enter a prompt to generate text.',
        duration: 3000,
      });
      return;
    }

    const user = getAuth().currentUser;
    if (!user) {
      showWarning({
        title: '⚠️ Login Required',
        message: 'You must be logged in to generate content',
        duration: 3000,
      });
      return;
    }

    try {
      // Show loading animation
      setIsGeneratingContent(true);

      // Get Gemini API key from the shared GeminiApi collection
      const geminiApiKey = await fetchGeminiApiKey();

      if (!geminiApiKey) {
        showWarning({
          title: '⚠️ Missing API Key',
          message: 'Gemini API key is missing. Please set it in Settings.',
          duration: 4000,
        });
        setIsGeneratingContent(false);
        return;
      }

      // Use Gemini API with the latest model
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

      // Enhanced prompt for computer studies content that's ready to post
      const enhancedPrompt = `You are a professional social media content creator specializing in Computer Studies and Technology education.

Create an engaging, publication-ready social media post about: ${prompt}

Requirements:
- Focus on Computer Studies topics (programming, software development, computer science, IT, cybersecurity, data science, etc.)
- Write in a ${brandVoice || 'professional yet engaging'} tone
- Keep it concise and impactful (ideal for ${platforms.length > 0 ? platforms.join(' and ') : 'social media'})
- Include relevant emojis to make it visually appealing
- Make it educational but easy to understand
- Add a call-to-action or thought-provoking question at the end
- Write ONLY the post content, no hashtags (those will be generated separately)
- Format for immediate posting without additional editing needed

Post content:`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated';

      setContent(generatedText.trim());
      setPrompt(''); // Clear the prompt after generation
      setIsGeneratingContent(false);

      showSuccess({
        title: '✨ Content Generated',
        message: 'Your content is ready!',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating text:', error);
      setIsGeneratingContent(false);
      showWarning({
        title: '⚠️ Generation Failed',
        message: 'Failed to generate content. Please check your API key.',
        duration: 4000,
      });
    }
  };

  const generateInsights = async () => {
  if (!content.trim()) {
    showWarning({
      title: '⚠️ No Content',
      message: 'Write content first to analyze.',
      duration: 3000,
    });
    return;
  }

  try {
    setIsGeneratingInsights(true);

    const geminiApiKey = await fetchGeminiApiKey();
    if (!geminiApiKey) return;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
You are a social media growth strategist.

Analyze this post and give 5 short actionable improvements.
Keep each suggestion under 15 words.
No long explanations.

Post:
${content}
              `
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const suggestions = text
      .split('\n')
      .map((line: string) => line.replace(/^\d+[\).\s-]*/, '').trim())
      .filter((line: string) => line.length > 0);

    setAiInsights(suggestions);
  } catch (error) {
    console.log(error);
  } finally {
    setIsGeneratingInsights(false);
  }
};

  /**
   * Placeholder function for AI image generation
   * Currently shows a coming soon message
   * Will integrate with AI image generation APIs in the future
   */
  const handleGenerateImage = () => {
    // Placeholder for AI image generation
    showWarning({
      title: '🔨 Coming Soon',
      message: 'AI image generation feature coming soon!',
      duration: 3000,
    });
  };

  /**
   * Generates relevant hashtags using AI based on post content
   * Analyzes content and suggests 5-8 popular hashtags for maximum reach
   * Filters out already existing hashtags
   * Uses Gemini 2.0 Flash model
   */
  const handleGenerateHashtags = async () => {
    if (!content.trim()) {
      showWarning({
        title: '⚠️ Missing Content',
        message: 'Please write some content first to generate hashtags',
        duration: 3000,
      });
      return;
    }

    const user = getAuth().currentUser;
    if (!user) {
      showWarning({
        title: '⚠️ Login Required',
        message: 'You must be logged in to generate hashtags',
        duration: 3000,
      });
      return;
    }

    try {
      // Show loading animation
      setIsGeneratingHashtags(true);

      // Get Gemini API key from the shared GeminiApi collection
      const geminiApiKey = await fetchGeminiApiKey();

      if (!geminiApiKey) {
        showWarning({
          title: '⚠️ Missing API Key',
          message: 'Gemini API key is missing. Please set it in Settings.',
          duration: 4000,
        });
        setIsGeneratingHashtags(false);
        return;
      }

      // Use Gemini API to generate hashtags based on content
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

      const hashtagPrompt = `Analyze the following Computer Studies / Technology education social media post and suggest 5-8 highly relevant, trending hashtags that will maximize reach within the tech education community.

Content: ${content}

Context:
- Field: Computer Studies, Programming, Technology Education
- Platform: ${platforms.length > 0 ? platforms.join(', ') : 'general social media'}
- Tone: ${brandVoice || 'professional'}

Provide hashtags that mix:
1. Broad tech topics (#ComputerScience, #Programming, #TechEducation)
2. Specific technical topics if mentioned (#Python, #AI, #WebDev, etc.)
3. Educational context (#LearnToCode, #TechCommunity, #StudyTips)

Return ONLY the hashtags separated by spaces, each starting with #. No other text or explanation.`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: hashtagPrompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract hashtags from the response
    const suggestedHashtags: string[] = (generatedText as string)
  .split(/\s+/)
  .filter((tag: string) => tag.startsWith('#'))
  .map((tag: string) => tag.trim())
  .filter((tag: string) => tag.length > 1);
  
      if (suggestedHashtags.length > 0) {
        // Add only new hashtags that aren't already in the list
        const newHashtags = suggestedHashtags.filter(tag => !hashtags.includes(tag));
        setHashtags([...hashtags, ...newHashtags]);
        setIsGeneratingHashtags(false);
        showSuccess({
          title: '🤖 Hashtags Added',
          message: `Added ${newHashtags.length} AI-generated hashtag${newHashtags.length !== 1 ? 's' : ''}!`,
          duration: 3000,
        });
      } else {
        setIsGeneratingHashtags(false);
        showWarning({
          title: '⚠️ No Hashtags',
          message: 'Could not generate hashtags. Please try again.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error generating hashtags:', error);
      setIsGeneratingHashtags(false);
      showWarning({
        title: '⚠️ Generation Failed',
        message: 'Failed to generate hashtags. Please try again.',
        duration: 4000,
      });
    }
  };

  const analyzePost = async () => {
  if (!content.trim()) {
    showWarning({
      title: '⚠️ No Content',
      message: 'Write content first to analyze.',
      duration: 3000,
    });
    return;
  }

  try {
    setIsAnalyzingPost(true);

    const geminiApiKey = await fetchGeminiApiKey();
    if (!geminiApiKey) return;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
You are a senior social media growth strategist.

Analyze this post and respond STRICTLY in this format:

Engagement Score: <number 0-100>
Hook Strength: <Weak | Moderate | Strong>
Sentiment: <Positive | Neutral | Negative>

Platform Suggestions:
Instagram: <short suggestion>
Facebook: <short suggestion>
Twitter: <short suggestion>

Post:
${content}
              `
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse AI Response
    const scoreMatch = text.match(/Engagement Score:\s*(\d+)/);
    const hookMatch = text.match(/Hook Strength:\s*(.*)/);
    const sentimentMatch = text.match(/Sentiment:\s*(.*)/);

    const igMatch = text.match(/Instagram:\s*(.*)/);
    const fbMatch = text.match(/Facebook:\s*(.*)/);
    const twMatch = text.match(/Twitter:\s*(.*)/);

    setEngagementScore(scoreMatch ? Number(scoreMatch[1]) : null);
    setHookStrength(hookMatch ? hookMatch[1].trim() : '');
    setSentiment(sentimentMatch ? sentimentMatch[1].trim() : '');

    const suggestions = [
      igMatch ? `Instagram: ${igMatch[1]}` : '',
      fbMatch ? `Facebook: ${fbMatch[1]}` : '',
      twMatch ? `Twitter: ${twMatch[1]}` : '',
    ].filter(Boolean);

    setPlatformSuggestions(suggestions);

  } catch (error) {
    console.log(error);
  } finally {
    setIsAnalyzingPost(false);
  }
};

  /**
   * Opens the device's image picker to select an image
   * Requests media library permissions if not already granted
   * Allows image editing and sets quality to 0.8
   * Adds selected image to the images array
   */
const pickImage = async () => {
  try {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showWarning({
        title: 'Permission Required',
        message: 'Allow gallery access to select images.',
        duration: 3000,
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const selectedUri = result.assets[0].uri;

      console.log("Selected Image URI:", selectedUri); // DEBUG

      setImages(prev => [...prev, selectedUri]);
      setShowMediaBrowser(false);
    }
  } catch (error) {
    console.log("Image picker error:", error);
  }
};

  const saveImageSearchQuery = async (query: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'imageSearches'), {
        userId: user.uid,
        query,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving image search query:', error);
    }
  };

  const searchOnlineImages = async () => {
    const query = imageSearchQuery.trim();
    if (!query) {
      showWarning({
        title: '⚠️ Search Required',
        message: 'Enter a keyword to search for images.',
        duration: 3000,
      });
      return;
    }

    saveImageSearchQuery(query);

    setIsSearchingImages(true);
    try {
      // Fetch Unsplash API key from Firestore
      const accessKey = await fetchUnsplashApiKey();
      
      if (!accessKey) {
        showWarning({
          title: '⚠️ Missing Unsplash Key',
          message: 'The Unsplash API key has not been configured. Please contact your administrator.',
          duration: 4000,
        });
        return;
      }

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash error: ${response.status}`);
      }

      const data = await response.json();
      const results: OnlineImageResult[] = (data?.results || []).map((item: any) => ({
        id: item.id,
        previewUrl: item.urls?.small || item.urls?.regular,
        fullUrl: item.urls?.regular || item.urls?.full,
        photographer: item.user?.name,
        profileUrl: item.user?.links?.html,
      }));

      const filteredResults = results.filter((item) => item.previewUrl && item.fullUrl);
      setImageSearchResults(filteredResults);
      if (filteredResults.length > 0) {
        setShowImageResults(true);
        Animated.spring(imageResultsAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      } else {
        showWarning({
          title: '🔍 No Results',
          message: 'No images found. Try a different search term.',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error searching images:', error);
      showWarning({
        title: '⚠️ Search Failed',
        message: 'Unable to fetch images. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSearchingImages(false);
    }
  };

  const closeImageResults = () => {
    Animated.timing(imageResultsAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowImageResults(false);
      setImageSearchResults([]);
    });
  };

  const addOnlineImage = (url: string) => {
    if (images.includes(url)) {
      showWarning({
        title: '⚠️ Duplicate Image',
        message: 'This image is already added.',
        duration: 2500,
      });
      return;
    }
    setImages([...images, url]);
    showSuccess({
      title: '✓ Image Added',
      message: '',
      duration: 2000,
    });
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const openUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showWarning({
          title: '⚠️ Cannot Open URL',
          message: 'This link cannot be opened on your device.',
          duration: 3000,
        });
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showWarning({
        title: '⚠️ Link Error',
        message: 'Failed to open the link. Please try again.',
        duration: 3000,
      });
    }
  };

  /**
   * Pastes a URL from the device clipboard
   * Validates that clipboard contains a valid http/https URL
   * Populates the URL input field with the clipboard content
   */
  const pasteUrl = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      const normalizedUrl = normalizeUrl(clipboardContent || '');
      if (normalizedUrl && isValidUrl(normalizedUrl)) {
        setNewUrl(normalizedUrl);
      } else {
        showWarning({
          title: '⚠️ Invalid URL',
          message: 'No valid URL found in clipboard.',
          duration: 3000,
        });
      }
    } catch (error) {
      showWarning({
        title: '⚠️ Clipboard Error',
        message: 'Failed to access clipboard.',
        duration: 3000,
      });
    }
  };

  /**
   * Adds a new URL to the URLs list
   * Prevents duplicate URLs and validates non-empty input
   * Clears the URL input field after adding
   */
  const addUrl = () => {
    const normalizedUrl = normalizeUrl(newUrl);
    if (!normalizedUrl) return;
    if (!isValidUrl(normalizedUrl)) {
      showWarning({
        title: '⚠️ Invalid URL',
        message: 'Please enter a valid http/https URL.',
        duration: 3000,
      });
      return;
    }
    if (urls.includes(normalizedUrl)) {
      showWarning({
        title: '⚠️ Duplicate URL',
        message: 'This URL has already been added.',
        duration: 2500,
      });
      return;
    }
    setUrls([...urls, normalizedUrl]);
    setNewUrl('');
  };

  /**
   * Removes an image from the images array
   * @param index - The index of the image to remove
   */
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  /**
   * Removes a URL from the URLs array
   * @param index - The index of the URL to remove
   */
  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  /**
   * Opens the image viewer modal to display a full-size image
   * @param index - The index of the image to view
   */
  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  /**
   * Closes the image viewer modal
   */
  const closeImageViewer = () => {
    setShowImageViewer(false);
  };

  /**
   * Navigates to the next image in the image viewer
   * Wraps around to the first image when reaching the end
   */
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  /**
   * Navigates to the previous image in the image viewer
   * Wraps around to the last image when reaching the beginning
   */
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  /**
   * Saves the post to Firestore as a draft or scheduled post
   * Uploads images to Firebase Storage and gets download URLs
   * Updates existing post if editing, creates new post otherwise
   * Sets post status to 'scheduled' if scheduledDate is set, 'draft' otherwise
   */
interface SavePostOptions {
  suppressSuccessToast?: boolean;
  skipClose?: boolean;
}

const savePost = async (options?: SavePostOptions) => {
  const suppressSuccessToast = options?.suppressSuccessToast ?? false;
  const skipClose = options?.skipClose ?? false;

  if (!title.trim() || !content.trim()) {
    showWarning({
      title: '⚠️ Missing Fields',
      message: 'Title and content are required.',
      duration: 4000,
    });
    return;
  }

  const user = getAuth().currentUser;
  if (!user) return;

  try {
    setIsCreatingPost(true);
    setCreatingProgress('Preparing...');

    const uploadedImageUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageUri = images[i];

      if (imageUri.startsWith('https://firebasestorage.googleapis.com')) {
        uploadedImageUrls.push(imageUri);
        continue;
      }

      setCreatingProgress(`Uploading image ${i + 1} of ${images.length}...`);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const urlExtension = imageUri.split('.').pop()?.toLowerCase();
      const contentType =
        response.headers.get('content-type') ||
        (urlExtension === 'png' ? 'image/png' : 'image/jpeg');

      const imageId = `${Date.now()}_${i}`;
      const storageRef = ref(storage, `postImages/${user.uid}/${imageId}`);

      await uploadBytes(storageRef, blob, { contentType });

      const downloadURL = await getDownloadURL(storageRef);
      uploadedImageUrls.push(downloadURL);
    }

    setCreatingProgress('Saving post...');

    const postStatus: 'scheduled' | 'draft' =
      scheduledDate ? 'scheduled' : 'draft';

    if (post && post.id) {
      await updateDoc(doc(db, 'posts', post.id), {
        title,
        content,
        platforms,
        brandVoice,
        hashtags,
        scheduledDate,
        images: uploadedImageUrls,
        urls,
        status: postStatus,
      });

      if (!suppressSuccessToast) {
        notify({
          title: '✅ Updated',
          message: 'Post updated successfully.',
          duration: 3000,
        });
      }
    } else {
      await addDoc(collection(db, 'posts'), {
        title,
        content,
        platforms,
        brandVoice,
        hashtags,
        scheduledDate,
        images: uploadedImageUrls,
        urls,
        status: postStatus,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      if (!suppressSuccessToast) {
        notify({
          title: '✅ Created',
          message: 'Post created successfully.',
          duration: 3000,
        });
      }
    }

    if (!skipClose) {
      onClose?.();
    }
  } catch (error) {
    console.error('Error saving post:', error);

    showWarning({
      title: '⚠️ Save Failed',
      message: 'Failed to save post. Please try again.',
      duration: 4000,
    });
  } finally {
    setIsCreatingPost(false);
    setCreatingProgress('');
  }
};

  /**
   * Publishes the post directly to Facebook using Facebook Graph API
   * Uploads images to Firebase Storage if needed
   * Saves post to Firestore after successful publication
   */
  const publishToFacebook = async () => {
    if (!content.trim()) {
      showWarning({
        title: '⚠️ Missing Content',
        message: 'Content is required to publish.',
        duration: 3000,
      });
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    try {
      // Upload images first if needed
      const uploadedImageUrls: string[] = [];
      for (const imageUri of images) {
        if (imageUri.startsWith('https://firebasestorage.googleapis.com')) {
          uploadedImageUrls.push(imageUri);
        } else {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const urlExtension = imageUri.split('.').pop()?.toLowerCase();
          const contentType = response.headers.get('content-type') || 
            (urlExtension === 'png' ? 'image/png' : 'image/jpeg');
          const imageId = `${Date.now()}_${Math.random()}`;
          const storageRef = ref(storage, `postImages/${user.uid}/${imageId}`);
          await uploadBytes(storageRef, blob, { contentType });
          const downloadURL = await getDownloadURL(storageRef);
          uploadedImageUrls.push(downloadURL);
        }
      }

      const result = await postToFacebook(user.uid, {
        message: content,
        images: uploadedImageUrls,
        link: urls.length > 0 ? urls[0] : undefined,
      });

      if (result.success) {
        await savePost({ suppressSuccessToast: true, skipClose: true });
        notifyAndClose({
          title: '✅ Posted',
          message: 'Posted to Facebook!',
          duration: 3000,
        });
      } else {
        showWarning({
          title: '⚠️ Post Failed',
          message: result.error || 'Failed to post to Facebook',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error publishing to Facebook:', error);
      showWarning({
        title: '⚠️ Publish Failed',
        message: error.message || 'Failed to publish',
        duration: 4000,
      });
    }
  };

  /**
   * Publishes the post directly to Instagram using Instagram Graph API
   * Requires at least one image (Instagram requirement)
   * Uploads images to Firebase Storage if needed
   * Saves post to Firestore after successful publication
   */
  const publishToInstagram = async () => {
    if (!content.trim()) {
      showWarning({
        title: '⚠️ Missing Caption',
        message: 'Caption is required to publish to Instagram.',
        duration: 3000,
      });
      return;
    }

    if (images.length === 0) {
      showWarning({
        title: '⚠️ Image Required',
        message: 'Instagram requires at least one image or video.',
        duration: 3000,
      });
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    try {
      // Upload images first if needed
      const uploadedImageUrls: string[] = [];
      for (const imageUri of images) {
        if (imageUri.startsWith('https://firebasestorage.googleapis.com')) {
          uploadedImageUrls.push(imageUri);
        } else {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const urlExtension = imageUri.split('.').pop()?.toLowerCase();
          const contentType = response.headers.get('content-type') || 
            (urlExtension === 'png' ? 'image/png' : 'image/jpeg');
          const imageId = `${Date.now()}_${Math.random()}`;
          const storageRef = ref(storage, `postImages/${user.uid}/${imageId}`);
          await uploadBytes(storageRef, blob, { contentType });
          const downloadURL = await getDownloadURL(storageRef);
          uploadedImageUrls.push(downloadURL);
        }
      }

      const result = await postToInstagram(user.uid, {
        message: content,
        images: uploadedImageUrls,
      });

      if (result.success) {
        await savePost({ suppressSuccessToast: true, skipClose: true });
        notifyAndClose({
          title: '✅ Posted',
          message: 'Posted to Instagram!',
          duration: 3000,
        });
      } else {
        showWarning({
          title: '⚠️ Post Failed',
          message: result.error || 'Failed to post to Instagram',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error publishing to Instagram:', error);
      showWarning({
        title: '⚠️ Publish Failed',
        message: error.message || 'Failed to publish',
        duration: 4000,
      });
    }
  };

  /**
   * Publishes the post to Twitter via API first.
   * Falls back to Twitter Web Intent only if API fails.
   * Automatically truncates content to 280 characters.
   */
  const publishToTwitter = async () => {
    if (!content.trim()) {
      showWarning({
        title: '⚠️ Missing Content',
        message: 'Content is required to publish.',
        duration: 3000,
      });
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    // Twitter has a 280 character limit
    let tweetText = content;
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }

    try {
      const result = await postTweet(tweetText);
      if (result && result.id_str) {
        await savePost({ suppressSuccessToast: true, skipClose: true });
        notifyAndClose({
          title: '✅ Posted',
          message: 'Posted to Twitter!',
          duration: 3000,
        });
        return;
      }
      throw new Error('Twitter API post did not return a tweet ID.');
    } catch (error: any) {
      console.error('Error publishing to Twitter:', error);
      Alert.alert(
        'Twitter API Failed',
        `${error.message || 'Unable to post via API.'}\n\nOpen Twitter web to post manually?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Twitter Web',
            onPress: () => {
              const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
              Linking.openURL(tweetUrl);
              savePost();
            },
          },
        ]
      );
    }
  };

  /**
   * Updates an already-published post on social media platforms
   * Only works for platforms that support editing (Facebook)
   * Twitter editing requires paid API tier - shows informational message
   * Instagram does not support editing captions after posting
   * Updates the local Firestore copy regardless of platform update success
   */
  const updatePublishedPost = async () => {
    if (!post || !post.id) {
      showWarning({
        title: '⚠️ No Post',
        message: 'No post to update',
        duration: 3000,
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      showWarning({
        title: '⚠️ Missing Fields',
        message: 'Title and content are required.',
        duration: 4000,
      });
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    try {
      setIsCreatingPost(true);
      setCreatingProgress('Updating published post...');

      // Upload any new images to Firebase Storage
      const uploadedImageUrls: string[] = [];
      for (const imageUri of images) {
        if (imageUri.startsWith('https://firebasestorage.googleapis.com')) {
          uploadedImageUrls.push(imageUri);
        } else {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const urlExtension = imageUri.split('.').pop()?.toLowerCase();
          const contentType = response.headers.get('content-type') || 
            (urlExtension === 'png' ? 'image/png' : 'image/jpeg');
          const imageId = `${Date.now()}_${Math.random()}`;
          const storageRef = ref(storage, `postImages/${user.uid}/${imageId}`);
          await uploadBytes(storageRef, blob, { contentType });
          const downloadURL = await getDownloadURL(storageRef);
          uploadedImageUrls.push(downloadURL);
        }
      }

      const messageWithHashtags = hashtags.length > 0
        ? `${content}\n\n${hashtags.join(' ')}`
        : content;

      const updateResults: { platform: string; success: boolean; error?: string }[] = [];

      // Try to update on each platform where the post was published
      if (post.platformPostIds) {
        // Update Facebook post if it exists
        if (post.platformPostIds.facebook && post.platforms?.includes('Facebook')) {
          setCreatingProgress('Updating Facebook post...');
          const fbResult = await editFacebookPost(
            user.uid,
            post.platformPostIds.facebook,
            messageWithHashtags
          );
          updateResults.push({
            platform: 'Facebook',
            success: fbResult.success,
            error: fbResult.error,
          });
        }

        // Twitter editing - show limitation message
        if (post.platformPostIds.twitter && post.platforms?.includes('Twitter')) {
          setCreatingProgress('Checking Twitter update...');
          const twitterResult = await editTweet(
            post.platformPostIds.twitter,
            content.substring(0, 280)
          );
          updateResults.push({
            platform: 'Twitter',
            success: twitterResult.success,
            error: twitterResult.error,
          });
        }

        // Instagram - cannot edit captions
        if (post.platformPostIds.instagram && post.platforms?.includes('Instagram')) {
          updateResults.push({
            platform: 'Instagram',
            success: false,
            error: 'Instagram does not support editing captions after posting',
          });
        }
      }

      // Update the post in Firestore regardless of platform update success
      setCreatingProgress('Saving changes to database...');
      if (!post.id) {
        throw new Error('Post ID is missing');
      }
      await updateDoc(doc(db, 'posts', post.id), {
        title,
        content,
        platforms,
        brandVoice,
        hashtags,
        images: uploadedImageUrls,
        urls,
        updatedAt: serverTimestamp(),
      });

      // Show results to user
      const successful = updateResults.filter(r => r.success);
      const failed = updateResults.filter(r => !r.success);

      if (updateResults.length === 0) {
        Alert.alert(
          'Updated Locally',
          'Post updated in the app. No active social media connections were found for this post.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else if (failed.length === 0) {
        notifyAndClose({
          title: '✅ Updated',
          message: `Updated on ${successful.map(r => r.platform).join(', ')} and saved locally!`,
          duration: 3500,
        });
      } else if (successful.length > 0) {
        Alert.alert(
          'Partially Updated',
          `✅ Updated on: ${successful.map(r => r.platform).join(', ')}\n\n❌ Could not update:\n${failed.map(r => `${r.platform}: ${r.error}`).join('\n')}\n\nChanges saved locally in the app.`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Updated Locally Only',
          `Could not update on social media platforms:\n\n${failed.map(r => `${r.platform}: ${r.error}`).join('\n')}\n\nChanges were saved locally in the app.`,
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error: any) {
      console.error('Error updating published post:', error);
      showWarning({
        title: '⚠️ Update Failed',
        message: error.message || 'Failed to update post',
        duration: 4000,
      });
    } finally {
      setIsCreatingPost(false);
      setCreatingProgress('');
    }
  };

  /**
   * Unified function to create and publish post to all selected platforms
   * Validates platform-specific requirements (e.g., Instagram needs images)
   * Handles Twitter posting differently (offers Web Intent vs API options)
   * Delegates to proceedWithPosting for actual posting logic
   */
  const createAndPublishPost = async () => {
    if (!validateFields()) {
      showWarning({
        title: '⚠️ Missing Fields',
        message: 'Please fill in title, content, and select at least one platform.',
        duration: 4000,
      });
      return;
    }

    // Validate platform-specific requirements
    if (platforms.includes('Instagram') && images.length === 0) {
      showWarning({
        title: '⚠️ Image Required',
        message: 'Instagram requires at least one image.',
        duration: 4000,
      });
      return;
    }

    // Proceed with API posting; Twitter will fall back to web if needed
    proceedWithPosting();
  };

  /**
   * Core posting logic that handles the actual publishing process
   * Uploads images to Firebase Storage
   * Posts to all selected platforms (Facebook, Instagram, Twitter)
   * Handles scheduled vs immediate posting
   * Saves post to Firestore with appropriate status (scheduled/published/draft)
   * Shows detailed success/failure feedback for each platform
   */
  const proceedWithPosting = async () => {
    const user = getAuth().currentUser;
    if (!user) return;

    setIsCreatingPost(true);
    setCreatingProgress('Preparing post...');

    try {
      // Upload images first if needed
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const imageUri = images[i];
        if (imageUri.startsWith('https://firebasestorage.googleapis.com')) {
          uploadedImageUrls.push(imageUri);
        } else {
          setCreatingProgress(`Uploading image ${i + 1} of ${images.length}...`);
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const urlExtension = imageUri.split('.').pop()?.toLowerCase();
          const contentType = response.headers.get('content-type') || 
            (urlExtension === 'png' ? 'image/png' : 'image/jpeg');
          const imageId = `${Date.now()}_${Math.random()}`;
          const storageRef = ref(storage, `postImages/${user.uid}/${imageId}`);
          await uploadBytes(storageRef, blob, { contentType });
          const downloadURL = await getDownloadURL(storageRef);
          uploadedImageUrls.push(downloadURL);
        }
      }

      // Combine content with hashtags for posting
      const messageWithHashtags = hashtags.length > 0 
        ? `${content}\n\n${hashtags.join(' ')}`
        : content;

      const postData = {
        message: messageWithHashtags,
        images: uploadedImageUrls,
        link: urls.length > 0 ? urls[0] : undefined,
      };

      // Track success for each platform
      const results: { platform: string; success: boolean; error?: string }[] = [];
      const platformPostIds: { facebook?: string; instagram?: string; twitter?: string } = {};
      let twitterFallback = false;
      let twitterFallbackText = '';

      // If scheduled, don't post now - let the scheduling system handle it
      if (scheduledDate) {
        // Validate that scheduled date is in the future
        const now = new Date();
        if (scheduledDate <= now) {
          Alert.alert(
            'Invalid Date',
            'Please select a future date and time for scheduling.',
            [{ text: 'OK' }]
          );
          setIsCreatingPost(false);
          setCreatingProgress('');
          return;
        }
        
        setCreatingProgress('Scheduling post...');
        
        const postStatus = 'scheduled';
        
        if (post && post.id) {
          await updateDoc(doc(db, 'posts', post.id), {
            title,
            content,
            platforms,
            brandVoice,
            hashtags,
            scheduledDate,
            images: uploadedImageUrls,
            urls,
            status: postStatus,
          });
        } else {
          await addDoc(collection(db, 'posts'), {
            title,
            content,
            platforms,
            brandVoice,
            hashtags,
            scheduledDate,
            images: uploadedImageUrls,
            urls,
            status: postStatus,
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
        }
        
        const formattedDate = scheduledDate.toLocaleString();
        notifyAndClose({
          title: '📅 Post Scheduled!',
          message: `Your post will be published on ${formattedDate} to ${platforms.join(', ')}`,
          duration: 5000,
        });
        return;
      }

      // Post immediately if not scheduled
      // Post to Facebook if selected
      if (platforms.includes('Facebook')) {
        setCreatingProgress('Posting to Facebook...');
        const fbResult = await postToFacebook(user.uid, postData);
        results.push({
          platform: 'Facebook',
          success: fbResult.success,
          error: fbResult.error,
        });
        if (fbResult.success && fbResult.postId) {
          platformPostIds.facebook = fbResult.postId;
        }
      }

      // Post to Instagram if selected
      if (platforms.includes('Instagram')) {
        setCreatingProgress('Posting to Instagram...');
        const igResult = await postToInstagram(user.uid, postData);
        results.push({
          platform: 'Instagram',
          success: igResult.success,
          error: igResult.error,
        });
        if (igResult.success && igResult.postId) {
          platformPostIds.instagram = igResult.postId;
        }
      }

      // Post to Twitter if selected
      if (platforms.includes('Twitter')) {
        setCreatingProgress('Posting to Twitter...');
        try {
          // Twitter has a 280 character limit for tweets
          let tweetText = content;
          if (tweetText.length > 280) {
            tweetText = tweetText.substring(0, 277) + '...';
          }
          twitterFallbackText = tweetText;
          
          const twitterResult = await postTweet(tweetText);
          
          // Check if API posting succeeded (requires Basic tier)
          if (twitterResult && twitterResult.id_str) {
            results.push({
              platform: 'Twitter',
              success: true,
            });
            platformPostIds.twitter = twitterResult.id_str;
          } else {
            twitterFallback = true;
            // API posting not available, offer Web Intent
            results.push({
              platform: 'Twitter',
              success: false,
              error: 'API upgrade required (use Web Intent option)',
            });
          }
        } catch (error: any) {
          console.error('Error posting to Twitter:', error);
          twitterFallback = true;
          
          // If error mentions API access, suggest Web Intent
          if (error.message && error.message.includes('access')) {
            results.push({
              platform: 'Twitter',
              success: false,
              error: 'Free tier limitation (tap to use Web Intent)',
            });
          } else {
            results.push({
              platform: 'Twitter',
              success: false,
              error: error.message || 'Failed to post',
            });
          }
        }
      }

      // Save post to Firestore
      setCreatingProgress('Saving post...');
      
      // Determine post status based on results
      const successful = results.filter(r => r.success);
      const postStatus = successful.length > 0 ? 'published' : 'draft';
      
      if (post && post.id) {
        await updateDoc(doc(db, 'posts', post.id), {
          title,
          content,
          platforms,
          brandVoice,
          hashtags,
          scheduledDate,
          images: uploadedImageUrls,
          urls,
          status: postStatus,
          platformPostIds,
          publishedAt: postStatus === 'published' ? serverTimestamp() : null,
        });
      } else {
        await addDoc(collection(db, 'posts'), {
          title,
          content,
          platforms,
          brandVoice,
          hashtags,
          scheduledDate,
          images: uploadedImageUrls,
          urls,
          status: postStatus,
          platformPostIds,
          userId: user.uid,
          createdAt: serverTimestamp(),
          publishedAt: postStatus === 'published' ? serverTimestamp() : null,
        });
      }

      // Show results (already filtered above)
      const failed = results.filter(r => !r.success);

      if (failed.length === 0) {
        notifyAndClose({
          title: '✅ Posted',
          message: `Posted to ${successful.map(r => r.platform).join(', ')}!`,
          duration: 3500,
        });
      } else if (successful.length > 0) {
        Alert.alert(
          'Partially Posted',
          `✅ Success: ${successful.map(r => r.platform).join(', ')}\n\n❌ Failed: ${failed.map(r => `${r.platform} (${r.error})`).join(', ')}\n\nPost saved as published based on successful platforms.`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Post Saved as Draft',
          `All platforms failed to publish:\n${failed.map(r => `${r.platform}: ${r.error}`).join('\n')}\n\nYour post has been saved as a draft.`,
          [{ text: 'OK', onPress: onClose }]
        );
      }

      if (twitterFallback && twitterFallbackText) {
        Alert.alert(
          'Twitter Web Post',
          'Twitter API failed. Open Twitter web to post manually?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Twitter Web',
              onPress: () => {
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterFallbackText)}`;
                Linking.openURL(tweetUrl);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      showWarning({
        title: '⚠️ Creation Failed',
        message: error.message || 'Failed to create post',
        duration: 4000,
      });
    } finally {
      setIsCreatingPost(false);
      setCreatingProgress('');
    }
  };

  /**
   * Opens Facebook's native share dialog
   * Requires a URL to share (Facebook requirement)
   * Falls back to native share menu if no URL is provided
   * @deprecated - This function appears to call undefined functions
   */
const shareViaDialog = async () => {
  if (urls.length === 0) {
    Alert.alert(
      'No URL',
      'Facebook Share Dialog requires a URL. Would you like to use native share instead?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Native Share', onPress: shareViaNative },
      ]
    );
    return;
  }

  try {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      urls[0]
    )}&quote=${encodeURIComponent(content)}`;

    await Linking.openURL(facebookUrl);

    Alert.alert('Shared', 'Content shared to Facebook!');
  } catch (error) {
    console.error('Facebook share failed:', error);
    Alert.alert('Error', 'Failed to open Facebook share dialog.');
  }
};
  /**
   * Opens the device's native share menu
   * Includes all available sharing options (Facebook, Twitter, etc.)
   * Combines content with hashtags for sharing
   * @deprecated - This function appears to call undefined functions
   */
const shareViaNative = async () => {
  if (!content.trim()) {
    Alert.alert('Missing content', 'Content is required to share.');
    return;
  }

  try {
    const shareContent = `${content}\n\n${hashtags.join(' ')}\n${
      urls.length > 0 ? urls[0] : ''
    }`;

    const result = await Share.share({
      message: shareContent,
      title: title || 'Check this out!',
    });

    if (result.action === Share.sharedAction) {
      Alert.alert('Shared', 'Content shared successfully!');
    }
  } catch (error) {
    console.error('Native share failed:', error);
    Alert.alert('Error', 'Failed to share content.');
  }
};


  /**
   * Creates a new custom schedule option
   * Validates label and numeric value
   * Supports minutes, hours, or days as time units
   * Saves to Firestore for persistence
   */
  const addCustomSchedule = async () => {
    if (!scheduleLabel.trim() || !scheduleValue.trim()) {
      showWarning({
        title: '⚠️ Missing Fields',
        message: 'Please enter both label and time value.',
        duration: 4000,
      });
      return;
    }

    const value = parseInt(scheduleValue);
    if (isNaN(value) || value <= 0) {
      showWarning({
        title: '⚠️ Invalid Value',
        message: 'Please enter a valid positive number.',
        duration: 4000,
      });
      return;
    }

    const user = getAuth().currentUser;
    if (!user) {
      showWarning({
        title: '⚠️ Not Authenticated',
        message: 'Please sign in to save custom schedules.',
        duration: 4000,
      });
      return;
    }

    setIsAddingSchedule(true);
    scheduleAddAnim.setValue(0);
    Animated.loop(
      Animated.timing(scheduleAddAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      const newSchedule: any = { 
        label: scheduleLabel.trim(),
        userId: user.uid,
        createdAt: serverTimestamp()
      };
      if (scheduleUnit === 'minutes') newSchedule.minutes = value;
      else if (scheduleUnit === 'hours') newSchedule.hours = value;
      else if (scheduleUnit === 'days') newSchedule.days = value;

      const docRef = await addDoc(collection(db, 'customSchedules'), newSchedule);
      setCustomSchedules([...customSchedules, { ...newSchedule, id: docRef.id }]);
      setScheduleLabel('');
      setScheduleValue('');
      setScheduleUnit('minutes');
      setShowAddScheduleModal(false);
      setIsAddingSchedule(false);
      
      // Use the notify function to ensure notification shows
      showSuccess({
        title: '✅ Successfully Added',
        message: `"${scheduleLabel.trim()}" has been saved to your custom schedules!`,
        duration: 3500,
      });
    } catch (error) {
      console.error('Error adding custom schedule:', error);
      setIsAddingSchedule(false);
      showWarning({
        title: '⚠️ Error',
        message: 'Failed to save custom schedule. Please try again.',
        duration: 4000,
      });
    }
  };

  /**
   * Applies a custom schedule option to set the scheduled date
   * Calculates future date based on schedule parameters (minutes/hours/days)
   * @param schedule - The custom schedule object containing time units
   */
  const applyCustomSchedule = (schedule: any) => {
    const newDate = new Date();
    if (schedule.minutes) newDate.setMinutes(newDate.getMinutes() + schedule.minutes);
    if (schedule.hours) newDate.setHours(newDate.getHours() + schedule.hours);
    if (schedule.days) newDate.setDate(newDate.getDate() + schedule.days);
    setScheduledDate(newDate);
  };

  /**
   * Shows confirmation dialog before deleting a custom schedule
   * @param index - The index of the custom schedule to remove
   */
  const confirmDeleteSchedule = (index: number) => {
    const schedule = customSchedules[index];
    setScheduleToDelete({ index, label: schedule.label });
    setShowDeleteConfirm(true);
  };

  /**
   * Removes a custom schedule option from the list and database
   */
  const removeCustomSchedule = async () => {
    if (!scheduleToDelete) return;
    
    const schedule = customSchedules[scheduleToDelete.index];
    const scheduleLabel = schedule.label;
    
    setIsDeletingSchedule(true);
    scheduleDeleteAnim.setValue(0);
    Animated.loop(
      Animated.timing(scheduleDeleteAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    if (!schedule.id) {
      // Fallback for schedules without ID (shouldn't happen with new implementation)
      setCustomSchedules(customSchedules.filter((_, i) => i !== scheduleToDelete.index));
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
      setIsDeletingSchedule(false);
      showSuccess({
        title: '✅ Successfully Deleted',
        message: `"${scheduleLabel}" has been removed from your custom schedules.`,
        duration: 3500,
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'customSchedules', schedule.id));
      setCustomSchedules(customSchedules.filter((_, i) => i !== scheduleToDelete.index));
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
      setIsDeletingSchedule(false);
      showSuccess({
        title: '✅ Successfully Deleted',
        message: `"${scheduleLabel}" has been removed from your custom schedules.`,
        duration: 3500,
      });
    } catch (error) {
      console.error('Error removing custom schedule:', error);
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
      setIsDeletingSchedule(false);
      showWarning({
        title: '⚠️ Delete Failed',
        message: 'Could not delete the schedule. Please try again.',
        duration: 4000,
      });
    }
  };

  return (
    <>
      {!visible && <SuccessNotification {...notificationProps} />}
      {!visible && <WarningNotification {...warningNotificationProps} />}
      {visible && notificationProps.visible && (
        <Modal visible={true} transparent animationType="none">
          <View style={{ flex: 1 }} pointerEvents="box-none">
            <SuccessNotification {...notificationProps} />
          </View>
        </Modal>
      )}
      {visible && warningNotificationProps.visible && (
        <Modal visible={true} transparent animationType="none">
          <View style={{ flex: 1 }} pointerEvents="box-none">
            <WarningNotification {...warningNotificationProps} />
          </View>
        </Modal>
      )}
      <Modal visible={visible} transparent animationType="none">
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{post ? 'Edit Post' : 'Create New Content'}</Text>
            <Text style={styles.subtitle}>{post ? 'Update your post details' : 'AI-powered Computer Studies content'}</Text>

            {/* Prompt Input */}
            <Text style={styles.section}>AI Assistant</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe what you want to create..."
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={2}
            />

            {/* AI Actions */}
            <View style={styles.aiRow}>
              <TouchableOpacity 
                style={[styles.aiButton, isGeneratingContent && { opacity: 0.7 }]} 
                onPress={handleGenerateText}
                disabled={isGeneratingContent}
              >
                {isGeneratingContent ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Animated.View style={{ transform: [{ rotate: contentSpin }] }}>
                      <Ionicons name="sync" size={16} color="#fff" />
                    </Animated.View>
                    <Text style={[styles.aiText, { marginLeft: 8 }]}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={styles.aiText}>✨ Generate Text</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.aiButtonAlt} onPress={handleGenerateImage}>
                <Text style={styles.aiTextAlt}>🖼 Generate Image</Text>
              </TouchableOpacity>
            </View>

            {/* Platforms */}
<Text style={styles.section}>Platforms</Text>

<View style={{ marginBottom: 12 }}>
  {/* Row 1 - Facebook & Instagram */}
  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
    {['Facebook', 'Instagram'].map(p => (
      <TouchableOpacity
        key={p}
        style={[
          {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: platforms.includes(p) ? '#6366F1' : '#E5E7EB',
            backgroundColor: platforms.includes(p) ? '#EEF2FF' : '#FFFFFF',
          }
        ]}
        onPress={() => {
          togglePlatform(p);
          setErrors(prev => ({ ...prev, platforms: false }));
        }}
      >
        <Ionicons
          name={getPlatformIcon(p) as any}
          size={18}
          color={platforms.includes(p) ? '#6366F1' : '#6B7280'}
          style={{ marginRight: 8 }}
        />
        <Text style={{
          fontWeight: '600',
          color: platforms.includes(p) ? '#4338CA' : '#374151'
        }}>
          {p}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Row 2 - Twitter */}
  <TouchableOpacity
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: platforms.includes('Twitter') ? '#000' : '#E5E7EB',
      backgroundColor: platforms.includes('Twitter') ? '#F3F4F6' : '#FFFFFF',
    }}
    onPress={() => {
      togglePlatform('Twitter');
      setErrors(prev => ({ ...prev, platforms: false }));
    }}
  >
    <Ionicons
      name="logo-twitter"
      size={18}
      color={platforms.includes('Twitter') ? '#000' : '#6B7280'}
      style={{ marginRight: 8 }}
    />
    <Text style={{
      fontWeight: '600',
      color: platforms.includes('Twitter') ? '#000' : '#374151'
    }}>
      Twitter
    </Text>
  </TouchableOpacity>
</View>

{errors.platforms && (
  <Text style={styles.errorText}>
    ⚠️ Select at least one platform
  </Text>
)}
{/* Brand Voice */}
<Text style={styles.section}>Brand Voice</Text>

<View style={{ gap: 10, marginBottom: 16 }}>
  {/* Row 1 */}
  <View style={{ flexDirection: 'row', gap: 10 }}>
    {['Professional', 'Casual'].map(v => (
      <TouchableOpacity
        key={v}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: brandVoice === v ? '#10B981' : '#E5E7EB',
          backgroundColor: brandVoice === v ? '#ECFDF5' : '#FFFFFF',
          alignItems: 'center'
        }}
        onPress={() => setBrandVoice(v)}
      >
        <Text style={{
          fontWeight: '600',
          color: brandVoice === v ? '#047857' : '#374151'
        }}>
          {v}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Row 2 */}
  <View style={{ flexDirection: 'row', gap: 10 }}>
    {['Playful', 'Authoritative'].map(v => (
      <TouchableOpacity
        key={v}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: brandVoice === v ? '#8B5CF6' : '#E5E7EB',
          backgroundColor: brandVoice === v ? '#F5F3FF' : '#FFFFFF',
          alignItems: 'center'
        }}
        onPress={() => setBrandVoice(v)}
      >
        <Text style={{
          fontWeight: '600',
          color: brandVoice === v ? '#6D28D9' : '#374151'
        }}>
          {v}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 6
}}>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text style={styles.section}>Title</Text>
    <Text style={{ marginLeft: 6, fontSize: 12, color: '#9CA3AF' }}>
      (Optional)
    </Text>
  </View>

  {/* Small Preview Button */}
  {platforms.length > 0 && (
    <TouchableOpacity
      onPress={() => setShowPreview(true)}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      <Ionicons name="eye-outline" size={14} color="#6366F1" />
      <Text style={{
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#4338CA'
      }}>
        Preview
      </Text>
    </TouchableOpacity>
  )}
  </View>

  <TextInput
    style={styles.input}
    placeholder="Add your title here"
    value={title}
    onChangeText={setTitle}
  />
            {/* Content */}
            <View style={styles.sectionHeader}>
              <Text style={styles.section}>Content</Text>
              {content.length > 100 && (
                <TouchableOpacity 
                ></TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[styles.input, isContentFocused ? styles.textAreaExpanded : styles.textArea, errors.content && styles.inputError]}
              placeholder="What do you want to share in this post?"
              value={content}
              onChangeText={(text) => {
                setContent(text);
                if (text.trim()) setErrors(prev => ({ ...prev, content: false }));
              }}
              onFocus={() => setIsContentFocused(true)}
              onBlur={() => setIsContentFocused(false)}
              multiline
              maxLength={5000}
            />
            {errors.content && <Text style={styles.errorText}>⚠️ Content is required</Text>}

            <View style={{
  marginTop: 16,
  backgroundColor: '#F8FAFC',
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: '#E2E8F0'
}}>
  <View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  }}>
    <Text style={{
      fontSize: 15,
      fontWeight: '800',
      color: '#111827'
    }}>
      ✨ AI Post Analyzer
    </Text>

    <TouchableOpacity
      onPress={analyzePost}
      disabled={isAnalyzingPost}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: '#6366F1'
      }}>
        {isAnalyzingPost ? 'Analyzing...' : 'Analyze'}
      </Text>
    </TouchableOpacity>
  </View>

  {engagementScore !== null && (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>
        📊 Engagement Score: {engagementScore}/100
      </Text>
    </View>
  )}

  {hookStrength && (
    <Text style={{ fontSize: 13, marginBottom: 6 }}>
      🔥 Hook Strength: {hookStrength}
    </Text>
  )}

  {sentiment && (
    <Text style={{ fontSize: 13, marginBottom: 6 }}>
      🧠 Sentiment: {sentiment}
    </Text>
  )}

  {platformSuggestions.length > 0 && (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
        🎯 Platform Suggestions
      </Text>
      {platformSuggestions.map((item, index) => (
        <Text key={index} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
          • {item}
        </Text>
      ))}
    </View>
  )}
</View>
            {/* Media Browser Button */}
<TouchableOpacity
  style={{
    marginTop: 10,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }}
  onPress={() => setShowMediaBrowser(true)}
>
  <Ionicons name="images-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
  <Text style={{ color: '#fff', fontWeight: '700' }}>
    Open Media Browser
  </Text>
</TouchableOpacity>
{images.length > 0 && (
  <View style={{ marginTop: 12 }}>
    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
      Selected Images
    </Text>

    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {images.map((uri, index) => (
        <View key={index} style={{ marginRight: 10 }}>
          <Image
            source={{ uri }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 12,
              backgroundColor: '#E5E7EB'
            }}
            resizeMode="cover"
          />

          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => removeImage(index)}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: '#EF4444',
              borderRadius: 12,
              width: 24,
              height: 24,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Ionicons name="close" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  </View>
)}
            {/* Online Images */}
            <Text style={styles.section}>Online Images</Text>
            <View style={styles.onlineSearchRow}>
              <TextInput
                style={[styles.input, styles.onlineSearchInput]}
                placeholder="Search images (e.g. school event)"
                value={imageSearchQuery}
                onChangeText={(text) => {
                  setImageSearchQuery(text);
                  if (!text.trim() && showImageResults) {
                    closeImageResults();
                  }
                }}
              />
              <TouchableOpacity
                style={styles.onlineSearchButton}
                onPress={searchOnlineImages}
                disabled={isSearchingImages}
              >
                <Text style={styles.onlineSearchButtonText}>
                  {isSearchingImages ? 'Searching...' : 'Search'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Expandable Image Results */}
            {showImageResults && imageSearchResults.length > 0 && (
              <Animated.View
                style={[
                  styles.inlineImageResultsContainer,
                  {
                    opacity: imageResultsAnim,
                    transform: [
                      {
                        scaleY: imageResultsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.inlineResultsHeader}>
                  <Text style={styles.inlineResultsTitle}>
                    🖼️ Found {imageSearchResults.length} image{imageSearchResults.length !== 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity
                    style={styles.inlineCloseButton}
                    onPress={closeImageResults}
                  >
                    <Ionicons name="close-circle" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.inlineImageScroll}
                  contentContainerStyle={styles.inlineImageScrollContent}
                >
                  {imageSearchResults.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.inlineImageCard,
                        index === 0 && styles.inlineImageCardFirst,
                        index === imageSearchResults.length - 1 && styles.inlineImageCardLast,
                      ]}
                      onPress={() => {
                        addOnlineImage(item.fullUrl);
                        // Optional: auto-close after adding
                        // closeImageResults();
                      }}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: item.previewUrl }}
                        style={styles.inlineImage}
                        resizeMode="cover"
                      />
                      <View style={styles.inlineImageOverlay}>
                        <View style={styles.inlineImageAddIcon}>
                          <Ionicons name="add-circle" size={40} color="rgba(255, 255, 255, 0.95)" />
                        </View>
                      </View>
                      {item.photographer && (
                        <View style={styles.inlineImagePhotographer}>
                          <Text style={styles.inlineImagePhotographerText} numberOfLines={1}>
                            📷 {item.photographer}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.inlineUnsplashAttribution}
                  onPress={() => openUrl('https://unsplash.com')}
                >
                  <Text style={styles.inlineUnsplashAttributionText}>
                    Images from Unsplash
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* URLs - Enhanced Design */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ 
                  backgroundColor: '#DBEAFE', 
                  borderRadius: 6, 
                  width: 28, 
                  height: 28, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginRight: 8
                }}>
                  <Ionicons name="link" size={16} color="#0284C7" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>URLs & Links</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Add reference links to your post</Text>
                </View>
              </View>
              
              <View style={styles.urlRow}>
                <View style={styles.urlInputWrapper}>
                  <Ionicons name="link-outline" size={18} color="#9CA3AF" style={styles.urlInputIcon} />
                  <TextInput
                    style={styles.urlInput}
                    placeholder="Paste or type URL..."
                    placeholderTextColor="#D1D5DB"
                    value={newUrl}
                    onChangeText={setNewUrl}
                    keyboardType="url"
                  />
                </View>
                <TouchableOpacity style={styles.pasteButton} onPress={pasteUrl}>
                  <Ionicons name="clipboard-outline" size={16} color="#0284C7" />
                  <Text style={styles.pasteText}>Paste</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addUrlButton} onPress={addUrl}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addUrlText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            {urls.length > 0 && (
              <View style={styles.urlContainer}>
                {urls.map((url, index) => (
                  <View key={index} style={styles.urlWrapper}>
                    <TouchableOpacity
                      style={styles.urlTextWrapper}
                      onPress={() => openUrl(url)}
                    >
                      <Text style={styles.urlText} numberOfLines={1}>{url}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.urlOpenButton}
                      onPress={() => openUrl(url)}
                    >
                      <Ionicons name="open-outline" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeUrl(index)}
                    >
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

           {/* Hashtags Section - Enhanced Design */}
<View style={styles.hashtagSection}>
  <View style={styles.hashtagHeader}>
    <View style={styles.hashtagTitleRow}>
      <Ionicons name="pricetags" size={20} color="#6366F1" style={{ marginRight: 8 }} />
      <Text style={styles.hashtagTitle}>Hashtags</Text>
      {hashtags.length > 0 && (
        <View style={styles.hashtagCountBadge}>
          <Text style={styles.hashtagCountText}>{hashtags.length}</Text>
        </View>
      )}
    </View>
    <Text style={styles.hashtagSubtitle}>Boost your reach with relevant hashtags</Text>
  </View>

  {/* Hashtag Input with Icon */}
  <View style={styles.hashtagInputContainer}>
    <View style={styles.hashtagInputWrapper}>
      <Ionicons name="pricetag-outline" size={18} color="#9CA3AF" style={styles.hashtagInputIcon} />
      <TextInput
        style={styles.hashtagInput}
        placeholder="e.g. marketing, socialmedia"
        placeholderTextColor="#9CA3AF"
        value={newHashtag}
        onChangeText={handleHashtagChange}
      />
    </View>
    <TouchableOpacity style={styles.hashtagAddButton} onPress={addHashtag}>
      <Ionicons name="add" size={20} color="#fff" />
    </TouchableOpacity>
  </View>

  {/* Selected Hashtags with Enhanced Design */}
  {hashtags.length > 0 && (
    <View style={styles.selectedHashtagsContainer}>
      <Text style={styles.selectedHashtagsLabel}>Selected Tags</Text>
      <View style={styles.selectedHashtagsWrap}>
        {hashtags.map((tag: string, index: number) => (
          <View key={index} style={styles.hashtagChip}>
            <View style={styles.hashtagChipContent}>
              <Ionicons name="pricetag" size={12} color="#6366F1" style={{ marginRight: 4 }} />
              <Text style={styles.hashtagChipText}>{tag}</Text>
            </View>
            <TouchableOpacity
              style={styles.hashtagRemoveButton}
              onPress={() => {
                setHashtags(hashtags.filter((_, i) => i !== index));
              }}
            >
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  )}

  {/* AI Generate Hashtags Button with Gradient Effect */}
  <TouchableOpacity 
    style={[styles.aiHashtagButton, isGeneratingHashtags && { opacity: 0.7 }]} 
    onPress={handleGenerateHashtags}
    disabled={isGeneratingHashtags}
  >
    <View style={styles.aiHashtagButtonContent}>
      {isGeneratingHashtags ? (
        <>
          <Animated.View style={{ transform: [{ rotate: hashtagSpin }] }}>
            <Ionicons name="sync" size={18} color="#fff" />
          </Animated.View>
          <Text style={styles.aiHashtagButtonText}>Generating...</Text>
        </>
      ) : (
        <>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.aiHashtagButtonText}>AI Generate Hashtags</Text>
        </>
      )}
    </View>
  </TouchableOpacity>

  {/* Suggestions based on content with Enhanced Design */}
  {contentSuggestions.length > 0 && (
    <View style={styles.suggestionsSection}>
      <View style={styles.suggestionsTitleRow}>
        <Ionicons name="bulb" size={14} color="#F59E0B" style={{ marginRight: 6 }} />
        <Text style={styles.suggestionsTitle}>Smart Suggestions</Text>
      </View>
      <View style={styles.suggestionsWrap}>
        {contentSuggestions.map(tag => (
          <TouchableOpacity
            key={tag}
            style={styles.suggestionChip}
            onPress={() => {
              if (!hashtags.includes(tag)) setHashtags([...hashtags, tag]);
            }}
          >
            <Ionicons name="add-circle" size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
            <Text style={styles.suggestionChipText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )}
</View>
            {/* Quick Schedule Section - Enhanced Design */}
            <View style={{ 
              backgroundColor: '#F9FAFB', 
              borderRadius: 12, 
              padding: 12, 
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB'
            }}>
              {/* Section Header */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 12,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    backgroundColor: '#690264', 
                    borderRadius: 6, 
                    width: 28, 
                    height: 28, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginRight: 8
                  }}>
                    <Ionicons name="time" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 1 }}>
                      Quick Schedule
                    </Text>
                    <Text style={{ fontSize: 10, color: '#9CA3AF' }}>
                      One-tap scheduling options
                    </Text>
                  </View>
                </View>
                {post?.status !== 'published' && (
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#6B7280', 
                      paddingHorizontal: 10, 
                      paddingVertical: 6, 
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                    onPress={() => setShowAddScheduleModal(true)}
                  >
                    <Ionicons name="add-circle" size={12} color="#fff" style={{ marginRight: 3 }} />
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 11 }}>Custom</Text>
                  </TouchableOpacity>
                )}
              </View>
            
              {/* Quick Time Options - Loaded from Database */}
              {quickSchedules.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="flash" size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', letterSpacing: 0.3 }}>
                      QUICK TIMES
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {quickSchedules.map((schedule) => {
                      // Determine background and border colors based on schedule
                      const isTimeFormat = schedule.minutes !== undefined || schedule.hours !== undefined;
                      const bgColor = post?.status === 'published' ? '#E5E7EB' : '#F3F4F6';
                      const borderColor = post?.status === 'published' ? '#D1D5DB' : '#D1D5DB';
                      const textColor = post?.status === 'published' ? '#9CA3AF' : '#4B5563';
                      const icon = schedule.icon || (isTimeFormat ? 'timer-outline' : 'sunny');

                      return (
                        <TouchableOpacity
                          key={schedule.id}
                          style={{
                            backgroundColor: bgColor,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: borderColor,
                            minWidth: schedule.days !== undefined ? 90 : 60
                          }}
                          onPress={() => {
                            if (post?.status === 'published') return;
                            const newDate = new Date();
                            if (schedule.minutes) newDate.setMinutes(newDate.getMinutes() + schedule.minutes);
                            if (schedule.hours) newDate.setHours(newDate.getHours() + schedule.hours);
                            if (schedule.days) newDate.setDate(newDate.getDate() + schedule.days);
                            setScheduledDate(newDate);
                          }}
                          disabled={post?.status === 'published'}
                        >
                          <Ionicons
                            name={icon as any}
                            size={12}
                            color={textColor}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={{
                            color: textColor,
                            fontWeight: '600',
                            fontSize: 11
                          }}>
                            {schedule.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Custom Schedules */}
              {customSchedules.length > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="star" size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', letterSpacing: 0.3 }}>
                      YOUR CUSTOM TIMES
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {customSchedules.map((schedule, index) => (
                      <View 
                        key={index} 
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          backgroundColor: post?.status === 'published' ? '#E5E7EB' : '#F3F4F6',
                          paddingLeft: 10, 
                          paddingRight: post?.status === 'published' ? 10 : 6, 
                          paddingVertical: 6, 
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: post?.status === 'published' ? '#D1D5DB' : '#D1D5DB'
                        }}
                      >
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => post?.status !== 'published' && applyCustomSchedule(schedule)}
                          disabled={post?.status === 'published'}
                        >
                          <Ionicons 
                            name="sparkles" 
                            size={12} 
                            color={post?.status === 'published' ? '#9CA3AF' : '#6B7280'} 
                            style={{ marginRight: 4 }} 
                          />
                          <Text style={{ 
                            color: post?.status === 'published' ? '#9CA3AF' : '#4B5563', 
                            fontWeight: '600', 
                            fontSize: 11 
                          }}>
                            {schedule.label}
                          </Text>
                        </TouchableOpacity>
                        {post?.status !== 'published' && (
                          <TouchableOpacity
                            style={{ 
                              marginLeft: 6, 
                              padding: 3,
                              backgroundColor: '#FEE2E2',
                              borderRadius: 4
                            }}
                            onPress={() => confirmDeleteSchedule(index)}
                          >
                            <Ionicons name="close" size={10} color="#DC2626" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Custom Date/Time Picker - Enhanced */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="calendar-number" size={16} color="#6366F1" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>
                  Or pick a specific date & time
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  { 
                    backgroundColor: post?.status === 'published' ? '#F3F4F6' : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: scheduledDate ? '#6366F1' : '#E2E8F0',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2
                  }
                ]}
                onPress={() => post?.status !== 'published' && setShowDatePicker(true)}
                disabled={post?.status === 'published'}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons 
                    name={scheduledDate ? "checkmark-circle" : "time"} 
                    size={22} 
                    color={scheduledDate ? '#10B981' : '#94A3B8'} 
                    style={{ marginRight: 12 }} 
                  />
                  <Text style={{ 
                    fontSize: 15, 
                    color: scheduledDate ? '#1E293B' : '#94A3B8',
                    fontWeight: scheduledDate ? '600' : '400',
                    flex: 1
                  }}>
                    {scheduledDate ? scheduledDate.toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    }) : 'Tap to select date & time'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            {/* Show info message for published posts */}
            {post?.status === 'published' && (
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' }}>
                Schedule time cannot be changed for published posts
              </Text>
            )}
            
            {/* Clear scheduled date button */}
            {scheduledDate && post?.status !== 'published' && (
              <TouchableOpacity
                style={{ backgroundColor: '#FEE2E2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' }}
                onPress={() => setScheduledDate(null)}
              >
                <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 13 }}>✕ Clear Schedule</Text>
              </TouchableOpacity>
            )}

            {/* Android: Show time picker button after date is selected */}
            {Platform.OS === 'android' && scheduledDate && post?.status !== 'published' && (
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ fontSize: 16, color: '#111827' }}>
                  Change Time: {scheduledDate.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>
            )}

            {/* iOS: Single datetime picker */}
            {Platform.OS === 'ios' && showDatePicker && (
              <DateTimePicker
                value={scheduledDate || new Date()}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setScheduledDate(selectedDate);
                  }
                }}
              />
            )}

            {/* Android: Separate date picker */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={scheduledDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    // Preserve existing time or use current time
                    const currentTime = scheduledDate || new Date();
                    const newDate = new Date(selectedDate);
                    newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                    setScheduledDate(newDate);
                  }
                }}
              />
            )}

            {/* Android: Separate time picker */}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={scheduledDate || new Date()}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    // Preserve existing date or use current date
                    const currentDate = scheduledDate || new Date();
                    const newDate = new Date(currentDate);
                    newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                    setScheduledDate(newDate);
                  }
                }}
              />
            )}

            {/* Actions */}
            <View style={styles.actionButtons}>
              {/* Show different buttons based on post status */}
              {post && post.status === 'published' ? (
                // Editing a published post - show update button
                <>
                  <TouchableOpacity style={styles.createPostButton} onPress={updatePublishedPost}>
                    <Ionicons name="sync" size={20} color="#fff" />
                    <Text style={styles.createPostButtonText}>
                      Update Published Post
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={{ 
                    backgroundColor: '#FEF3C7', 
                    padding: 12, 
                    borderRadius: 8, 
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: '#F59E0B'
                  }}>
                    <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '500' }}>
                      ⚠️ Platform Update Limitations:
                    </Text>
                    <Text style={{ color: '#92400E', fontSize: 12, marginTop: 4 }}>
                      • Facebook: Can be updated{'\n'}
                      • Twitter: Requires paid API tier{'\n'}
                      • Instagram: Cannot edit captions{'\n'}
                    </Text>
                  </View>
                </>
              ) : (
                // Creating new post or editing draft/scheduled - show publish button
                <>
                  {platforms.length > 0 && (
                    <TouchableOpacity style={styles.createPostButton} onPress={createAndPublishPost}>
                      <Ionicons name="send" size={20} color="#fff" />
                      <Text style={styles.createPostButtonText}>
                        Create Post {platforms.length > 0 && `(${platforms.join(', ')})`}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Save as Draft Button */}
<TouchableOpacity
  style={styles.saveDraftButton}
  onPress={() => savePost()}
>
  <Ionicons name="save-outline" size={20} color="#6B7280" />
  <Text style={styles.saveDraftButtonText}>Save as Draft</Text>
</TouchableOpacity>

                </>
              )}

              <TouchableOpacity style={styles.secondary} onPress={onClose}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* Image Viewer Modal */}
      <Modal visible={showImageViewer} transparent animationType="fade">
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={closeImageViewer}>
            <Text style={styles.imageViewerCloseText}>✕</Text>
          </TouchableOpacity>

          {images.length > 1 && (
            <>
              <TouchableOpacity style={[styles.imageViewerNav, styles.imageViewerNavLeft]} onPress={prevImage}>
                <Text style={styles.imageViewerNavText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.imageViewerNav, styles.imageViewerNavRight]} onPress={nextImage}>
                <Text style={styles.imageViewerNavText}>›</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.imageViewerContent}>
            <Image
              source={{ uri: images[currentImageIndex] }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
            <Text style={styles.imageViewerCounter}>
              {currentImageIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Full Content Viewer Modal */}
      <Modal visible={showFullContent} transparent animationType="fade">
        <View style={styles.fullContentOverlay}>
          <View style={styles.fullContentContainer}>
            <View style={styles.fullContentHeader}>
              <Text style={styles.fullContentTitle}>Full Content</Text>
              <TouchableOpacity 
                style={styles.fullContentClose} 
                onPress={() => setShowFullContent(false)}
              >
                <Text style={styles.fullContentCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.fullContentScroll}>
              <Text style={styles.fullContentText}>{content}</Text>
            </ScrollView>

            <View style={styles.fullContentFooter}>
              <Text style={styles.fullContentCount}>
                {content.length} characters
              </Text>
              <TouchableOpacity 
                style={styles.fullContentButton}
                onPress={() => setShowFullContent(false)}
              >
                <Text style={styles.fullContentButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 16,
            overflow: 'hidden'
          }}>
            {/* Header with Icon */}
            <View style={{
              backgroundColor: '#FEF2F2',
              paddingVertical: 24,
              paddingHorizontal: 24,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#FEE2E2'
            }}>
              <View style={{
                backgroundColor: '#FEE2E2',
                borderRadius: 20,
                width: 64,
                height: 64,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                borderWidth: 3,
                borderColor: '#FECACA'
              }}>
                <Ionicons name="trash-outline" size={32} color="#DC2626" />
              </View>
              <Text style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#991B1B',
                textAlign: 'center',
                letterSpacing: 0.3
              }}>
                Delete Schedule?
              </Text>
            </View>

            {/* Content */}
            <View style={{ padding: 24 }}>
              <Text style={{
                fontSize: 15,
                color: '#374151',
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 8
              }}>
                Are you sure you want to delete
              </Text>
              <View style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB'
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#1F2937',
                  textAlign: 'center'
                }}>
                  "{scheduleToDelete?.label}"
                </Text>
              </View>
              <Text style={{
                fontSize: 13,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 20
              }}>
                This action cannot be undone. The schedule will be permanently removed from your account.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 24,
              paddingBottom: 24
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#E5E7EB'
                }}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setScheduleToDelete(null);
                }}
              >
                <Text style={{
                  color: '#4B5563',
                  fontWeight: '700',
                  fontSize: 16
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isDeletingSchedule}
                style={{
                  flex: 1,
                  backgroundColor: isDeletingSchedule ? '#991B1B' : '#DC2626',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  shadowColor: '#DC2626',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDeletingSchedule ? 0.15 : 0.3,
                  shadowRadius: 8,
                  elevation: isDeletingSchedule ? 2 : 6,
                  opacity: isDeletingSchedule ? 0.8 : 1
                }}
                onPress={removeCustomSchedule}
              >
                {isDeletingSchedule ? (
                  <>
                    <Animated.View style={{ transform: [{ rotate: scheduleDeleteSpin }] }}>
                      <Ionicons name="sync" size={18} color="#fff" style={{ marginRight: 6 }} />
                    </Animated.View>
                    <Text style={{
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: 16
                    }}>
                      Deleting...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: 16
                    }}>
                      Delete
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Custom Schedule Modal - Enhanced Design */}
      <Modal visible={showAddScheduleModal} transparent animationType="slide">
        <View style={styles.fullContentOverlay}>
          <View style={[styles.fullContentContainer, { maxHeight: 550, borderRadius: 24 }]}>
            {/* Modern Header with Gradient Effect */}
            <View style={{
              backgroundColor: '#6366F1',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingVertical: 20,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="add-circle" size={26} color="#fff" />
                </View>
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 }}>
                    Create Schedule
                  </Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                    Save your custom time preset
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => setShowAddScheduleModal(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              {/* Label Input */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="pricetag" size={18} color="#6366F1" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Schedule Label</Text>
                </View>
                <View style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 2,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 4
                }}>
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: '#1E293B',
                      paddingVertical: 12
                    }}
                    placeholder="e.g., Quick 5min, Lunch Break, Evening Post"
                    placeholderTextColor="#94A3B8"
                    value={scheduleLabel}
                    onChangeText={setScheduleLabel}
                  />
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 6, marginLeft: 4 }}>
                  Give your schedule a memorable name
                </Text>
              </View>

              {/* Time Value Input */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="timer" size={18} color="#6366F1" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Time Value</Text>
                </View>
                <View style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 2,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 4
                }}>
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: '#1E293B',
                      paddingVertical: 12,
                      fontWeight: '600'
                    }}
                    placeholder="Enter number"
                    placeholderTextColor="#94A3B8"
                    value={scheduleValue}
                    onChangeText={setScheduleValue}
                    keyboardType="number-pad"
                  />
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 6, marginLeft: 4 }}>
                  How many units from now?
                </Text>
              </View>

              {/* Time Unit Selector */}
              <View style={{ marginBottom: 28 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="options" size={18} color="#6366F1" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Time Unit</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        borderWidth: 2,
                        flexDirection: 'row',
                        justifyContent: 'center'
                      },
                      scheduleUnit === 'minutes'
                        ? {
                            backgroundColor: '#6366F1',
                            borderColor: '#4F46E5',
                            shadowColor: '#6366F1',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 4
                          }
                        : { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
                    ]}
                    onPress={() => setScheduleUnit('minutes')}
                  >
                    <Ionicons
                      name="timer-outline"
                      size={18}
                      color={scheduleUnit === 'minutes' ? '#fff' : '#64748B'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: scheduleUnit === 'minutes' ? '#fff' : '#64748B',
                        fontWeight: '700',
                        fontSize: 14
                      }}
                    >
                      Minutes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        borderWidth: 2,
                        flexDirection: 'row',
                        justifyContent: 'center'
                      },
                      scheduleUnit === 'hours'
                        ? {
                            backgroundColor: '#EC4899',
                            borderColor: '#DB2777',
                            shadowColor: '#EC4899',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 4
                          }
                        : { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
                    ]}
                    onPress={() => setScheduleUnit('hours')}
                  >
                    <Ionicons
                      name="hourglass-outline"
                      size={18}
                      color={scheduleUnit === 'hours' ? '#fff' : '#64748B'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: scheduleUnit === 'hours' ? '#fff' : '#64748B',
                        fontWeight: '700',
                        fontSize: 14
                      }}
                    >
                      Hours
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        borderWidth: 2,
                        flexDirection: 'row',
                        justifyContent: 'center'
                      },
                      scheduleUnit === 'days'
                        ? {
                            backgroundColor: '#8B5CF6',
                            borderColor: '#7C3AED',
                            shadowColor: '#8B5CF6',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 4
                          }
                        : { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
                    ]}
                    onPress={() => setScheduleUnit('days')}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={scheduleUnit === 'days' ? '#fff' : '#64748B'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: scheduleUnit === 'days' ? '#fff' : '#64748B',
                        fontWeight: '700',
                        fontSize: 14
                      }}
                    >
                      Days
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                disabled={isAddingSchedule}
                style={{
                  backgroundColor: isAddingSchedule ? '#059669' : '#10B981',
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isAddingSchedule ? 0.15 : 0.3,
                  shadowRadius: 8,
                  elevation: isAddingSchedule ? 2 : 5,
                  marginBottom: 12,
                  opacity: isAddingSchedule ? 0.8 : 1
                }}
                onPress={addCustomSchedule}
              >
                {isAddingSchedule ? (
                  <>
                    <Animated.View style={{ transform: [{ rotate: scheduleAddSpin }] }}>
                      <Ionicons name="sync" size={22} color="#fff" style={{ marginRight: 8 }} />
                    </Animated.View>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>Creating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>Save Schedule</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Box */}
              <View style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: '#BFDBFE'
              }}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" style={{ marginRight: 10, marginTop: 1 }} />
                <Text style={{ fontSize: 12, color: '#1E40AF', flex: 1, lineHeight: 18 }}>
                  Your custom schedule will be saved and available in all devices.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Post Preview Modal */}
      <Modal visible={showPreview} transparent animationType="fade">
        <View style={styles.fullContentOverlay}>
          <View style={[styles.fullContentContainer, { maxHeight: '90%' }]}>
            <View style={styles.fullContentHeader}>
              <Text style={styles.fullContentTitle}>Post Preview</Text>
              <TouchableOpacity 
                style={styles.fullContentClose} 
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.fullContentCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.fullContentScroll}>
              {/* Facebook Preview */}
              {platforms.includes('Facebook') && (
                <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginLeft: 8 }}>Facebook</Text>
                  </View>
                  
                  <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    {/* Facebook Post Header */}
                    <View style={{ backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        {previewAccountImages.facebook ? (
                          <Image
                            source={{ uri: previewAccountImages.facebook }}
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' }}
                          />
                        ) : (
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1877F2' }} />
                        )}
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{previewAccountNames.facebook}</Text>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>just now</Text>
                        </View>
                      </View>
                    </View>

                    {/* Content */}
                    <View style={{ backgroundColor: '#fff', padding: 12 }}>
                      <Text style={{ fontSize: 15, color: '#111827', lineHeight: 20 }}>
                        {content}
                      </Text>
                      {hashtags.length > 0 && (
                        <Text style={{ fontSize: 14, color: '#4338CA', marginTop: 8, lineHeight: 20 }}>
                          {hashtags.join(' ')}
                        </Text>
                      )}
                    </View>

                    {/* Images */}
                    {images.length > 0 && (
                      <Image
                        source={{ uri: images[0] }}
                        style={{ width: '100%', height: 200, backgroundColor: '#F3F4F6' }}
                        resizeMode="cover"
                      />
                    )}

                    {/* Actions */}
                    <View style={{ backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-around' }}>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>👍 Like</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>💬 Comment</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>↗️ Share</Text>
                    </View>

                    {/* Facebook Content Warnings */}
                    {(content.length > 63206 || content.length < 10) && (
                      <View style={{ backgroundColor: content.length > 63206 ? '#FEE2E2' : '#FEF3C7', padding: 8, margin: 12, borderRadius: 8 }}>
                        {content.length > 63206 ? (
                          <>
                            <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600' }}>
                              ⚠️ Facebook limit: 63,206 characters
                            </Text>
                            <Text style={{ fontSize: 12, color: '#991B1B', marginTop: 2 }}>
                              Current: {content.length} characters
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={{ fontSize: 12, color: '#D97706', fontWeight: '600' }}>
                              💡 Short content may get less engagement
                            </Text>
                            <Text style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                              Consider adding more details ({content.length} characters)
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Instagram Preview */}
              {platforms.includes('Instagram') && (
                <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginLeft: 8 }}>Instagram</Text>
                  </View>

                  <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    {/* Instagram Header */}
                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {previewAccountImages.instagram ? (
                          <Image
                            source={{ uri: previewAccountImages.instagram }}
                            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB' }}
                          />
                        ) : (
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E4405F' }} />
                        )}
                        <View style={{ marginLeft: 10 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{previewAccountNames.instagram}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 18 }}>•••</Text>
                    </View>

                    {/* Image Area */}
                    {images.length > 0 ? (
                      <Image
                        source={{ uri: images[0] }}
                        style={{ width: '100%', height: 200, backgroundColor: '#F3F4F6' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ backgroundColor: '#F3F4F6', height: 200, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="image-outline" size={48} color="#D1D5DB" />
                      </View>
                    )}

                    {/* Actions */}
                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', gap: 12 }}>
                      <Text style={{ fontSize: 16 }}>❤️</Text>
                      <Text style={{ fontSize: 16 }}>💬</Text>
                      <Text style={{ fontSize: 16 }}>↗️</Text>
                    </View>

                    {/* Caption */}
                    <View style={{ padding: 12 }}>
                        <Text style={{ fontSize: 13, color: '#111827', lineHeight: 18 }} numberOfLines={3}>
                          <Text style={{ fontWeight: '700' }}>{previewAccountNames.instagram} </Text>
                        {content}
                      </Text>
                      {hashtags.length > 0 && (
                        <Text style={{ fontSize: 13, color: '#4338CA', marginTop: 4, lineHeight: 18 }}>
                          {hashtags.join(' ')}
                        </Text>
                      )}
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>View all comments</Text>
                    </View>

                    {/* Instagram Photo Warning */}
                    {images.length === 0 && (
                      <View style={{ backgroundColor: '#FEE2E2', padding: 8, margin: 12, marginTop: 0, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600' }}>
                          ⚠️ Instagram requires a photo or video
                        </Text>
                        <Text style={{ fontSize: 12, color: '#991B1B', marginTop: 2 }}>
                          Please add at least one image to post on Instagram
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Twitter/X Preview */}
              {platforms.includes('Twitter') && (
                <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="logo-twitter" size={24} color="#000" />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginLeft: 8 }}>Twitter/X</Text>
                  </View>

                  <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    {/* Twitter Header */}
                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#1DA1F2' }} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{previewAccountNames.twitterHandle}</Text>
                          <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>• 1m</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>{previewAccountNames.twitterName}</Text>
                      </View>
                      <Text style={{ fontSize: 14 }}>•••</Text>
                    </View>

                    {/* Tweet Content */}
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontSize: 15, lineHeight: 20, color: '#111827' }}>
                        {content.substring(0, 280)}
                        {content.length > 280 && '...'}
                      </Text>
                      {hashtags.length > 0 && (
                        <Text style={{ fontSize: 14, color: '#4338CA', marginTop: 8, lineHeight: 18 }}>
                          {hashtags.join(' ')}
                        </Text>
                      )}

                      {/* Character Warning */}
                      {content.length > 280 && (
                        <View style={{ backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8, marginTop: 8 }}>
                          <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600' }}>
                            ⚠️ Twitter limit: 280 characters
                          </Text>
                          <Text style={{ fontSize: 12, color: '#991B1B', marginTop: 2 }}>
                            Current: {content.length} characters
                          </Text>
                        </View>
                      )}

                      {/* Images */}
                      {images.length > 0 && (
                        <Image
                          source={{ uri: images[0] }}
                          style={{ width: '100%', height: 200, backgroundColor: '#F3F4F6', borderRadius: 12, marginTop: 12 }}
                          resizeMode="cover"
                        />
                      )}
                    </View>

                    {/* Tweet Actions */}
                    <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-around' }}>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>💬</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>🔄</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>❤️</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>↗️</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Post Stats Summary */}
              <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#10B981' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#065F46', marginBottom: 8 }}>📊 Post Summary</Text>
                  <Text style={{ fontSize: 13, color: '#047857', marginBottom: 4 }}>
                    Platforms: {platforms.join(', ')}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#047857', marginBottom: 4 }}>
                    Content: {content.length} characters {hashtags.length > 0 && `+ ${hashtags.length} hashtag${hashtags.length !== 1 ? 's' : ''}`}
                  </Text>
                  {images.length > 0 && (
                    <Text style={{ fontSize: 13, color: '#047857', marginBottom: 4 }}>
                      Media: {images.length} image{images.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                  {urls.length > 0 && (
                    <Text style={{ fontSize: 13, color: '#047857' }}>
                      Links: {urls.length} URL{urls.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.fullContentFooter}>
              <TouchableOpacity 
                style={styles.fullContentButton}
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.fullContentButtonText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isCreatingPost && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="sync" size={48} color="#10B981" />
              </Animated.View>
              <Text style={styles.loadingTitle}>Saving Post...</Text>
              <Text style={styles.loadingText}>{creatingProgress}</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
    {/* Media Browser Modal */}
<Modal visible={showMediaBrowser} animationType="slide">
  <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>

    {/* Header */}
    <View style={{
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      backgroundColor: '#111827',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
        Media Browser
      </Text>
      <TouchableOpacity onPress={() => setShowMediaBrowser(false)}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={{ padding: 20 }}>

      {/* Unsplash Search */}
      <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
        Unsplash Recommendations
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB'
          }}
          placeholder="Search Unsplash..."
          value={imageSearchQuery}
          onChangeText={setImageSearchQuery}
        />
        <TouchableOpacity
          style={{
            marginLeft: 8,
            backgroundColor: '#10B981',
            paddingHorizontal: 16,
            justifyContent: 'center',
            borderRadius: 10
          }}
          onPress={searchOnlineImages}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Unsplash Results */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {imageSearchResults.map(item => (
          <TouchableOpacity
            key={item.id}
            style={{
              width: '48%',
              aspectRatio: 1,
              borderRadius: 12,
              overflow: 'hidden'
            }}
            onPress={() => {
              addOnlineImage(item.fullUrl);
            }}
          >
            <Image
              source={{ uri: item.previewUrl }}
              style={{ width: '100%', height: '100%' }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Device Photos */}
<Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 15 }}>
  📱 Device Photos
</Text>

<TouchableOpacity
  style={{
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  }}
  onPress={pickImage}
>
  <Text style={{ color: '#fff', fontWeight: '700' }}>
    Select from Device
  </Text>
</TouchableOpacity>

{/* Built-in Stock Photos */}
<Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
  🖼 Stock Photos
</Text>

<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
  {STOCK_PHOTOS.map(item => (
    <TouchableOpacity
      key={item.id}
      style={{
        width: '48%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden'
      }}
      onPress={() => {
        // Convert local asset to URI for your images array
        const uri = Image.resolveAssetSource(item.source).uri;
        if (!images.includes(uri)) {
          setImages([...images, uri]);
        }
        setShowMediaBrowser(false);
      }}
    >
      <Image
        source={item.source}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  ))}
</View>
    </ScrollView>
  </View>
</Modal>
    </Modal>
    </>
  );
}

