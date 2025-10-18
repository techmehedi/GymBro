// Shared TypeScript types for the GymBro app

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
  display_name?: string;
  avatar_url?: string;
  group_name?: string;
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
  display_name?: string;
  avatar_url?: string;
}

export interface MotivationalMessage {
  id: string;
  group_id: string;
  message: string;
  message_type: 'daily' | 'weekly' | 'milestone' | 'custom';
  generated_at: string;
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

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

// Navigation Types
export type RootStackParamList = {
  '(tabs)': undefined;
  'auth': undefined;
  'group/[id]': { id: string };
  'profile': undefined;
};

export type AuthStackParamList = {
  'sign-in': undefined;
  'sign-up': undefined;
};

export type TabParamList = {
  'index': undefined;
  'groups': undefined;
  'checkin': undefined;
  'streaks': undefined;
  'profile': undefined;
};

// Store Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  linkUser: () => Promise<void>;
  updateUserProfile: (data: { display_name?: string; avatar_url?: string }) => Promise<void>;
}

export interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  createGroup: (data: CreateGroupRequest) => Promise<{ group: Group }>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  fetchGroups: () => Promise<void>;
  setCurrentGroup: (group: Group | null) => void;
}

export interface StreakState {
  streaks: Streak[];
  isLoading: boolean;
  fetchStreaks: (groupId: string) => Promise<void>;
  updateStreak: (groupId: string) => Promise<void>;
}

// Component Props Types
export interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export interface StreakCardProps {
  streak: Streak;
}

export interface MotivationalMessageProps {
  message: MotivationalMessage;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
