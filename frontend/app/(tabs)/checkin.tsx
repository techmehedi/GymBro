import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, TextInput, Alert, Dimensions, Image } from 'react-native';
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
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { handlePlayAudio } from '../../lib/ailogic';

const { width } = Dimensions.get('window');

export default function CheckInScreen() {
  const { groups, joinGroup } = useGroupStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State
  const [inviteCode, setInviteCode] = useState('');
  const [checkInText, setCheckInText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const pulseAnim = useSharedValue(1);
  const modalAnim = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    
    // Pulse animation for motivational elements
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  React.useEffect(() => {
    if (showJoinModal) {
      modalAnim.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      modalAnim.value = withTiming(0, { duration: 200 });
    }
  }, [showJoinModal]);

  const requestCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera permission to take photos');
      return false;
    }
    return true;
  };

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need photo library permission to access your photos');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const selectFromGallery = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await joinGroup(inviteCode.trim());
      setInviteCode('');
      setShowJoinModal(false);
      Alert.alert('Success', 'Joined group successfully!');
    } catch (error) {
      console.error('Failed to join group:', error);
      Alert.alert('Error', 'Failed to join group. Please check the invite code.');
    }
  };

  const handleCheckIn = async () => {
    if (!checkInText.trim() || groups.length === 0) {
      Alert.alert('Error', groups.length === 0 ? 'Join a group first!' : 'Please enter your check-in message');
      return;
    }

    setIsSubmitting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // This would create a post in the first group
      // In a real app, you'd let the user select which group
      console.log('Checking in:', checkInText);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCheckInText('');
      setSelectedImage(null);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Check-in posted successfully!');
    } catch (error) {
      console.error('Failed to check in:', error);
      Alert.alert('Error', 'Failed to post check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMotivation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await handlePlayAudio();
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
            <Text style={styles.title}>Daily Check-in</Text>
            <Text style={styles.subtitle}>Share your progress with your fitness group</Text>
          </Animated.View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Join Group Card */}
            {groups.length === 0 && (
              <Animated.View style={[styles.cardContainer, containerStyle]}>
                <BlurView intensity={20} tint="dark" style={styles.card}>
                  <LinearGradient
                    colors={['rgba(255, 0, 150, 0.2)', 'rgba(255, 0, 150, 0.1)']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="people" size={24} color="#FF0096" />
                      <Text style={styles.cardTitle}>Join a Group</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                      Join a fitness group to start checking in and stay motivated!
                    </Text>
                    <TouchableOpacity 
                      style={styles.primaryButton}
                      onPress={() => setShowJoinModal(true)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#FF0096', '#CC0077']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>Join Group</Text>
                        <Ionicons name="log-in" size={20} color="white" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            )}

            {/* Check-in Form */}
            <Animated.View style={[styles.cardContainer, containerStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="fitness" size={24} color="#00D4FF" />
                    <Text style={styles.cardTitle}>What did you do today?</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Share your workout progress with your group
                  </Text>
                  
                  <TextInput
                    style={styles.textInput}
                    value={checkInText}
                    onChangeText={setCheckInText}
                    placeholder="e.g., Did a 30-minute run, feeling great! 💪"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={handleCheckIn}
                    disabled={!checkInText.trim() || groups.length === 0 || isSubmitting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={checkInText.trim() && groups.length > 0 ? ['#00D4FF', '#0099CC'] : ['#666', '#555']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>
                        {isSubmitting ? 'Posting...' : 'Post Check-in'}
                      </Text>
                      <Ionicons name="send" size={20} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Photo Check-in */}
            <Animated.View style={[styles.cardContainer, containerStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(0, 255, 150, 0.2)', 'rgba(0, 255, 150, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="camera" size={24} color="#00FF96" />
                    <Text style={styles.cardTitle}>Photo Check-in</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Take a photo of your workout or progress
                  </Text>

                  {selectedImage && (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF0096" />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.photoButtons}>
                    <TouchableOpacity 
                      style={styles.secondaryButton}
                      onPress={takePhoto}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-outline" size={20} color="#00FF96" />
                      <Text style={styles.secondaryButtonText}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.secondaryButton}
                      onPress={selectFromGallery}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images-outline" size={20} color="#00FF96" />
                      <Text style={styles.secondaryButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Motivation Card */}
            <Animated.View style={[styles.cardContainer, containerStyle, pulseStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 165, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="musical-notes" size={24} color="#FFA500" />
                    <Text style={styles.cardTitle}>Get Motivated</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Listen to AI-powered motivation
                  </Text>
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={handleMotivation}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={20} color="#FFA500" />
                    <Text style={styles.secondaryButtonText}>Play Audio</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>

        {/* Join Group Modal */}
        {showJoinModal && (
          <Animated.View style={[styles.modalOverlay, modalStyle]}>
            <BlurView intensity={20} tint="dark" style={styles.modal}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Join Group</Text>
                  <TouchableOpacity
                    onPress={() => setShowJoinModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Invite Code</Text>
                    <TextInput
                      style={styles.textInput}
                      value={inviteCode}
                      onChangeText={setInviteCode}
                      placeholder="Enter group invite code"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      autoCapitalize="characters"
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={handleJoinGroup}
                    disabled={!inviteCode.trim()}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={inviteCode.trim() ? ['#FF0096', '#CC0077'] : ['#666', '#555']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>Join Group</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  cardContainer: {
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
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
    minHeight: 100,
  },
  primaryButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
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
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
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
});
