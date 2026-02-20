/* =========================
   POST STATUS WORKFLOW
========================= */

export type PostStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'published'
  | 'failed';

/* =========================
   POST INTERFACE
========================= */

export interface Post {
  id: string;

  title: string;
  content: string;

  createdAt: any;
  userId: string;

  /* 🔥 REQUIRED STATUS */
  status: PostStatus;

  /* ===== Approval System ===== */
  approvedBy?: string | null;
  approvedAt?: any | null;
  rejectionReason?: string | null;

  /* ===== Publishing ===== */
  scheduledDate?: any;

  /* ===== Content Extras ===== */
  platforms?: string[];
  brandVoice?: string;
  hashtags?: string[];
  images?: string[];
  urls?: string[];

  /* ===== External Platform IDs ===== */
  platformPostIds?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}
