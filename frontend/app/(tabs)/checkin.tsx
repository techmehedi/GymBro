import React, {useState} from 'react';
import { View, StyleSheet, ScrollView,Text} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph, TextInput, } from 'react-native-paper';
import { useGroupStore } from '../../store/groupStore';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';

export default function CheckInScreen() {
  const { groups, joinGroup } = useGroupStore();
  const [inviteCode, setInviteCode] = React.useState('');
  const [checkInText, setCheckInText] = React.useState('');
  const router = useRouter();

  const reqCamPermissions = async () => { /* requests camera permission */
    const {status} = await Camera.requestCameraPermissionsAsync();
    if(status !== 'granted'){
      Alert.alert('Permission denied', 'We need your perm to show the camera');
      return false;
    }
    return true;
  }
  const reqMediaPermissions = async () => { /* Request camera roll permission */
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(status!=='granted'){
      Alert.alert('Permission denied', 'We need your perm to access your photos');
      return false;
    }
    return true;
  }

  const photoCapture = async () =>{ /* Capture photo from camera */
    const hasCamPerm = await reqCamPermissions();
    if(!hasCamPerm) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false, 
      quality: 1,
      exif: true, //keeps photo metadata
    });
    
    //will add sometype of data storage here
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;
    
    try {
      await joinGroup(inviteCode.trim());
      setInviteCode('');
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!checkInText.trim() || groups.length === 0) return;
    
    try {
      // This would create a post in the first group
      // In a real app, you'd let the user select which group
      console.log('Checking in:', checkInText);
      setCheckInText('');
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Check In" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Join a Group</Title>
            <Paragraph>Enter an invite code to join a fitness group</Paragraph>
            <TextInput
              label="Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              style={styles.input}
              mode="outlined"
            />
            <Button 
              mode="contained" 
              onPress={handleJoinGroup}
              style={styles.button}
              disabled={!inviteCode.trim()}
            >
              Join Group
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Daily Check-in</Title>
            <Paragraph>
              {groups.length > 0 
                ? 'Share your workout progress with your group'
                : 'Join a group first to start checking in!'
              }
            </Paragraph>
            <TextInput
              label="What did you do today?"
              value={checkInText}
              onChangeText={setCheckInText}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="e.g., Did a 30-minute run, feeling great!"
            />
            <Button 
              mode="contained" 
              onPress={handleCheckIn}
              style={styles.button}
              disabled={!checkInText.trim() || groups.length === 0}
            >
              Check In
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Photo Check-in</Title>
            <Paragraph>Take a photo of your workout or progress</Paragraph>
            <Button 
              mode="outlined" 
              onPress={() => photoCapture()}
              style={styles.button}
              /* disabled={groups.length === 0} */
            >
              Take Photo
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
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
});
