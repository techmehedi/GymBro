import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { apiClient } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut, updateUserProfile } = useAuthStore();
  const { groups } = useGroupStore();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({
    groups: 0,
    streak: 0,
    checkins: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const pulseAnim = useSharedValue(1);
  const avatarScale = useSharedValue(1);

  React.useEffect(() => {
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    
    // Pulse animation for avatar
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

    // Fetch user stats
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    if (!user) return;
    
    setIsLoadingStats(true);
    try {
      // Get groups count
      const groupsCount = groups.length;
      
      // Get user's posts (check-ins)
      const { posts } = await apiClient.getUserPosts(100, 0);
      const checkinsCount = posts.filter((post: any) => post.post_type === 'checkin').length;
      
      // Get user's streaks from all groups
      let maxStreak = 0;
      for (const group of groups) {
        try {
          const { streaks } = await apiClient.getGroupStreaks(group.id);
          const userStreak = streaks.find((s: any) => s.user_id === user.id);
          if (userStreak && userStreak.current_streak > maxStreak) {
            maxStreak = userStreak.current_streak;
          }
        } catch (error) {
          console.warn(`Failed to fetch streaks for group ${group.id}:`, error);
        }
      }
      
      setStats({
        groups: groupsCount,
        streak: maxStreak,
        checkins: checkinsCount
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    setIsUpdating(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      let avatarUrl = user?.avatar_url || undefined;

      // If user picked a new avatar (local uri), upload it directly (RN-safe)
      if (selectedAvatarUri && !selectedAvatarUri.startsWith('http')) {
        setIsUploadingAvatar(true);
        const fileName = `avatar-${user?.id || 'me'}-${Date.now()}.jpg`;
        try {
          const direct = await apiClient.directUpload({ uri: selectedAvatarUri }, fileName, 'image/jpeg');
          avatarUrl = (direct as any).url;
        } catch (e2) {
          console.warn('Avatar upload failed:', e2);
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      await updateUserProfile({ display_name: displayName.trim(), avatar_url: avatarUrl });
      setIsEditing(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully!');
      // Refresh stats after profile update
      fetchUserStats();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await signOut();
          }
        }
      ]
    );
  };

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisplayName(user?.display_name || '');
    setIsEditing(false);
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isEditing) {
      pickAvatarFromGallery();
      return;
    }
    avatarScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
  };

  const pickAvatarFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to set your profile picture.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedAvatarUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Avatar pick failed:', e);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E', '#0F3460']}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Header */}
            <Animated.View style={[styles.profileHeader, containerStyle]}>
              <Animated.View style={[styles.avatarContainer, pulseStyle, avatarStyle]}>
                <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
                  <LinearGradient colors={['#00D4FF', '#0099CC']} style={styles.avatarGradient}>
                    {selectedAvatarUri || user?.avatar_url ? (
                      <Image
                        source={{ uri: selectedAvatarUri || (user?.avatar_url as string) }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {(user?.display_name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                {isEditing && (
                  <TouchableOpacity onPress={pickAvatarFromGallery} style={styles.cameraBadge} activeOpacity={0.8}>
                    <Ionicons name="camera" size={16} color="#0F0F23" />
                  </TouchableOpacity>
                )}
              </Animated.View>
              
              <Text style={styles.userName}>{user?.display_name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {isLoadingStats ? '...' : stats.groups}
                  </Text>
                  <Text style={styles.statLabel}>Groups</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {isLoadingStats ? '...' : stats.streak}
                  </Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {isLoadingStats ? '...' : stats.checkins}
                  </Text>
                  <Text style={styles.statLabel}>Check-ins</Text>
                </View>
              </View>
            </Animated.View>

            {/* Profile Settings */}
            <Animated.View style={[styles.cardContainer, containerStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="person" size={24} color="#00D4FF" />
                    <Text style={styles.cardTitle}>Profile Settings</Text>
                  </View>
                  
                  {isEditing ? (
                    <View style={styles.editContainer}>
                      <Text style={styles.inputLabel}>Display Name</Text>
                      <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={pickAvatarFromGallery}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="image" size={20} color="#00D4FF" />
                        <Text style={styles.secondaryButtonText}>{isUploadingAvatar ? 'Uploading...' : 'Change Photo'}</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.textInput}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Enter your display name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        autoFocus
                      />
                      <View style={styles.buttonRow}>
                        <TouchableOpacity 
                          style={styles.secondaryButton}
                          onPress={handleCancelEdit}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.primaryButton}
                          onPress={handleUpdateProfile}
                          disabled={isUpdating || !displayName.trim()}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={displayName.trim() && !isUpdating ? ['#00D4FF', '#0099CC'] : ['#666', '#555']}
                            style={styles.buttonGradient}
                          >
                            <Text style={styles.buttonText}>
                              {isUpdating ? 'Saving...' : 'Save'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.cardDescription}>
                        Update your display name and profile information
                      </Text>
                      <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={handleEditPress}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="create-outline" size={20} color="#00D4FF" />
                        <Text style={styles.secondaryButtonText}>Edit Profile</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Account Settings */}
            <Animated.View style={[styles.cardContainer, containerStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 0, 150, 0.2)', 'rgba(255, 0, 150, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="settings" size={24} color="#FF0096" />
                    <Text style={styles.cardTitle}>Account</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Manage your account settings and preferences
                  </Text>
                  
                  <View style={styles.settingsList}>
                    <TouchableOpacity 
                      style={styles.settingItem}
                      onPress={() => {/* Navigate to privacy settings */}}
                      activeOpacity={0.7}
                    >
                      <View style={styles.settingInfo}>
                        <Ionicons name="shield-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.settingText}>Privacy & Security</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.settingItem}
                      onPress={() => {/* Navigate to data settings */}}
                      activeOpacity={0.7}
                    >
                      <View style={styles.settingInfo}>
                        <Ionicons name="cloud-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.settingText}>Data & Storage</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Notifications */}
            <Animated.View style={[styles.cardContainer, containerStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(0, 255, 150, 0.2)', 'rgba(0, 255, 150, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="notifications" size={24} color="#00FF96" />
                    <Text style={styles.cardTitle}>Notifications</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Manage your notification preferences
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => {/* Navigate to notification settings */}}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="settings-outline" size={20} color="#00FF96" />
                    <Text style={styles.secondaryButtonText}>Notification Settings</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Sign Out */}
            <Animated.View style={[styles.cardContainer, containerStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 100, 100, 0.2)', 'rgba(255, 100, 100, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="log-out" size={24} color="#FF6464" />
                    <Text style={styles.cardTitle}>Sign Out</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Sign out of your account
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.dangerButton}
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="log-out-outline" size={20} color="white" />
                    <Text style={styles.dangerButtonText}>Sign Out</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#00D4FF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#0F0F23',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  cardContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    lineHeight: 24,
  },
  editContainer: {
    gap: 16,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 100, 100, 0.3)',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingsList: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
});
