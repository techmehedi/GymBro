import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, Button } from 'react-native-paper';

import { useFitnessStore } from '@/store/fitnessStore';
import { api } from '@/utils/api';

export default function StreaksScreen() {
  const { isSignedIn } = useAuth();
  const { groups, selectedGroup, setSelectedGroup } = useFitnessStore();

  const { data: streaks, isLoading } = useQuery({
    queryKey: ['streaks', selectedGroup?.id],
    queryFn: () => api.getGroupStreaks(selectedGroup?.id!),
    enabled: !!selectedGroup && isSignedIn,
  });

  const { data: myStreak } = useQuery({
    queryKey: ['my-streak', selectedGroup?.id],
    queryFn: () => api.getMyStreak(selectedGroup?.id!),
    enabled: !!selectedGroup && isSignedIn,
  });

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-center mb-4">
          Please sign in to view streaks
        </Text>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-center mb-4">
          No groups available
        </Text>
        <Text className="text-center text-gray-600 mb-6">
          Join or create a group to track streaks
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Streak Leaderboard</Text>

        {/* Group Selection */}
        <Card className="mb-6">
          <Card.Content className="py-4">
            <Text className="font-semibold mb-3">Select Group:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-3">
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    mode={selectedGroup?.id === group.id ? 'contained' : 'outlined'}
                    onPress={() => setSelectedGroup(group)}
                    className="mr-2"
                  >
                    {group.name}
                  </Button>
                ))}
              </View>
            </ScrollView>
          </Card.Content>
        </Card>

        {/* My Streak */}
        {myStreak && (
          <Card className="mb-6 bg-primary-50">
            <Card.Content className="py-6">
              <Text className="text-lg font-bold text-center mb-2">
                🔥 Your Current Streak
              </Text>
              <Text className="text-3xl font-bold text-center text-primary-600 mb-2">
                {myStreak.currentStreak} days
              </Text>
              <Text className="text-center text-gray-600">
                Longest streak: {myStreak.longestStreak} days
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Leaderboard */}
        {streaks && streaks.length > 0 ? (
          <View className="space-y-3">
            <Text className="text-lg font-semibold mb-4">Group Leaderboard</Text>
            {streaks.map((streak, index) => (
              <Card key={streak.id}>
                <Card.Content className="py-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3">
                        <Text className="font-bold text-primary-600">
                          {index + 1}
                        </Text>
                      </View>
                      <View>
                        <Text className="font-semibold">{streak.userName}</Text>
                        <Text className="text-sm text-gray-600">
                          Longest: {streak.longestStreak} days
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-primary-600">
                        {streak.currentStreak}
                      </Text>
                      <Text className="text-xs text-gray-500">days</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <Card.Content className="py-8">
              <Text className="text-center text-gray-600">
                No streak data available yet
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Motivational Tips */}
        <Card className="mt-6">
          <Card.Content className="py-4">
            <Text className="font-semibold mb-3">💡 Streak Tips</Text>
            <Text className="text-gray-700 mb-2">
              • Consistency is key - even 10 minutes counts!
            </Text>
            <Text className="text-gray-700 mb-2">
              • Share your progress to stay motivated
            </Text>
            <Text className="text-gray-700">
              • Don't break the chain - every day matters
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}
