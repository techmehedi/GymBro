import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Avatar, Chip } from 'react-native-paper';
import { Streak } from '../types';

interface StreakCardProps {
  streak: Streak;
  rank?: number;
}

export default function StreakCard({ streak, rank }: StreakCardProps) {
  const getStreakEmoji = (streakCount: number) => {
    if (streakCount >= 30) return '🔥🔥🔥';
    if (streakCount >= 14) return '🔥🔥';
    if (streakCount >= 7) return '🔥';
    if (streakCount >= 3) return '💪';
    return '🌱';
  };

  const getStreakColor = (streakCount: number) => {
    if (streakCount >= 30) return '#dc2626';
    if (streakCount >= 14) return '#ea580c';
    if (streakCount >= 7) return '#d97706';
    if (streakCount >= 3) return '#059669';
    return '#64748b';
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {rank && (
              <View style={styles.rankContainer}>
                <Title style={styles.rank}>#{rank}</Title>
              </View>
            )}
            <Avatar.Text 
              size={40} 
              label={streak.display_name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Title style={styles.userName}>{streak.display_name || 'Unknown User'}</Title>
              <Paragraph style={styles.streakInfo}>
                {getStreakEmoji(streak.current_streak)} {streak.current_streak} day streak
              </Paragraph>
            </View>
          </View>
          
          <Chip 
            mode="outlined" 
            style={[styles.streakChip, { backgroundColor: getStreakColor(streak.current_streak) + '20' }]}
            textStyle={[styles.streakText, { color: getStreakColor(streak.current_streak) }]}
          >
            {streak.current_streak}
          </Chip>
        </View>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Paragraph style={styles.statLabel}>Longest Streak</Paragraph>
            <Title style={styles.statValue}>{streak.longest_streak}</Title>
          </View>
          
          {streak.last_checkin_date && (
            <View style={styles.statItem}>
              <Paragraph style={styles.statLabel}>Last Check-in</Paragraph>
              <Paragraph style={styles.statValue}>
                {new Date(streak.last_checkin_date).toLocaleDateString()}
              </Paragraph>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankContainer: {
    marginRight: 12,
    minWidth: 30,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  avatar: {
    backgroundColor: '#0ea5e9',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    marginBottom: 4,
  },
  streakInfo: {
    fontSize: 14,
    color: '#64748b',
  },
  streakChip: {
    minWidth: 40,
  },
  streakText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
