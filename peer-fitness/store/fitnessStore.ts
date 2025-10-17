import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Group {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  joinedAt?: string;
}

export interface Post {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  userName?: string;
  avatarUrl?: string;
}

export interface Streak {
  id: string;
  userId: string;
  groupId: string;
  currentStreak: number;
  longestStreak: number;
  lastPostDate?: string;
  userName?: string;
  avatarUrl?: string;
}

export interface MotivationalMessage {
  id: string;
  groupId: string;
  message: string;
  audioUrl?: string;
  createdAt: string;
}

interface FitnessState {
  groups: Group[];
  selectedGroup: Group | null;
  posts: Post[];
  streaks: Streak[];
  motivationalMessages: MotivationalMessage[];
  isLoading: boolean;
  error: string | null;
}

interface FitnessActions {
  setGroups: (groups: Group[]) => void;
  setSelectedGroup: (group: Group | null) => void;
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  setStreaks: (streaks: Streak[]) => void;
  setMotivationalMessages: (messages: MotivationalMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<void>;
  clearError: () => void;
}

export const useFitnessStore = create<FitnessState & FitnessActions>()(
  persist(
    (set, get) => ({
      // State
      groups: [],
      selectedGroup: null,
      posts: [],
      streaks: [],
      motivationalMessages: [],
      isLoading: false,
      error: null,

      // Actions
      setGroups: (groups) => set({ groups }),
      setSelectedGroup: (group) => set({ selectedGroup: group }),
      addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, ...updates } : group
          ),
        })),
      removeGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== groupId),
        })),
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      setStreaks: (streaks) => set({ streaks }),
      setMotivationalMessages: (messages) => set({ motivationalMessages: messages }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Async actions
      fetchGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          // This will be implemented with the API calls
          // For now, just set loading to false
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch groups', isLoading: false });
        }
      },

      createGroup: async (name: string, description?: string) => {
        set({ isLoading: true, error: null });
        try {
          // This will be implemented with the API calls
          // For now, just set loading to false
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to create group', isLoading: false });
          throw error;
        }
      },

      joinGroup: async (inviteCode: string) => {
        set({ isLoading: true, error: null });
        try {
          // This will be implemented with the API calls
          // For now, just set loading to false
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to join group', isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'fitness-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        groups: state.groups,
        selectedGroup: state.selectedGroup,
      }),
    }
  )
);
