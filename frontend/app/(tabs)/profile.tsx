import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph, Avatar, TextInput } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, signOut, updateUserProfile } = useAuthStore();
  const [displayName, setDisplayName] = React.useState(user?.display_name || '');
  const [isEditing, setIsEditing] = React.useState(false);

  const handleUpdateProfile = async () => {
    try {
      await updateUserProfile({ display_name: displayName });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={user?.display_name?.charAt(0) || 'U'} 
          style={styles.avatar}
        />
        <Title style={styles.name}>{user?.display_name}</Title>
        <Paragraph style={styles.email}>{user?.email}</Paragraph>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Profile Settings</Title>
            <Paragraph>Update your display name</Paragraph>
            
            {isEditing ? (
              <View>
                <TextInput
                  label="Display Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.input}
                  mode="outlined"
                />
                <View style={styles.buttonRow}>
                  <Button 
                    mode="contained" 
                    onPress={handleUpdateProfile}
                    style={styles.button}
                  >
                    Save
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      setDisplayName(user?.display_name || '');
                      setIsEditing(false);
                    }}
                    style={styles.button}
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            ) : (
              <Button 
                mode="outlined" 
                onPress={() => setIsEditing(true)}
                style={styles.button}
              >
                Edit Profile
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Account</Title>
            <Paragraph>Manage your account settings</Paragraph>
            <Button 
              mode="outlined" 
              onPress={signOut}
              style={styles.button}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Notifications</Title>
            <Paragraph>Manage your notification preferences</Paragraph>
            <Button 
              mode="outlined" 
              onPress={() => {/* Navigate to notification settings */}}
              style={styles.button}
            >
              Settings
            </Button>
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
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatar: {
    backgroundColor: '#0ea5e9',
    marginBottom: 16,
  },
  name: {
    marginBottom: 8,
  },
  email: {
    color: '#64748b',
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
  input: {
    marginVertical: 8,
  },
  button: {
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
