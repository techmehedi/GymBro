import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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


const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const floatAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const rotationAnim = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 1000 });
    slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    
    // Floating animation
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      false
    );
    
    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
    
    // Rotation animation
    rotationAnim.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    );
  }, []);

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/auth/sign-up');
  };

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth/sign-in');
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ],
  }));

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnim.value, [0, 1], [0, -20]) },
      { rotate: `${rotationAnim.value}deg` }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[styles.content, containerStyle]}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Animated.View style={[styles.logoContainer, pulseStyle]}>
                <LinearGradient
                  colors={['#00D4FF', '#0099CC']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="fitness" size={60} color="white" />
                </LinearGradient>
              </Animated.View>
              
              <Text style={styles.title}>GymBro</Text>
              <Text style={styles.subtitle}>Your Fitness Accountability Partner</Text>
              <Text style={styles.description}>
                Join small groups of friends and stay motivated through daily check-ins,
                streak tracking, and AI-powered encouragement.
              </Text>
            </View>

            {/* Features Section */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Why Choose GymBro?</Text>
              
              <View style={styles.featuresGrid}>
                <BlurView intensity={20} tint="dark" style={styles.featureCard}>
                  <LinearGradient
                    colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                    style={styles.featureGradient}
                  >
                    <Ionicons name="people" size={32} color="#00D4FF" />
                    <Text style={styles.featureTitle}>Group Accountability</Text>
                    <Text style={styles.featureDescription}>
                      Join small groups of 2-5 friends and stay motivated together
                    </Text>
                  </LinearGradient>
                </BlurView>

                <BlurView intensity={20} tint="dark" style={styles.featureCard}>
                  <LinearGradient
                    colors={['rgba(255, 165, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
                    style={styles.featureGradient}
                  >
                    <Ionicons name="flame" size={32} color="#FFA500" />
                    <Text style={styles.featureTitle}>Streak Tracking</Text>
                    <Text style={styles.featureDescription}>
                      Build and maintain your fitness streaks with visual progress
                    </Text>
                  </LinearGradient>
                </BlurView>

                <BlurView intensity={20} tint="dark" style={styles.featureCard}>
                  <LinearGradient
                    colors={['rgba(0, 255, 150, 0.2)', 'rgba(0, 255, 150, 0.1)']}
                    style={styles.featureGradient}
                  >
                    <Ionicons name="camera" size={32} color="#00FF96" />
                    <Text style={styles.featureTitle}>Photo Check-ins</Text>
                    <Text style={styles.featureDescription}>
                      Share your workout progress with photos and text updates
                    </Text>
                  </LinearGradient>
                </BlurView>

                <BlurView intensity={20} tint="dark" style={styles.featureCard}>
                  <LinearGradient
                    colors={['rgba(255, 0, 150, 0.2)', 'rgba(255, 0, 150, 0.1)']}
                    style={styles.featureGradient}
                  >
                    <Ionicons name="musical-notes" size={32} color="#FF0096" />
                    <Text style={styles.featureTitle}>AI Motivation</Text>
                    <Text style={styles.featureDescription}>
                      Get personalized encouragement with AI-powered voice messages
                    </Text>
                  </LinearGradient>
                </BlurView>
              </View>
            </View>

            {/* CTA Section */}
            <View style={styles.ctaSection}>
              <BlurView intensity={20} tint="dark" style={styles.ctaCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
                  <Text style={styles.ctaDescription}>
                    Join thousands of users who are already crushing their fitness goals!
                  </Text>
                  
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={styles.primaryButton} 
                      onPress={handleGetStarted}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#00D4FF', '#0099CC']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.secondaryButton} 
                      onPress={handleSignIn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.secondaryButtonText}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </BlurView>
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  featuresSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureGradient: {
    padding: 24,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    textAlign: 'center',
  },
  ctaSection: {
    marginBottom: 40,
  },
  ctaCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctaGradient: {
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
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
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

