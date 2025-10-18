import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Avatar, Chip } from 'react-native-paper';
import { Group } from '../types';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  memberCount?: number;
}

export default function GroupCard({ group, onPress, memberCount }: GroupCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>{group.name}</Title>
          <Chip mode="outlined" style={styles.chip}>
            {memberCount || 0} members
          </Chip>
        </View>
        
        <Paragraph style={styles.description}>
          {group.description || 'No description available'}
        </Paragraph>
        
        <View style={styles.footer}>
          <Paragraph style={styles.inviteCode}>
            Invite Code: {group.invite_code}
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  chip: {
    backgroundColor: '#f0f9ff',
  },
  description: {
    color: '#64748b',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
});
