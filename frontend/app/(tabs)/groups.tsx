import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Text, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { Group, User } from '../../types';
import { apiClient } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function GroupsScreen() {
  const { groups, fetchGroups, isLoading, createGroup } = useGroupStore();
  const { user } = useAuthStore();
  
  // State for group creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  
  // State for user search
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const modalAnim = useSharedValue(0);

  React.useEffect(() => {
    fetchGroups();
    
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  React.useEffect(() => {
    if (showCreateModal || showSearchModal) {
      modalAnim.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      modalAnim.value = withTiming(0, { duration: 200 });
    }
  }, [showCreateModal, showSearchModal]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        max_members: maxMembers,
      });
      
      setGroupName('');
      setGroupDescription('');
      setMaxMembers(5);
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // This would be an API call to search users by username
      // For now, we'll simulate with mock data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john@example.com',
          display_name: 'John Doe',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'jane@example.com',
          display_name: 'Jane Smith',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ].filter(user => 
        user.display_name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockUsers);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: User) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleJoinGroup = async () => {
    Alert.prompt(
      'Join Group',
      'Enter the invite code for the group you want to join:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: async (inviteCode) => {
            if (!inviteCode?.trim()) return;
            
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // This would call the join group API
              Alert.alert('Success', 'Joined group successfully!');
            } catch (error) {
              console.error('Join group error:', error);
              Alert.alert('Error', 'Failed to join group. Please check the invite code.');
            }
          }
        }
      ]
    );
  };

  const renderGroup = ({ item, index }: { item: Group; index: number }) => {
    const cardAnim = useSharedValue(0);
    
    React.useEffect(() => {
      cardAnim.value = withTiming(1, { 
        duration: 600,
        delay: index * 100 
      });
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardAnim.value,
      transform: [
        { translateY: interpolate(cardAnim.value, [0, 1], [50, 0]) },
        { scale: interpolate(cardAnim.value, [0, 1], [0.9, 1]) }
      ],
    }));

    return (
      <Animated.View style={[styles.groupCardContainer, cardStyle]}>
        <BlurView intensity={20} tint="dark" style={styles.groupCard}>
          <LinearGradient
            colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
            style={styles.groupCardGradient}
          >
            <View style={styles.groupHeader}>
              <View style={styles.groupIconContainer}>
                <Ionicons name="people" size={24} color="#00D4FF" />
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupDescription}>
                  {item.description || 'No description'}
                </Text>
              </View>
            </View>
            
            <View style={styles.groupStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.statText}>Max {item.max_members}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="key-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.statText}>{item.invite_code}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.groupButton}
              onPress={() => {/* Navigate to group details */}}
              activeOpacity={0.8}
            >
              <Text style={styles.groupButtonText}>View Group</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    );
  };

  const renderSearchResult = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.find(u => u.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.searchResultItem,
          isSelected && styles.selectedSearchResult
        ]}
        onPress={() => handleSelectUser(item)}
        activeOpacity={0.7}
      >
        <View style={styles.searchResultInfo}>
          <View style={styles.searchResultAvatar}>
            <Text style={styles.searchResultAvatarText}>
              {item.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.searchResultName}>{item.display_name}</Text>
            <Text style={styles.searchResultEmail}>{item.email}</Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#00D4FF" />
        )}
      </TouchableOpacity>
    );
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ],
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalAnim.value,
    transform: [
      { scale: interpolate(modalAnim.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(modalAnim.value, [0, 1], [50, 0]) }
    ],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E', '#0F3460']}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.header, containerStyle]}>
            <Text style={styles.title}>Your Groups</Text>
            <Text style={styles.subtitle}>Stay motivated with your fitness buddies</Text>
          </Animated.View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00D4FF', '#0099CC']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.actionButtonText}>Create Group</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleJoinGroup}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF0096', '#CC0077']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="log-in" size={20} color="white" />
                <Text style={styles.actionButtonText}>Join Group</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Animated.View style={[styles.emptyContainer, containerStyle]}>
                <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.emptyCardGradient}
                  >
                    <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={styles.emptyTitle}>No groups yet</Text>
                    <Text style={styles.emptyDescription}>
                      Create or join a group to get started!
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={() => setShowCreateModal(true)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#00D4FF', '#0099CC']}
                        style={styles.emptyButtonGradient}
                      >
                        <Text style={styles.emptyButtonText}>Create Your First Group</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            }
          />
        </SafeAreaView>

        {/* Create Group Modal */}
        {showCreateModal && (
          <Animated.View style={[styles.modalOverlay, modalStyle]}>
            <BlurView intensity={20} tint="dark" style={styles.modal}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create New Group</Text>
                  <TouchableOpacity
                    onPress={() => setShowCreateModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Group Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={groupName}
                      onChangeText={setGroupName}
                      placeholder="Enter group name"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={groupDescription}
                      onChangeText={setGroupDescription}
                      placeholder="Enter group description"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Max Members</Text>
                    <TextInput
                      style={styles.textInput}
                      value={maxMembers.toString()}
                      onChangeText={(text) => setMaxMembers(parseInt(text) || 5)}
                      placeholder="5"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={handleCreateGroup}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#00D4FF', '#0099CC']}
                      style={styles.createButtonGradient}
                    >
                      <Text style={styles.createButtonText}>Create Group</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  groupCardContainer: {
    marginBottom: 16,
  },
  groupCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupCardGradient: {
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  groupStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  groupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: width - 48,
  },
  emptyCardGradient: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: width - 48,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 8,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  selectedSearchResult: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  searchResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchResultAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
