import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme';

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
  const [asesorName, setAsesorName] = useState('Tu Asesor');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const socketRef = useRef<any>(null);
  const { colors, mode } = useTheme();

  useEffect(() => {
    initChat();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    return () => {
      // Limpiar socket al salir
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('newMessage');
        socketRef.current.off('messageSent');
        socketRef.current.off('history');
      }
    };
  }, []);

  const initChat = async () => {
    try {
      const userData = await storage.getItem('user_data');
      if (!userData) {
        setError('No se encontró tu sesión. Inicia sesión de nuevo.');
        setLoading(false);
        return;
      }
      const user = JSON.parse(userData);
      setUserId(user.id);

      // Obtener asesor asignado desde los trámites
      const token = await storage.getItem('access_token');
      let targetId = '';
      let targetName = 'Tu Asesor';

      try {
        const res = await apiFetch('/tramites?page=1&limit=5');
        if (res.ok) {
          const data = await res.json();
          const tramite = data?.data?.find((t: any) => t.asesorId);
          if (tramite?.asesorId) {
            targetId = tramite.asesorId;
            targetName = tramite.asesor?.fullName || 'Tu Asesor';
          }
        }
      } catch {}

      // Si no hay asesor asignado, buscar admin
      if (!targetId) {
        try {
          const res = await apiFetch('/users/asesores');
          if (res.ok) {
            const asesores = await res.json();
            if (asesores?.length > 0) {
              targetId = asesores[0].id;
              targetName = asesores[0].fullName || 'Asesor';
            }
          }
        } catch {}
      }

      if (!targetId) {
        setAsesorName('Soporte');
        setError(null);
        setLoading(false);
        return;
      }

      setAsesorId(targetId);
      setAsesorName(targetName);

      // Intentar conectar socket con timeout
      try {
        const { connectChat, getHistory, markMessagesRead, sendMessage: socketSend } = await import('@/lib/chat');
        const socket = connectChat(user.id);
        socketRef.current = socket;

        // Timeout de 8 segundos para la conexión
        const timeout = setTimeout(() => {
          if (loading) {
            setLoading(false);
            setConnected(false);
          }
        }, 8000);

        socket.on('connect', () => {
          setConnected(true);
          clearTimeout(timeout);
          getHistory(user.id, targetId);
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('newMessage', (msg: Message) => {
          setMessages(prev => [...prev, msg]);
          if (msg.receiverId === user.id) {
            markMessagesRead([msg.id]);
          }
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        socket.on('messageSent', (msg: Message) => {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setSending(false);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        socket.on('history', (history: Message[]) => {
          setMessages(Array.isArray(history) ? history : []);
          setLoading(false);
          clearTimeout(timeout);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
        });

        // Si después de 8s no hay history, mostrar la pantalla vacía
        setTimeout(() => {
          setLoading(false);
        }, 8000);

      } catch (socketErr) {
        // Socket no disponible — fallback a modo sin chat en tiempo real
        console.log('[CHAT] Socket no disponible, modo offline');
        setLoading(false);
        setConnected(false);
      }
    } catch (err) {
      setError('Error al inicializar el chat.');
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !userId) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Agregar mensaje optimistamente a la UI
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: userId,
      receiverId: asesorId || 'admin',
      content: messageText,
      type: 'text',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Enviar via socket si está conectado
    if (connected && socketRef.current) {
      try {
        const { sendMessage: socketSend } = await import('@/lib/chat');
        socketSend({
          senderId: userId,
          receiverId: asesorId || 'admin',
          content: messageText,
        });
      } catch {
        setSending(false);
      }
    } else {
      // Fallback: enviar como notificación/mensaje via API REST
      try {
        await apiFetch('/notificaciones', {
          method: 'POST',
          body: JSON.stringify({
            tipo: 'mensaje_chat',
            metadata: { mensaje: messageText, destinatarioId: asesorId, fecha: new Date().toISOString() },
          }),
        });
      } catch {}
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === userId;
    const showDate = index === 0 || formatDate(messages[index - 1]?.createdAt) !== formatDate(item.createdAt);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateText, { color: colors.textMuted, backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isMe ? [styles.myMessage, { backgroundColor: mode === 'dark' ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)' }]
                : [styles.theirMessage, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }],
        ]}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: colors.textMuted }]}>{formatTime(item.createdAt)}</Text>
            {isMe && <Text style={styles.readStatus}>{item.read ? '✓✓' : '✓'}</Text>}
          </View>
        </View>
      </View>
    );
  }, [userId, messages, colors, mode]);

  // Estado de carga
  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Conectando con tu asesor...</Text>
      </LinearGradient>
    );
  }

  // Estado de error
  if (error) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.loadingContainer}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>← Volver</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>{asesorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>{asesorName}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, connected ? styles.statusOnline : styles.statusOffline]} />
              <Text style={[styles.statusText, { color: colors.textMuted }]}>
                {connected ? 'En línea' : 'Mensajes se enviarán cuando haya conexión'}
              </Text>
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
          contentContainerStyle={[styles.messagesList, messages.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={[styles.emptyChatIcon, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
                <Text style={{ fontSize: 40 }}>💬</Text>
              </View>
              <Text style={[styles.emptyChatTitle, { color: colors.text }]}>Inicia la conversación</Text>
              <Text style={[styles.emptyChatText, { color: colors.textMuted }]}>
                Escribe un mensaje a tu asesor para resolver cualquier duda sobre tu trámite migratorio.
              </Text>
              <View style={styles.tipsContainer}>
                <Text style={[styles.tipText, { color: colors.textMuted }]}>💡 Puedes preguntar sobre:</Text>
                <Text style={[styles.tipItem, { color: colors.textSecondary }]}>• Estado de tu trámite</Text>
                <Text style={[styles.tipItem, { color: colors.textSecondary }]}>• Documentos faltantes</Text>
                <Text style={[styles.tipItem, { color: colors.textSecondary }]}>• Fechas y plazos</Text>
                <Text style={[styles.tipItem, { color: colors.textSecondary }]}>• Costos y pagos</Text>
              </View>
            </View>
          }
        />

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgInput, borderColor: colors.borderLight, color: colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <LinearGradient
                colors={inputText.trim() ? ['#f59e0b', '#d97706'] : [colors.bgCard, colors.bgCard]}
                style={styles.sendBtnGradient}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.sendBtnText, !inputText.trim() && { color: colors.textMuted }]}>➤</Text>
                )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, textAlign: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  errorBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b' },
  errorBtnText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 22, fontWeight: '600' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#f59e0b', fontSize: 16, fontWeight: '700' },
  headerName: { fontSize: 16, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusOnline: { backgroundColor: '#22c55e' },
  statusOffline: { backgroundColor: '#9CA3AF' },
  statusText: { fontSize: 11, flex: 1 },

  // Messages
  messagesList: { paddingHorizontal: 16, paddingVertical: 12 },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateText: { fontSize: 11, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },

  messageBubble: { maxWidth: '80%', borderRadius: 18, padding: 12, marginBottom: 6 },
  myMessage: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  messageTime: { fontSize: 10 },
  readStatus: { fontSize: 10, color: 'rgba(245,158,11,0.7)' },

  // Empty
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyChatIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1 },
  emptyChatTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyChatText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  tipsContainer: { alignSelf: 'stretch', gap: 6, paddingHorizontal: 16 },
  tipText: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  tipItem: { fontSize: 13, lineHeight: 20 },

  // Input
  inputContainer: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { fontSize: 18, color: '#ffffff' },
});
