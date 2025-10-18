// Cloudflare Worker Environment Types
export interface Env {
  DB: D1Database;
  PUSH_TOKENS: KVNamespace;
  IMAGES: R2Bucket;
  ENVIRONMENT: string;
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  [key: string]: any; // Index signature for Cloudflare Workers compatibility
}

// Database Types
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  max_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  is_admin: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  group_id: string;
  content?: string;
  image_url?: string;
  post_type: 'checkin' | 'motivation' | 'milestone';
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  group_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date?: string;
  streak_start_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MotivationalMessage {
  id: string;
  group_id: string;
  message: string;
  message_type: 'daily' | 'weekly' | 'milestone';
  generated_at: string;
}

// API Request/Response Types
export interface CreateGroupRequest {
  name: string;
  description?: string;
  max_members?: number;
}

export interface JoinGroupRequest {
  invite_code: string;
}

export interface CreatePostRequest {
  group_id: string;
  content?: string;
  image_url?: string;
  post_type?: 'checkin' | 'motivation' | 'milestone';
}

export interface UpdateStreakRequest {
  group_id: string;
  checkin_date: string;
}

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
}

export interface AuthContext {
  user: AuthUser;
  token: string;
}
