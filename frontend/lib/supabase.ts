import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://koudzeojjkteioowweel.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWR6ZW9qamt0ZWlvb3d3ZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTEyODUsImV4cCI6MjA3NjI4NzI4NX0.yHHgFWIYy2RNDMd5VHSuOiHZYgrG3fmTXQr9crYRS-Q';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // For development, you might want to disable email confirmation
    // This should be configured in your Supabase dashboard
  },
});

// API Configuration
export const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

// API Client
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Create an AbortController for timeout (React Native compatible)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Avoid noisy logs if we simply timed out
      if ((error as any)?.name === 'AbortError') {
        return false;
      }
      console.warn('Health check issue:', error);
      return false;
    }
  }

  // Auth endpoints
  async linkUser(): Promise<{ user: any }> {
    // Check if backend is healthy first
    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      throw new Error('Backend service is not available. Please try again later.');
    }
    
    return this.request('/auth/link', { method: 'POST' });
  }

  // Link user with fallback - doesn't throw error if backend is unavailable
  async linkUserWithFallback(): Promise<{ user: any } | null> {
    try {
      return await this.linkUser();
    } catch (error) {
      console.warn('Failed to link user to backend, will retry later:', error);
      return null;
    }
  }

  async getUserProfile(): Promise<{ user: any }> {
    return this.request('/auth/profile');
  }

  async updateUserProfile(data: { display_name?: string; avatar_url?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Group endpoints
  async createGroup(data: { name: string; description?: string; max_members?: number }): Promise<{ group: any }> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroups(): Promise<{ groups: any[] }> {
    return this.request('/groups');
  }

  async getGroup(id: string): Promise<{ group: any }> {
    return this.request(`/groups/${id}`);
  }

  async joinGroup(inviteCode: string): Promise<{ group: any }> {
    return this.request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  }

  async leaveGroup(groupId: string) {
    return this.request(`/groups/${groupId}/leave`, { method: 'DELETE' });
  }

  // Post endpoints
  async createPost(data: {
    group_id: string;
    content?: string;
    image_url?: string;
    post_type?: 'checkin' | 'motivation' | 'milestone';
  }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroupPosts(groupId: string, limit = 20, offset = 0) {
    return this.request(`/posts/group/${groupId}?limit=${limit}&offset=${offset}`);
  }

  async getUserPosts(limit = 20, offset = 0) {
    return this.request(`/posts/user?limit=${limit}&offset=${offset}`);
  }

  async deletePost(postId: string) {
    return this.request(`/posts/${postId}`, { method: 'DELETE' });
  }

  // Motivation endpoints
  async getMotivationalMessages(groupId: string, limit = 10) {
    return this.request(`/motivate/group/${groupId}?limit=${limit}`);
  }

  async generateMotivationalMessage(groupId: string, messageType = 'custom') {
    return this.request('/motivate/generate', {
      method: 'POST',
      body: JSON.stringify({ groupId, messageType }),
    });
  }

  async getGroupStreaks(groupId: string): Promise<{ streaks: any[] }> {
    return this.request(`/motivate/streaks/${groupId}`);
  }

  // Notification endpoints
  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web') {
    return this.request('/notify/register-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  async unregisterPushToken(token: string) {
    return this.request('/notify/unregister-token', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  }

  async getNotificationSettings() {
    return this.request('/notify/settings');
  }

  // Upload endpoints
  async getUploadUrl(fileName: string, contentType: string) {
    return this.request('/upload/url', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    });
  }

  async completeUpload(uploadId: string, fileName: string, parts: any[]) {
    return this.request('/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ uploadId, fileName, parts }),
    });
  }

  async getUserImages(limit = 20) {
    return this.request(`/upload/user?limit=${limit}`);
  }

  async deleteImage(fileName: string) {
    return this.request(`/upload/${fileName}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);
