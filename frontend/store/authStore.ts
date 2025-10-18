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
        // Set token and authenticate user first
        apiClient.setToken(data.session?.access_token || '');
        
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false 
        });

        // Try to link user to backend and get profile in background
        setTimeout(async () => {
          try {
            const linkResult = await apiClient.linkUserWithFallback();
            if (linkResult) {
              console.log('User linked to backend successfully');
              // Try to get user profile from backend
              try {
                const response = await apiClient.getUserProfile();
                const { user } = response;
                set({ user });
              } catch (profileError) {
                console.warn('Could not fetch user profile from backend:', profileError);
              }
            } else {
              console.log('Backend unavailable, using Supabase user data');
            }
          } catch (linkError) {
            console.error('Unexpected error during user linking:', linkError);
          }
        }, 1000);
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
      console.log('Attempting to sign up user:', { email, displayName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      console.log('Supabase signup response:', { data, error });

      if (error) throw error;

      if (data.user && data.session) {
        // User is immediately authenticated (email confirmation disabled)
        apiClient.setToken(data.session.access_token);
        
        // Set user as authenticated first
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        // Try to link user to backend in background with fallback
        setTimeout(async () => {
          try {
            const linkResult = await apiClient.linkUserWithFallback();
            if (linkResult) {
              console.log('User linked to backend successfully');
              // Update user with backend profile if available
              const { user } = linkResult;
              set({ user });
            } else {
              console.log('Backend unavailable, user will be linked when backend is available');
            }
          } catch (linkError) {
            console.error('Unexpected error during user linking:', linkError);
          }
        }, 1000); // Wait 1 second before trying to link
        
        return { 
          success: true, 
          message: 'Account created and signed in successfully!'
        };
      } else {
        throw new Error('Failed to create user account');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      set({ isLoading: false });
      
      // Handle specific Supabase errors
      if (error.message?.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please try signing in instead.');
      } else if (error.message?.includes('Database error')) {
        throw new Error('There was a problem creating your account. Please try again.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message?.includes('Password should be at least')) {
        throw new Error('Password must be at least 6 characters long.');
      }
      
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
    
    // Try to link user with retry logic and fallback
    const linkUserWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const linkResult = await apiClient.linkUserWithFallback();
          if (linkResult) {
            console.log('User linked to backend successfully');
            // Update user with backend profile if available
            const { user } = linkResult;
            useAuthStore.setState({ user });
            return;
          } else {
            console.log('Backend unavailable, will retry later');
            if (i === retries - 1) {
              // Schedule a retry in 5 seconds
              setTimeout(() => linkUserWithRetry(1), 5000);
            } else {
              // Wait 1 second before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          console.error(`Failed to link user (attempt ${i + 1}/${retries}):`, error);
          if (i === retries - 1) {
            console.error('All attempts to link user failed, will retry later');
            // Schedule a retry in 5 seconds
            setTimeout(() => linkUserWithRetry(1), 5000);
          } else {
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };
    
    // Start the linking process
    linkUserWithRetry();
  } else if (event === 'SIGNED_OUT') {
    apiClient.clearToken();
    useAuthStore.setState({ 
      user: null, 
      isAuthenticated: false 
    });
  }
});
