import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, Button } from 'react-native-paper';

import { useFitnessStore } from '@/store/fitnessStore';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const { groups, fetchGroups } = useFitnessStore();

  const { data: motivationalMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['motivational-messages'],
    queryFn: () => api.getMotivationalMessages(),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user, fetchGroups]);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0]}!</Text>
        <Text className="text-gray-600 mb-6">Ready to crush your fitness goals today?</Text>

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-6">
          <Card className="flex-1 mr-2">
            <Card.Content className="items-center py-4">
              <Text className="text-2xl font-bold text-primary-600">{groups.length}</Text>
              <Text className="text-sm text-gray-600">Groups</Text>
            </Card.Content>
          </Card>
          <Card className="flex-1 ml-2">
            <Card.Content className="items-center py-4">
              <Text className="text-2xl font-bold text-primary-600">7</Text>
              <Text className="text-sm text-gray-600">Day Streak</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Motivational Message */}
        {motivationalMessages && motivationalMessages.length > 0 && (
          <Card className="mb-6">
            <Card.Content className="py-4">
              <Text className="text-lg font-semibold mb-2">💪 Daily Motivation</Text>
              <Text className="text-gray-700">
                {motivationalMessages[0].message}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-4">Quick Actions</Text>
          <View className="space-y-3">
            <Link href="/checkin" asChild>
              <Button mode="contained" className="w-full">
                📸 Check-in Today
              </Button>
            </Link>
            <Link href="/groups" asChild>
              <Button mode="outlined" className="w-full">
                👥 Manage Groups
              </Button>
            </Link>
          </View>
        </View>

        {/* Recent Activity */}
        <View>
          <Text className="text-lg font-semibold mb-4">Recent Activity</Text>
          <Card>
            <Card.Content className="py-4">
              <Text className="text-gray-600 text-center">
                No recent activity yet. Start by joining a group or checking in!
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
