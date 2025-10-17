import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { Card, Button, Switch, List } from 'react-native-paper';

import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(true);

  const linkPushTokenMutation = useMutation({
    mutationFn: api.linkPushToken,
    onSuccess: () => {
      Alert.alert('Success', 'Push notifications enabled');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to enable push notifications');
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled) {
      // Request notification permissions and link token
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const token = await Notifications.getExpoPushTokenAsync();
          linkPushTokenMutation.mutate(token.data);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enable notifications');
        setNotificationsEnabled(false);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Profile</Text>

        {/* User Info */}
        <Card className="mb-6">
          <Card.Content className="py-4">
            <Text className="text-lg font-semibold mb-2">{user?.email}</Text>
            <Text className="text-gray-600 mb-1">User ID: {user?.id}</Text>
            <Text className="text-sm text-gray-500">
              Member since {new Date(user?.created_at!).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card className="mb-6">
          <Card.Content className="py-4">
            <Text className="font-semibold mb-4">Settings</Text>
            
            <List.Item
              title="Push Notifications"
              description="Receive notifications for group activity"
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                />
              )}
            />
            
            <List.Item
              title="Daily Reminders"
              description="Get reminded to check in daily"
              right={() => (
                <Switch
                  value={dailyRemindersEnabled}
                  onValueChange={setDailyRemindersEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <Card.Content className="py-4">
            <Text className="font-semibold mb-4">Your Stats</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary-600">12</Text>
                <Text className="text-sm text-gray-600">Total Posts</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary-600">7</Text>
                <Text className="text-sm text-gray-600">Current Streak</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary-600">15</Text>
                <Text className="text-sm text-gray-600">Longest Streak</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View className="space-y-3">
          <Button mode="outlined" className="w-full">
            📊 View Detailed Stats
          </Button>
          <Button mode="outlined" className="w-full">
            🎯 Set Goals
          </Button>
          <Button mode="outlined" className="w-full">
            📞 Contact Support
          </Button>
        </View>

        {/* Sign Out */}
        <View className="mt-8">
          <Button
            mode="outlined"
            onPress={handleSignOut}
            className="w-full"
            buttonColor="#ef4444"
            textColor="white"
          >
            Sign Out
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
