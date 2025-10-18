import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';
interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function Header({ title, showBack = true, onBackPress }: HeaderProps) {
  const router = useRouter();
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      {showBack && (
         <Button 
           mode="text" 
           onPress={handleBackPress}
           icon="arrow-left"
           style={styles.backButton}
           textColor="#000000"
         >
           Back
         </Button>
      )}
      <Title style={styles.headerTitle}>{title}</Title>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    textAlign: 'center'
  },
  backButton: {
    marginRight: 20,
    fontSize: 20,
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
});
