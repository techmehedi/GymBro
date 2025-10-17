import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View, Alert, Image } from 'react-native';
import { Card, Button, TextInput, FAB } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { useFitnessStore } from '@/store/fitnessStore';
import { api } from '@/utils/api';

export default function CheckInScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { groups, selectedGroup, setSelectedGroup } = useFitnessStore();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: todayPost, isLoading: postLoading } = useQuery({
    queryKey: ['today-post', selectedGroup?.id],
    queryFn: () => api.getTodayPost(selectedGroup?.id!),
    enabled: !!selectedGroup && isSignedIn,
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitCheckIn = async () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Please select a group first');
      return;
    }

    if (!content.trim() && !image) {
      Alert.alert('Error', 'Please add a message or photo');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (image) {
        // Upload image to R2
        imageUrl = await api.uploadImage(image);
      }

      await api.createPost(selectedGroup.id, content.trim(), imageUrl);
      
      Alert.alert('Success', 'Check-in submitted successfully!');
      setContent('');
      setImage(null);
      router.push('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-center mb-4">
          Please sign in to check in
        </Text>
        <Button mode="contained" onPress={() => router.push('/sign-in')}>
          Sign In
        </Button>
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
          Join or create a group to start checking in
        </Text>
        <Button mode="contained" onPress={() => router.push('/groups')}>
          Manage Groups
        </Button>
      </View>
    );
  }

  if (todayPost) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-6">
          <Card className="mb-6">
            <Card.Content className="py-6">
              <Text className="text-xl font-bold text-center mb-2">
                ✅ Already Checked In Today!
              </Text>
              <Text className="text-center text-gray-600">
                You've already posted your workout for today. Great job!
              </Text>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="py-4">
              <Text className="font-semibold mb-2">Today's Post:</Text>
              {todayPost.content && (
                <Text className="text-gray-700 mb-3">{todayPost.content}</Text>
              )}
              {todayPost.imageUrl && (
                <Image
                  source={{ uri: todayPost.imageUrl }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Daily Check-in</Text>

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

        {/* Content Input */}
        <Card className="mb-6">
          <Card.Content className="py-4">
            <Text className="font-semibold mb-3">Share your workout:</Text>
            <TextInput
              label="What did you do today?"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              placeholder="e.g., 30 min cardio, strength training, yoga session..."
            />
          </Card.Content>
        </Card>

        {/* Image Section */}
        <Card className="mb-6">
          <Card.Content className="py-4">
            <Text className="font-semibold mb-3">Add a photo (optional):</Text>
            {image ? (
              <View className="mb-4">
                <Image
                  source={{ uri: image }}
                  className="w-full h-48 rounded-lg mb-3"
                  resizeMode="cover"
                />
                <Button mode="outlined" onPress={() => setImage(null)}>
                  Remove Photo
                </Button>
              </View>
            ) : (
              <View className="flex-row space-x-3">
                <Button mode="outlined" onPress={pickImage} className="flex-1">
                  📷 Choose Photo
                </Button>
                <Button mode="outlined" onPress={takePhoto} className="flex-1">
                  📸 Take Photo
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={submitCheckIn}
          loading={isSubmitting}
          disabled={isSubmitting || (!content.trim() && !image)}
          className="w-full"
        >
          Submit Check-in
        </Button>
      </View>
    </ScrollView>
  );
}
