import React from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStreakStore } from '../../store/streakStore';
import { useGroupStore } from '../../store/groupStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StreaksScreen() {
  const { streaks, fetchStreaks, isLoading } = useStreakStore();
  const { groups } = useGroupStore();
  const router = useRouter();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const flameAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    if (groups.length > 0) {
      fetchStreaks(groups[0].id);
    }
    
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    
    // Flame animation
    flameAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );
  }, [groups]);

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return ['#FFD700', '#FFA500']; // Gold
    if (streak >= 14) return ['#FF6B6B', '#FF8E8E']; // Red
    if (streak >= 7) return ['#4ECDC4', '#6ED5CD']; // Teal
    if (streak >= 3) return ['#45B7D1', '#6BC5D8']; // Blue
    return ['#95A5A6', '#BDC3C7']; // Gray
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return 'trophy';
    if (streak >= 14) return 'flame';
    if (streak >= 7) return 'star';
    if (streak >= 3) return 'flash';
    return 'time';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return 'Legendary! 🔥';
    if (streak >= 14) return 'On fire! 💪';
    if (streak >= 7) return 'Great job! ⭐';
    if (streak >= 3) return 'Keep going! 💫';
    return 'Getting started! 🌱';
  };

  // Item component so hooks are used in a component body
  const StreakItem = ({ item, index }: { item: any; index: number }) => {
    const cardAnim = useSharedValue(0);
    const flameScale = useSharedValue(1);

    React.useEffect(() => {
      cardAnim.value = withTiming(1, { duration: 600 });
      if (item.current_streak >= 7) {
        flameScale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          false
        );
      }
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardAnim.value,
      transform: [
        { translateY: interpolate(cardAnim.value, [0, 1], [50, 0]) },
        { scale: interpolate(cardAnim.value, [0, 1], [0.9, 1]) }
      ],
    }));

    const flameStyleLocal = useAnimatedStyle(() => ({
      transform: [{ scale: flameScale.value }],
    }));

    const isTopThree = index < 3;
    const streakColors = getStreakColor(item.current_streak);
    const streakIcon = getStreakIcon(item.current_streak);
    const streakMessage = getStreakMessage(item.current_streak);

    return (
      <Animated.View style={[styles.streakCardContainer, cardStyle]}>
        <BlurView intensity={20} tint="dark" style={styles.streakCard}>
          <LinearGradient
            colors={isTopThree ? streakColors as any : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.streakCardGradient}
          >
            {isTopThree && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
            )}

            <View style={styles.streakHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {(item.display_name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.display_name || 'Unknown User'}</Text>
                  <Text style={styles.streakMessage}>{streakMessage}</Text>
                </View>
              </View>

              <Animated.View style={[styles.streakIconContainer, flameStyleLocal]}>
                <Ionicons 
                  name={streakIcon as any} 
                  size={32} 
                  color={isTopThree ? 'white' : '#FFA500'} 
                />
              </Animated.View>
            </View>

            <View style={styles.streakStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.current_streak}</Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.longest_streak}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {item.last_checkin_date 
                    ? Math.floor((Date.now() - new Date(item.last_checkin_date).getTime()) / (1000 * 60 * 60 * 24))
                    : 'N/A'
                  }
                </Text>
                <Text style={styles.statLabel}>Days Ago</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((item.current_streak / 30) * 100, 100)}%`,
                      backgroundColor: isTopThree ? 'rgba(255, 255, 255, 0.8)' : '#FFA500'
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {item.current_streak >= 30 ? 'Max Level!' : `${30 - item.current_streak} days to legendary`}
              </Text>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    );
  };

  const renderStreak = ({ item, index }: { item: any; index: number }) => {
    return <StreakItem item={item} index={index} />;
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameAnim.value + 1 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E', '#0F3460']}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.header, containerStyle]}>
            <View style={styles.titleContainer}>
              <Animated.View style={[styles.flameContainer, flameStyle]}>
                <Ionicons name="flame" size={40} color="#FF6B6B" />
              </Animated.View>
              <View>
                <Text style={styles.title}>Streak Leaderboard</Text>
                <Text style={styles.subtitle}>Keep the momentum going!</Text>
              </View>
            </View>
            
            {groups.length > 0 && (
              <Animated.View style={[styles.groupInfo, pulseStyle]}>
                <Ionicons name="people" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.groupInfoText}>
                  {groups[0].name} • {streaks.length} members
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {groups.length === 0 ? (
            <Animated.View style={[styles.emptyContainer, containerStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.emptyCardGradient}
                >
                  <Ionicons name="flame-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.emptyTitle}>No streaks yet</Text>
                  <Text style={styles.emptyDescription}>
                    Join a group and start checking in to build your streak!
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyButton}
                    onPress={() => router.push('/(tabs)/groups')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#00D4FF', '#0099CC']}
                      style={styles.emptyButtonGradient}
                    >
                      <Text style={styles.emptyButtonText}>Join a Group</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          ) : (
            <FlatList
              data={streaks}
              renderItem={renderStreak}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Animated.View style={[styles.emptyContainer, containerStyle]}>
                  <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                      style={styles.emptyCardGradient}
                    >
                      <Ionicons name="fitness-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                      <Text style={styles.emptyTitle}>No check-ins yet</Text>
                      <Text style={styles.emptyDescription}>
                        Start checking in to build your streak!
                      </Text>
                      <TouchableOpacity 
                        style={styles.emptyButton}
                        onPress={() => router.push('/(tabs)/checkin')}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#00D4FF', '#0099CC']}
                          style={styles.emptyButtonGradient}
                        >
                          <Text style={styles.emptyButtonText}>Check In Now</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </LinearGradient>
                  </BlurView>
                </Animated.View>
              }
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flameContainer: {
    marginRight: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  groupInfoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginLeft: 6,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  streakCardContainer: {
    marginBottom: 16,
  },
  streakCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakCardGradient: {
    padding: 20,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  streakMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: width - 48,
  },
  emptyCardGradient: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
