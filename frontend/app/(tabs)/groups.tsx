import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph, FAB } from 'react-native-paper';
import { useGroupStore } from '../../store/groupStore';
import { Group } from '../../types';

export default function GroupsScreen() {
  const { groups, fetchGroups, isLoading, createGroup } = useGroupStore();

  React.useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    try {
      await createGroup({
        name: 'My Fitness Group',
        description: 'Let\'s get fit together!',
        max_members: 5,
      });
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>{item.description || 'No description'}</Paragraph>
        <Paragraph style={styles.memberCount}>
          {item.max_members} members max
        </Paragraph>
        <Button 
          mode="contained" 
          onPress={() => {/* Navigate to group details */}}
          style={styles.button}
        >
          View Group
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title>Your Groups</Title>
        <Paragraph>Stay motivated with your fitness buddies</Paragraph>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title>No groups yet</Title>
              <Paragraph>Create or join a group to get started!</Paragraph>
              <Button 
                mode="contained" 
                onPress={handleCreateGroup}
                style={styles.button}
              >
                Create Group
              </Button>
            </Card.Content>
          </Card>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateGroup}
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
  button: {
    marginTop: 12,
  },
  memberCount: {
    color: '#64748b',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0ea5e9',
  },
});
