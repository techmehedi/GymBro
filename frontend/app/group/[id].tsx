import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../lib/supabase';
import * as Clipboard from 'expo-clipboard';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { groups } = useGroupStore();
  const { user } = useAuthStore();

  const group = groups.find(g => g.id === id);

  const fade = useSharedValue(0);
  React.useEffect(() => {
    fade.value = withTiming(1, { duration: 300 });
  }, []);
  const containerStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  // Chat state
  const [message, setMessage] = React.useState('');
  const [posts, setPosts] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const loadPosts = React.useCallback(async () => {
    if (!id) return;
    try {
      setRefreshing(true);
      const res = await apiClient.getGroupPosts(String(id), 50, 0) as any;
      setPosts(res.posts || []);
    } catch (e) {
      // Silent for now
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSend = async () => {
    if (!message.trim() || !id) return;
    try {
      setSending(true);
      await apiClient.createPost({
        group_id: String(id),
        content: message.trim(),
        post_type: 'motivation',
      });
      setMessage('');
      await loadPosts();
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const copyInvite = async () => {
    if (!group?.invite_code) return;
    await Clipboard.setStringAsync(group.invite_code);
    Alert.alert('Copied', 'Invite code copied to clipboard');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E', '#0F3460']} style={styles.background}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.header, containerStyle]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>{group?.name || 'Group'}</Text>
            <TouchableOpacity onPress={copyInvite} style={styles.copyButton}>
              <Ionicons name="copy" size={18} color="white" />
              <Text style={styles.copyText}>Copy Code</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.content, containerStyle]}>
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              refreshing={refreshing}
              onRefresh={loadPosts}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }) => {
                const isCheckin = item.post_type === 'checkin';
                const isOwn = item.user_id === user?.id;
                const bubbleStyle = [styles.messageBubble, isOwn ? styles.messageOwn : styles.messageOther];
                return (
                  <View style={styles.messageRow}>
                    <BlurView style={bubbleStyle} intensity={15} tint="dark">
                      <Text style={styles.messageAuthor}>{item.display_name || 'Member'}</Text>
                      {isCheckin ? (
                        <Text style={styles.messageText}>
                          just checked in{item.content ? `: ${item.content}` : '!'}
                        </Text>
                      ) : (
                        <Text style={styles.messageText}>{item.content}</Text>
                      )}
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.messageImage} />
                      ) : null}
                      <Text style={styles.messageMeta}>{new Date(item.created_at).toLocaleString()}</Text>
                    </BlurView>
                  </View>
                );
              }}
              ListEmptyComponent={
                <BlurView intensity={20} tint="dark" style={styles.card}>
                  <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={styles.cardGradient}>
                    <Text style={styles.sectionTitle}>No messages yet</Text>
                    <Text style={styles.codeText}>Be the first to say hi 👋</Text>
                  </LinearGradient>
                </BlurView>
              }
            />
          </Animated.View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Message your group"
              placeholderTextColor="rgba(255,255,255,0.6)"
              editable={!sending}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={!message.trim() || sending}>
              <LinearGradient colors={message.trim() ? ['#00D4FF', '#0099CC'] : ['#666', '#555']} style={styles.sendGradient}>
                <Ionicons name="send" size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 6 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  copyText: { color: 'white', fontSize: 12, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  cardGradient: { padding: 16 },
  sectionTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 6 },
  codeText: { color: 'white', fontSize: 16, fontWeight: '600' },
  inputRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sendButton: { borderRadius: 24, overflow: 'hidden' },
  sendGradient: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24 },
  messageRow: { paddingHorizontal: 16, paddingVertical: 8 },
  messageBubble: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  messageOwn: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,212,255,0.15)' },
  messageOther: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)' },
  messageAuthor: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  messageText: { color: 'white', fontSize: 16 },
  messageMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 6 },
  messageImage: { marginTop: 8, width: 200, height: 120, borderRadius: 8 },
});


