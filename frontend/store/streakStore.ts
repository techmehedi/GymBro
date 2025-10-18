import { create } from 'zustand';
import { apiClient } from '../lib/supabase';
import type { Streak, StreakState } from '../types';

export const useStreakStore = create<StreakState>((set, get) => ({
  streaks: [],
  isLoading: false,

  fetchStreaks: async (groupId: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.getGroupStreaks(groupId);
      const { streaks } = response;
      set({ streaks, isLoading: false });
    } catch (error) {
      console.error('Fetch streaks error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateStreak: async (groupId: string) => {
    try {
      // This would typically be called when a user posts a check-in
      // The streak is automatically updated on the backend when a post is created
      // We just need to refresh the streaks data
      await get().fetchStreaks(groupId);
    } catch (error) {
      console.error('Update streak error:', error);
      throw error;
    }
  },
}));
