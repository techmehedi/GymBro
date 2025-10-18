import React from 'react';
import { Slot, Stack, usePathname, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    // If not authenticated, keep user in auth/start routes
    const inAuth = pathname?.startsWith('/auth') || pathname === '/';
    if (!isAuthenticated && !inAuth) {
      router.replace('/auth/sign-in');
    }
  }, [isAuthenticated, pathname]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Slot />
    </GestureHandlerRootView>
  );
}