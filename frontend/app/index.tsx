import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/sign-up');
  };

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0ea5e9', '#0284c7', '#0369a1']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>GymBro</Text>
          <Text style={styles.subtitle}>Stay consistent with your fitness goals</Text>
          <Text style={styles.description}>
            Join small groups of friends and motivate each other through daily check-ins,
            streak tracking, and AI-powered encouragement.
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Why Choose GymBro?</Text>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="people" size={32} color="#0ea5e9" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Small Groups</Text>
              <Text style={styles.featureDescription}>
                Create or join groups of 2-5 friends for personalized accountability
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="camera" size={32} color="#0ea5e9" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Daily Check-ins</Text>
              <Text style={styles.featureDescription}>
                Share your workout progress with photos or text updates
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="flame" size={32} color="#0ea5e9" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Streak Tracking</Text>
              <Text style={styles.featureDescription}>
                Build and maintain workout streaks with visual progress tracking
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="bulb" size={32} color="#0ea5e9" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Motivation</Text>
              <Text style={styles.featureDescription}>
                Get personalized encouragement messages powered by AI
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Join the Community Today!</Text>
        </View>

        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#e0f2fe',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#bae6fd',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  content: {
    padding: 20,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 30,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  ctaContainer: {
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  secondaryButtonText: {
    color: '#0ea5e9',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
