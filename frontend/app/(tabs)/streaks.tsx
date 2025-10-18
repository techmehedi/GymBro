import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { useStreakStore } from '../../store/streakStore';
import { useGroupStore } from '../../store/groupStore';

export default function StreaksScreen() {
  const { streaks, fetchStreaks, isLoading } = useStreakStore();
  const { groups } = useGroupStore();

  React.useEffect(() => {
    if (groups.length > 0) {
      fetchStreaks(groups[0].id); // Fetch streaks for first group
    }
  }, [groups]);

  const renderStreak = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.streakHeader}>
          <Title>{item.display_name || 'Unknown User'}</Title>
          <Chip 
            mode="outlined" 
            style={styles.streakChip}
            textStyle={styles.streakText}
          >
            {item.current_streak} day streak
          </Chip>
        </View>
        <Paragraph>
          Longest streak: {item.longest_streak} days
        </Paragraph>
        {item.last_checkin_date && (
          <Paragraph style={styles.lastCheckin}>
            Last check-in: {new Date(item.last_checkin_date).toLocaleDateString()}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title>Streak Leaderboard</Title>
        <Paragraph>Keep the momentum going!</Paragraph>
      </View>

      <FlatList
        data={streaks}
        renderItem={renderStreak}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title>No streaks yet</Title>
              <Paragraph>
                Join a group and start checking in to build your streak!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  list: {
    padding: 20,
    gap: 16,
  },
  card: {
    elevation: 2,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  emptyCard: {
    elevation: 2,
    backgroundColor: '#ffffff',
    marginTop: 40,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakChip: {
    backgroundColor: '#fef3c7',
  },
  streakText: {
    color: '#d97706',
    fontWeight: 'bold',
  },
  lastCheckin: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
});
