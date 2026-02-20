/**
 * Occasion-based Templates Initialization
 * Provides pre-made templates for different occasions and categories
 */

import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface OccasionTemplate {
  id: string;
  name: string;
  category: 'Holidays' | 'Birthdays' | 'Anniversaries' | 'Milestones' | 'Promotions' | 'Seasonal';
  occasion: string;
  content: string;
  platform: string[];
  isOccasionTemplate: boolean;
  createdAt: Date;
  order: number;
}

export const DEFAULT_OCCASION_TEMPLATES: Omit<OccasionTemplate, 'createdAt'>[] = [
  // Holidays
  {
    id: 'holiday_newyear',
    name: 'New Year Greeting',
    category: 'Holidays',
    occasion: 'New Year',
    content: '🎉 Happy New Year! Here\'s to new beginnings and exciting opportunities ahead. What are your goals for this year? #NewYear #Motivation',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 1,
  },
  {
    id: 'holiday_christmas',
    name: 'Christmas Wishes',
    category: 'Holidays',
    occasion: 'Christmas',
    content: '🎄 Wishing you a Merry Christmas filled with joy, laughter, and togetherness! Thank you for your continued support! #Christmas #Holidays',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 2,
  },
  {
    id: 'holiday_thanksgiving',
    name: 'Thanksgiving Message',
    category: 'Holidays',
    occasion: 'Thanksgiving',
    content: '🦃 Happy Thanksgiving! We\'re grateful for our amazing community and wonderful supporters like you. Have a fantastic day! #Thanksgiving #Gratitude',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 3,
  },
  {
    id: 'holiday_halloween',
    name: 'Halloween Special',
    category: 'Holidays',
    occasion: 'Halloween',
    content: '👻 Happy Halloween! Trick or treat? Share your costume in the comments below! #Halloween #Spooky #Treat',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 4,
  },
  {
    id: 'holiday_valentines',
    name: 'Valentine\'s Day Post',
    category: 'Holidays',
    occasion: 'Valentine\'s Day',
    content: '❤️ Spreading love this Valentine\'s Day! We appreciate all of you who make our community special. #ValentinesDay #Love #Appreciation',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 5,
  },

  // Birthdays
  {
    id: 'birthday_company',
    name: 'Company Birthday',
    category: 'Birthdays',
    occasion: 'Company Birthday',
    content: '🎂 Today marks another milestone! Thanks to our incredible team and loyal community. Here\'s to growth and success! #CompanyBirthday #Milestone',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 6,
  },
  {
    id: 'birthday_employee',
    name: 'Team Member Birthday',
    category: 'Birthdays',
    occasion: 'Employee Birthday',
    content: '🎉 Happy Birthday to an amazing team member! Your contributions are invaluable. Have a wonderful day! #Birthday #TeamCelebration',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 7,
  },

  // Anniversaries
  {
    id: 'anniversary_launch',
    name: 'Product Launch Anniversary',
    category: 'Anniversaries',
    occasion: 'Product Anniversary',
    content: '🚀 [X] years ago, we launched [Product]! Thank you for being part of our journey. Here\'s to many more innovations! #Anniversary #Milestone',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 8,
  },
  {
    id: 'anniversary_founding',
    name: 'Company Founding Anniversary',
    category: 'Anniversaries',
    occasion: 'Founding Anniversary',
    content: '🎊 Happy [X]th Anniversary! We\'re grateful for our community\'s support throughout this incredible journey. #Anniversary #Grateful',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 9,
  },

  // Milestones
  {
    id: 'milestone_followers',
    name: 'Follower Milestone',
    category: 'Milestones',
    occasion: 'Follower Milestone',
    content: '🌟 We\'ve hit [Number] followers! This wouldn\'t be possible without your support. Thank you for being awesome! #Milestone #Community #Grateful',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 10,
  },
  {
    id: 'milestone_downloads',
    name: 'Download Milestone',
    category: 'Milestones',
    occasion: 'Download Milestone',
    content: '📱 [Number] downloads! We\'re thrilled with the response. Keep enjoying and sharing our app! #Milestone #Success',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 11,
  },

  // Promotions
  {
    id: 'promo_sale',
    name: 'Sale Announcement',
    category: 'Promotions',
    occasion: 'Flash Sale',
    content: '🔥 FLASH SALE ALERT! Get [X]% off on [Product] for a limited time only. Don\'t miss out! #Sale #Promotion #LimitedTime',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 12,
  },
  {
    id: 'promo_exclusive',
    name: 'Exclusive Offer',
    category: 'Promotions',
    occasion: 'Member Exclusive',
    content: '✨ Exclusive offer for our loyal community members! [Details]. Thank you for your continued support! #Exclusive #VIP',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 13,
  },

  // Seasonal
  {
    id: 'seasonal_summer',
    name: 'Summer Vibes',
    category: 'Seasonal',
    occasion: 'Summer Season',
    content: '☀️ Summer is here! Who else is excited? Share your summer plans in the comments! #Summer #SummerVibes #Season',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 14,
  },
  {
    id: 'seasonal_spring',
    name: 'Spring Renewal',
    category: 'Seasonal',
    occasion: 'Spring Season',
    content: '🌸 Spring is in the air! Time for fresh starts and new beginnings. What are you excited about? #Spring #NewBeginnings #Season',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 15,
  },
  {
    id: 'seasonal_fall',
    name: 'Fall Favorites',
    category: 'Seasonal',
    occasion: 'Fall Season',
    content: '🍂 Autumn is here! Time for cozy vibes and warm moments. What\'s your favorite fall activity? #Fall #Autumn #Season',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 16,
  },
  {
    id: 'seasonal_winter',
    name: 'Winter Wonderland',
    category: 'Seasonal',
    occasion: 'Winter Season',
    content: '❄️ Winter is here! Bundle up and stay cozy. What\'s your favorite winter activity? #Winter #Season #Cozy',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isOccasionTemplate: true,
    order: 17,
  },
];

