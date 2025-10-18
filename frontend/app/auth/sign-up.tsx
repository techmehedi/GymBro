import React from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);

  React.useEffect(() => {
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signUp(email.trim(), password, displayName.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Success!', 
        'Account created and signed in successfully!',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Navigate to dashboard after successful sign-up
            router.replace('/(tabs)');
          }
        }]
      );
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      // If user already exists, offer to sign in instead
      if (errorMessage.includes('already exists')) {
        Alert.alert(
          'Account Exists', 
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In Instead', onPress: () => {
              // Navigate to sign in screen
              router.push('/auth/sign-in');
            }}
          ]
        );
      } else {
        Alert.alert('Sign Up Failed', errorMessage);
      }
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ],
  }));

  const isFormValid = email.trim() && password.trim() && displayName.trim() && confirmPassword.trim() && password === confirmPassword && password.length >= 6;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E', '#0F3460']}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.content, containerStyle]}>
            <View style={styles.header}>
              <Text style={styles.title}>Join GymBro</Text>
              <Text style={styles.subtitle}>
                Create your account to start your fitness journey
              </Text>
            </View>

            <BlurView intensity={20} tint="dark" style={styles.card}>
              <LinearGradient
                colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                style={styles.cardGradient}
              >
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Display Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter your display name"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    autoComplete="name"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry
                    autoComplete="password-new"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry
                    autoComplete="password-new"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleSignUp}
                  disabled={isLoading || !isFormValid}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isFormValid && !isLoading ? ['#00D4FF', '#0099CC'] : ['#666', '#555']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                    <Ionicons name="person-add" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                  <Text style={styles.linkText}>Already have an account? </Text>
                  <Link href="/auth/sign-in" asChild>
                    <TouchableOpacity activeOpacity={0.8}>
                      <Text style={styles.linkButton}>Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </LinearGradient>
            </BlurView>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
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
  primaryButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
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
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  linkButton: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});