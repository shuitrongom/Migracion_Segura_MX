import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '@/lib/storage';
import { connectChat, sendMessage, getHistory, getSocket, markMessagesRead } from '@/lib/chat';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState('');
  const [asesorId, setAsesorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initChat();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => { /* socket stays connected for background messages */ };
  }, []);

  const initChat = async () => {
    const userData = await storage.getItem('user_data');
    if (!userData) { setLoading(false); return; }
    const user = JSON.parse(userData);
    setUserId(user.id);

    // Conectar socket
    const socket = connectChat(user.id);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Escuchar mensajes nuevos
    socket.on('newMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      // Marcar como leído si es para mí
      if (msg.receiverId === user.id) {
        markMessagesRead([msg.id]);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('messageSent', (msg: Message) => {
      setMessages(prev => {
        // Evitar duplicados
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    // Cargar historial - buscar asesor asignado
    socket.on('history', (history: Message[]) => {
      setMessages(history);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    });

    // Obtener asesor del primer trámite o admin
    try {
      const res = await fetch(`https://api.migracionseguramx.com/api/v1/tramites?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${await storage.getItem('access_token')}` },
      });
      const data = await res.json();
      const tramite = data?.data?.[0];
      const targetId = tramite?.asesorId || 'admin';
      setAsesorId(targetId);
      getHistory(user.id, targetId);
    } catch {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !userId || !asesorId) return;
    sendMessage({
      senderId: userId,
      receiverId: asesorId,
      content: inputText.trim(),
    });
    setInputText('');
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === userId;
    const showDate = index === 0 || formatDate(messages[index - 1]?.createdAt) !== formatDate(item.createdAt);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>{formatTime(item.createdAt)}</Text>
            {isMe && <Text style={styles.readStatus}>{item.read ? '✓✓' : '✓'}</Text>}
          </View>
        </View>
      </View>
    );
  }, [userId, messages]);

  if (loading) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Conectando chat...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>G</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Tu Gestor</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, connected && styles.statusOnline]} />
              <Text style={styles.statusText}>{connected ? 'En línea' : 'Conectando...'}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Messages */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={styles.emptyChatIcon}>
                <Text style={{ fontSize: 40 }}>💬</Text>
              </View>
              <Text style={styles.emptyChatTitle}>Inicia la conversación</Text>
              <Text style={styles.emptyChatText}>Escribe un mensaje a tu gestor para resolver dudas sobre tu trámite</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? ['#f59e0b', '#d97706'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                style={styles.sendBtnGradient}
              >
                <Text style={styles.sendBtnText}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#f59e0b', fontSize: 16, fontWeight: '700' },
  headerName: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  statusOnline: { backgroundColor: '#22c55e' },
  statusText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  // Messages
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },

  messageBubble: { maxWidth: '78%', borderRadius: 16, padding: 12, marginBottom: 6 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: 'rgba(245,158,11,0.15)', borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  myMessageText: { color: '#ffffff' },
  theirMessageText: { color: 'rgba(255,255,255,0.85)' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  messageTime: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  myMessageTime: { color: 'rgba(245,158,11,0.6)' },
  readStatus: { fontSize: 10, color: 'rgba(245,158,11,0.6)' },

  // Empty
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyChatIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyChatTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  emptyChatText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },

  // Input
  inputContainer: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#ffffff', maxHeight: 100 },
  sendBtn: { width: 44, height: 44 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { fontSize: 18, color: '#ffffff' },
});
