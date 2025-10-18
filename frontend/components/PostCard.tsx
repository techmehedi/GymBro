import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Avatar, Chip } from 'react-native-paper';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  showGroupName?: boolean;
}

export default function PostCard({ post, onDelete, showGroupName = false }: PostCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={32} 
              label={post.display_name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Title style={styles.userName}>{post.display_name || 'Unknown User'}</Title>
              <Paragraph style={styles.timestamp}>
                {formatDate(post.created_at)}
              </Paragraph>
            </View>
          </View>
          
          <Chip 
            mode="outlined" 
            style={styles.typeChip}
            textStyle={styles.typeText}
          >
            {post.post_type}
          </Chip>
        </View>
        
        {post.content && (
          <Paragraph style={styles.content}>
            {post.content}
          </Paragraph>
        )}
        
        {post.image_url && (
          <View style={styles.imageContainer}>
            <Paragraph style={styles.imagePlaceholder}>
              📸 Photo attached
            </Paragraph>
          </View>
        )}
        
        {showGroupName && post.group_name && (
          <Paragraph style={styles.groupName}>
            in {post.group_name}
          </Paragraph>
        )}
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
  },
  typeChip: {
    backgroundColor: '#f0f9ff',
  },
  typeText: {
    fontSize: 12,
    color: '#0ea5e9',
  },
  content: {
    marginBottom: 12,
    lineHeight: 20,
  },
  imageContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  imagePlaceholder: {
    textAlign: 'center',
    color: '#64748b',
  },
  groupName: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});
