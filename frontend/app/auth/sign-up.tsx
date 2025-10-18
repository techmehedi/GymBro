import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph, TextInput } from 'react-native-paper';
import { Link } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuthStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

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
      await signUp(email.trim(), password, displayName.trim());
    } catch (error) {
      Alert.alert('Sign Up Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Join GymBro</Title>
            <Paragraph style={styles.subtitle}>
              Create your account to start your fitness journey
            </Paragraph>

            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              mode="outlined"
              autoComplete="name"
            />

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
              autoComplete="password-new"
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              autoComplete="password-new"
            />

            <Button 
              mode="contained" 
              onPress={handleSignUp}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
            >
              Sign Up
            </Button>

            <View style={styles.linkContainer}>
              <Paragraph>Already have an account? </Paragraph>
              <Link href="/auth/sign-in" asChild>
                <Button mode="text">Sign In</Button>
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
