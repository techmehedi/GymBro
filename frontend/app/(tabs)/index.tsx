import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { useRouter } from 'expo-router';
import { handlePlayAudio } from '../../lib/ailogic';


const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, signOut, isAuthenticated } = useAuthStore();
  const { groups, fetchGroups, isLoading } = useGroupStore();
  const router = useRouter();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.8);
  const rotationAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      fetchGroups();
    }
    
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    
    // Continuous rotation for floating elements
    rotationAnim.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    );
    
    // Pulse animation for motivational elements
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [isAuthenticated, user]);

  const handleCheckIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/checkin');
  };

  const handleViewStreaks = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/streaks');
  };

  const handleViewGroups = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/groups');
  };

  const handleMotivation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await handlePlayAudio();
  };

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signOut();
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ],
  }));

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotationAnim.value}deg` },
      { scale: pulseAnim.value }
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value * 0.5 },
      { scale: scaleAnim.value }
    ],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E', '#0F3460']}
        style={styles.background}
      >
        {/* Floating background elements */}
        <Animated.View style={[styles.floatingElement, styles.floating1, floatingStyle]}>
          <LinearGradient
            colors={['rgba(0, 212, 255, 0.1)', 'rgba(0, 212, 255, 0.05)']}
            style={styles.floatingGradient}
          />
        </Animated.View>
        <Animated.View style={[styles.floatingElement, styles.floating2, floatingStyle]}>
          <LinearGradient
            colors={['rgba(255, 0, 150, 0.1)', 'rgba(255, 0, 150, 0.05)']}
            style={styles.floatingGradient}
          />
        </Animated.View>
        <Animated.View style={[styles.floatingElement, styles.floating3, floatingStyle]}>
          <LinearGradient
            colors={['rgba(0, 255, 150, 0.1)', 'rgba(0, 255, 150, 0.05)']}
            style={styles.floatingGradient}
          />
        </Animated.View>

        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.header, containerStyle]}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.display_name || 'Champion'}! 💪</Text>
            <Text style={styles.subtitle}>Ready to crush your fitness goals today?</Text>
          </Animated.View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Groups Card */}
            <Animated.View style={[styles.cardContainer, cardStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="people" size={24} color="#00D4FF" />
                    <Text style={styles.cardTitle}>Your Groups</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    {groups && groups.length > 0 
                      ? `You're in ${groups.length} group${groups.length > 1 ? 's' : ''}`
                      : 'Join or create a group to get started!'
                    }
                  </Text>
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={handleViewGroups}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#00D4FF', '#0099CC']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>
                        {groups && groups.length > 0 ? 'View Groups' : 'Create Group'}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Check-in Card */}
            <Animated.View style={[styles.cardContainer, cardStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 0, 150, 0.2)', 'rgba(255, 0, 150, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="camera" size={24} color="#FF0096" />
                    <Text style={styles.cardTitle}>Today's Check-in</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Share your workout progress with your group
                  </Text>
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={handleCheckIn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>Check In</Text>
                    <Ionicons name="camera-outline" size={20} color="#FF0096" />
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Streaks Card */}
            <Animated.View style={[styles.cardContainer, cardStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 165, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="flame" size={24} color="#FFA500" />
                    <Text style={styles.cardTitle}>Your Streaks</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Keep the momentum going!
                  </Text>
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={handleViewStreaks}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>View Streaks</Text>
                    <Ionicons name="flame-outline" size={20} color="#FFA500" />
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Motivation Card */}
            <Animated.View style={[styles.cardContainer, cardStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
                <LinearGradient
                  colors={['rgba(0, 255, 150, 0.2)', 'rgba(0, 255, 150, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="musical-notes" size={24} color="#00FF96" />
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
                    <Text style={styles.secondaryButtonText}>Play Audio</Text>
                    <Ionicons name="play" size={20} color="#00FF96" />
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </ScrollView>

          {/* Bottom Actions */}
          <Animated.View style={[styles.bottomActions, containerStyle]}>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
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
  floatingElement: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.6,
  },
  floating1: {
    width: 120,
    height: 120,
    top: 100,
    right: -30,
  },
  floating2: {
    width: 80,
    height: 80,
    top: 300,
    left: -20,
  },
  floating3: {
    width: 100,
    height: 100,
    top: 500,
    right: 20,
  },
  floatingGradient: {
    flex: 1,
    borderRadius: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  signOutText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});
