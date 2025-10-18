import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();
  const { groups, fetchGroups, isLoading } = useGroupStore();

  React.useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title>Welcome back, {user?.display_name}!</Title>
        <Paragraph>Ready to crush your fitness goals today?</Paragraph>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Your Groups</Title>
            <Paragraph>
              {groups.length > 0 
                ? `You're in ${groups.length} group${groups.length > 1 ? 's' : ''}`
                : 'Join or create a group to get started!'
              }
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={() => {/* Navigate to groups */}}
              style={styles.button}
            >
              {groups.length > 0 ? 'View Groups' : 'Create Group'}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Today's Check-in</Title>
            <Paragraph>Share your workout progress with your group</Paragraph>
            <Button 
              mode="outlined" 
              onPress={() => {/* Navigate to check-in */}}
              style={styles.button}
            >
              Check In
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Your Streaks</Title>
            <Paragraph>Keep the momentum going!</Paragraph>
            <Button 
              mode="outlined" 
              onPress={() => {/* Navigate to streaks */}}
              style={styles.button}
            >
              View Streaks
            </Button>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button mode="text" onPress={signOut}>
          Sign Out
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  card: {
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
});
