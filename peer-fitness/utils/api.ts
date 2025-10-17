import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

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

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
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

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async linkPushToken(pushToken: string): Promise<void> {
    await this.request('/api/auth/link', {
      method: 'POST',
      body: JSON.stringify({ pushToken }),
    });
  }

  async getProfile(): Promise<any> {
    return this.request('/api/auth/profile');
  }

  // Group endpoints
  async getGroups(): Promise<{ groups: Group[] }> {
    return this.request('/api/groups');
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    return this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async joinGroup(inviteCode: string): Promise<void> {
    await this.request('/api/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  }

  async getGroupDetails(groupId: string): Promise<{ group: Group; members: any[] }> {
    return this.request(`/api/groups/${groupId}`);
  }

  // Post endpoints
  async createPost(groupId: string, content: string, imageUrl?: string): Promise<Post> {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ groupId, content, imageUrl }),
    });
  }

  async getGroupPosts(groupId: string): Promise<{ posts: Post[] }> {
    return this.request(`/api/posts/group/${groupId}`);
  }

  async getTodayPost(groupId: string): Promise<Post | null> {
    try {
      return await this.request(`/api/posts/today/${groupId}`);
    } catch (error) {
      return null;
    }
  }

  // Streak endpoints
  async getMyStreak(groupId: string): Promise<Streak> {
    return this.request(`/api/posts/streak/${groupId}`);
  }

  async getGroupStreaks(groupId: string): Promise<{ streaks: Streak[] }> {
    return this.request(`/api/posts/streaks/${groupId}`);
  }

  // Motivational message endpoints
  async generateMotivationalMessage(groupId: string): Promise<MotivationalMessage> {
    return this.request('/api/motivate/generate', {
      method: 'POST',
      body: JSON.stringify({ groupId }),
    });
  }

  async getMotivationalMessages(groupId: string): Promise<{ messages: MotivationalMessage[] }> {
    return this.request(`/api/motivate/${groupId}`);
  }

  // Voice endpoints
  async generateVoiceClip(text: string, messageId?: string): Promise<{ audioUrl: string }> {
    return this.request('/api/voice/generate', {
      method: 'POST',
      body: JSON.stringify({ text, messageId }),
    });
  }

  // Upload endpoints
  async uploadImage(imageUri: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);

    const response = await fetch(`${this.baseUrl}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.imageUrl;
  }

  async getPresignedUploadUrl(fileName: string, contentType?: string): Promise<{
    uploadUrl: string;
    imageKey: string;
  }> {
    return this.request('/api/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    });
  }

  // Notification endpoints
  async sendNotification(groupId: string, title: string, body: string): Promise<void> {
    await this.request('/api/notify/send', {
      method: 'POST',
      body: JSON.stringify({ groupId, title, body }),
    });
  }

  async scheduleDailyReminder(groupId: string, time?: string): Promise<void> {
    await this.request('/api/notify/schedule-daily', {
      method: 'POST',
      body: JSON.stringify({ groupId, time }),
    });
  }
}

export const api = new ApiClient(API_URL);
