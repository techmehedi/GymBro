import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

function TabLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const tabBarHeight = useSharedValue(0);

  const animatedTabBarStyle = useAnimatedStyle(() => {
    return {
      height: tabBarHeight.value,
      opacity: tabBarHeight.value > 0 ? 1 : 0,
    };
  });

  React.useEffect(() => {
    tabBarHeight.value = withSpring(Platform.OS === 'ios' ? 90 : 70, {
      damping: 20,
      stiffness: 300,
    });
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 90 : 70,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => (
            <AnimatedBlurView
              intensity={20}
              tint="dark"
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                animatedTabBarStyle,
              ]}
            />
          ),
          tabBarActiveTintColor: '#00D4FF',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedIcon
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: 'Groups',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedIcon
                name={focused ? 'people' : 'people-outline'}
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="checkin"
          options={{
            title: 'Check In',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedIcon
                name={focused ? 'camera' : 'camera-outline'}
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="streaks"
          options={{
            title: 'Streaks',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedIcon
                name={focused ? 'flame' : 'flame-outline'}
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedIcon
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default TabLayout;

function AnimatedIcon({ name, size, color, focused }: { name: string; size: number; color: string; focused: boolean }) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
      rotation.value = withTiming(360, { duration: 300 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  );
}
