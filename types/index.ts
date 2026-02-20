export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface OrganizationMember {
  id: number;
  user_id: string;
  invited_by: string;
  role: string;
  joined_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
