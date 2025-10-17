import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View, Image } from 'react-native';
import { Card, Button, FAB } from 'react-native-paper';

import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function GroupDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: groupData, isLoading } = useQuery({
    queryKey: ['group-details', id],
    queryFn: () => api.getGroupDetails(id!),
    enabled: !!id && !!user,
  });

  const { data: posts } = useQuery({
    queryKey: ['group-posts', id],
    queryFn: () => api.getGroupPosts(id!),
    enabled: !!id && !!user,
  });

  const { data: motivationalMessages } = useQuery({
    queryKey: ['motivational-messages', id],
    queryFn: () => api.getMotivationalMessages(id!),
    enabled: !!id && !!user,
  });

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-center mb-4">
          Please sign in to view group details
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!groupData) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-center mb-4">
          Group not found
        </Text>
      </View>
    );
  }

  const { group, members } = groupData;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Group Header */}
          <Card className="mb-6">
            <Card.Content className="py-6">
              <Text className="text-2xl font-bold mb-2">{group.name}</Text>
              {group.description && (
                <Text className="text-gray-600 mb-4">{group.description}</Text>
              )}
              <Text className="text-sm text-gray-500">
                Invite Code: {group.inviteCode}
              </Text>
            </Card.Content>
          </Card>

          {/* Members */}
          <Card className="mb-6">
            <Card.Content className="py-4">
              <Text className="text-lg font-semibold mb-4">Members ({members.length})</Text>
              <View className="space-y-3">
                {members.map((member: any) => (
                  <View key={member.id} className="flex-row items-center">
                    <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                      <Text className="font-semibold text-primary-600">
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium">{member.name}</Text>
                      <Text className="text-sm text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Motivational Messages */}
          {motivationalMessages && motivationalMessages.messages.length > 0 && (
            <Card className="mb-6">
              <Card.Content className="py-4">
                <Text className="text-lg font-semibold mb-4">💪 Motivational Messages</Text>
                <View className="space-y-3">
                  {motivationalMessages.messages.slice(0, 3).map((message: any) => (
                    <View key={message.id} className="bg-primary-50 p-3 rounded-lg">
                      <Text className="text-gray-700">{message.message}</Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Recent Posts */}
          <Card className="mb-6">
            <Card.Content className="py-4">
              <Text className="text-lg font-semibold mb-4">Recent Activity</Text>
              {posts && posts.posts.length > 0 ? (
                <View className="space-y-4">
                  {posts.posts.slice(0, 5).map((post: any) => (
                    <View key={post.id} className="border-b border-gray-200 pb-3">
                      <View className="flex-row items-center mb-2">
                        <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-2">
                          <Text className="font-semibold text-primary-600 text-xs">
                            {post.userName?.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text className="font-medium">{post.userName}</Text>
                        <Text className="text-xs text-gray-500 ml-auto">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {post.content && (
                        <Text className="text-gray-700 mb-2">{post.content}</Text>
                      )}
                      {post.imageUrl && (
                        <Image
                          source={{ uri: post.imageUrl }}
                          className="w-full h-32 rounded-lg"
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-center text-gray-500 py-4">
                  No posts yet. Be the first to check in!
                </Text>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="camera"
        className="absolute bottom-6 right-6"
        onPress={() => {
          // Navigate to check-in screen with group pre-selected
        }}
      />
    </View>
  );
}
