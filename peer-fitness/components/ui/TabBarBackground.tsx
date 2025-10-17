import { View } from 'react-native';
import { BlurView } from 'expo-blur';

export function TabBarBackground() {
  return (
    <BlurView
      intensity={95}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}
    />
  );
}
