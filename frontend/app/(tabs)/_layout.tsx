import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}