/**
 * Initialize occasion templates in Firestore
 * This creates a new collection called 'occasionTemplates' with all predefined templates
 */
export async function initializeOccasionTemplates(): Promise<void> {
  try {
    const occasionTemplatesRef = collection(db, 'occasionTemplates');

    // Check if templates already exist
    const existingDocs = await getDocs(occasionTemplatesRef);
    if (existingDocs.size > 0) {
      console.warn(
        '[Occasion Templates] Templates already exist in database. Skipping initialization.'
      );
      return;
    }

    // Add all default templates
    for (const template of DEFAULT_OCCASION_TEMPLATES) {
      const docRef = doc(occasionTemplatesRef, template.id);
      await setDoc(docRef, {
        ...template,
        createdAt: new Date(),
      });
      console.log(`[Occasion Templates] Created template: ${template.name}`);
    }

    console.log(
      `[Occasion Templates] Successfully initialized ${DEFAULT_OCCASION_TEMPLATES.length} templates`
    );
  } catch (error) {
    console.error('[Occasion Templates] Error initializing templates:', error);
    throw error;
  }
}

/**
 * Get all occasion templates by category
 */
export async function getOccasionTemplatesByCategory(
  category: string
): Promise<OccasionTemplate[]> {
  try {
    const occasionTemplatesRef = collection(db, 'occasionTemplates');
    const allDocs = await getDocs(occasionTemplatesRef);

    return allDocs.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as OccasionTemplate))
      .filter((template) => template.category === category)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('[Occasion Templates] Error fetching templates:', error);
    throw error;
  }
}

/**
 * Get all occasion templates
 */
export async function getAllOccasionTemplates(): Promise<OccasionTemplate[]> {
  try {
    const occasionTemplatesRef = collection(db, 'occasionTemplates');
    const allDocs = await getDocs(occasionTemplatesRef);

    return allDocs.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as OccasionTemplate))
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('[Occasion Templates] Error fetching all templates:', error);
    throw error;
  }
}
