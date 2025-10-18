import { create } from 'zustand';
import { supabase, apiClient } from '../lib/supabase';
import type { User, AuthState } from '../types';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Link user to our backend
        apiClient.setToken(data.session?.access_token || '');
        await apiClient.linkUser();
        
        // Get user profile
        const response = await apiClient.getUserProfile();
        const { user } = response;
        
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Link user to our backend
        apiClient.setToken(data.session?.access_token || '');
        await apiClient.linkUser();
        
        // Get user profile
        const response = await apiClient.getUserProfile();
        const { user } = response;
        
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      apiClient.clearToken();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  linkUser: async () => {
    try {
      const response = await apiClient.linkUser();
      const { user } = response;
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Link user error:', error);
      throw error;
    }
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    apiClient.setToken(session.access_token);
    try {
      await useAuthStore.getState().linkUser();
    } catch (error) {
      console.error('Failed to link user on auth state change:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    apiClient.clearToken();
    useAuthStore.setState({ 
      user: null, 
      isAuthenticated: false 
    });
  }
});
