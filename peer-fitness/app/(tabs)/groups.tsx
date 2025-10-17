import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { Card, Button, TextInput, Modal, Portal } from 'react-native-paper';

import { useFitnessStore } from '@/store/fitnessStore';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function GroupsScreen() {
  const { user } = useAuth();
  const { groups, fetchGroups, createGroup, joinGroup } = useFitnessStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  React.useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user, fetchGroups]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      await createGroup(groupName.trim(), groupDescription.trim());
      setCreateModalVisible(false);
      setGroupName('');
      setGroupDescription('');
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Invite code is required');
      return;
    }

    try {
      await joinGroup(inviteCode.trim());
      setJoinModalVisible(false);
      setInviteCode('');
      Alert.alert('Success', 'Successfully joined the group!');
    } catch (error) {
      Alert.alert('Error', 'Invalid invite code or already a member');
    }
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-center mb-4">
          Please sign in to manage groups
        </Text>
        <Link href="/auth/sign-in" asChild>
          <Button mode="contained">Sign In</Button>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold">My Groups</Text>
          <View className="flex-row space-x-2">
            <Button
              mode="outlined"
              onPress={() => setJoinModalVisible(true)}
              className="mr-2"
            >
              Join
            </Button>
            <Button
              mode="contained"
              onPress={() => setCreateModalVisible(true)}
            >
              Create
            </Button>
          </View>
        </View>

        {groups.length === 0 ? (
          <Card>
            <Card.Content className="py-8">
              <Text className="text-center text-gray-600 mb-4">
                You're not part of any groups yet
              </Text>
              <Text className="text-center text-gray-500">
                Create a new group or join one with an invite code
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <Card.Content className="py-4">
                  <Text className="text-lg font-semibold mb-2">{group.name}</Text>
                  {group.description && (
                    <Text className="text-gray-600 mb-3">{group.description}</Text>
                  )}
                  <Text className="text-sm text-gray-500 mb-3">
                    Invite Code: {group.inviteCode}
                  </Text>
                  <Link href={`/group/${group.id}`} asChild>
                    <Button mode="outlined" className="w-full">
                      View Group
                    </Button>
                  </Link>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Create Group Modal */}
        <Portal>
          <Modal
            visible={createModalVisible}
            onDismiss={() => setCreateModalVisible(false)}
            contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20 }}
          >
            <Text className="text-xl font-bold mb-4">Create New Group</Text>
            <TextInput
              label="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              className="mb-4"
            />
            <TextInput
              label="Description (Optional)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              className="mb-6"
            />
            <View className="flex-row space-x-2">
              <Button
                mode="outlined"
                onPress={() => setCreateModalVisible(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateGroup}
                className="flex-1"
              >
                Create
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* Join Group Modal */}
        <Portal>
          <Modal
            visible={joinModalVisible}
            onDismiss={() => setJoinModalVisible(false)}
            contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20 }}
          >
            <Text className="text-xl font-bold mb-4">Join Group</Text>
            <TextInput
              label="Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              className="mb-6"
            />
            <View className="flex-row space-x-2">
              <Button
                mode="outlined"
                onPress={() => setJoinModalVisible(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleJoinGroup}
                className="flex-1"
              >
                Join
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </ScrollView>
  );
}
