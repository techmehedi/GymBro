import { TouchableOpacity } from 'react-native';
import { HapticFeedbackTypes, Platform } from 'expo-haptics';
import * as Haptics from 'expo-haptics';

export function HapticTab({ children, ...props }: any) {
  return (
    <TouchableOpacity
      {...props}
      onPress={(ev) => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPress?.(ev);
      }}
    >
      {children}
    </TouchableOpacity>
  );
}
