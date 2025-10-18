import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph, TextInput } from 'react-native-paper';
import { Link } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    tempNavigation();
    /* 
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      Alert.alert('Sign In Failed', error instanceof Error ? error.message : 'An error occurred');
    } */
  };

  const tempNavigation = () => {
    router.push('/(tabs)')
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Welcome to GymBro</Title>
            <Paragraph style={styles.subtitle}>
              Sign in to continue your fitness journey
            </Paragraph>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              autoComplete="password"
            />

            <Button 
              mode="contained" 
              onPress={handleSignIn}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>

            <View style={styles.linkContainer}>
              <Paragraph>Don't have an account? </Paragraph>
              <Link href="/auth/sign-up" asChild>
                <Button mode="text">Sign Up</Button>
              </Link>
            </View>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    backgroundColor: '#ffffff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#64748b',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
