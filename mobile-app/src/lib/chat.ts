import { io, Socket } from 'socket.io-client';
import { API_URL } from './config';

let socket: Socket | null = null;

const CHAT_URL = API_URL.replace('/api/v1', '');

export function connectChat(userId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(`${CHAT_URL}/chat`, {
    query: { userId },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Chat conectado');
  });

  socket.on('disconnect', () => {
    console.log('Chat desconectado');
  });

  return socket;
}

export function disconnectChat() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function sendMessage(data: { senderId: string; receiverId: string; content: string; tramiteId?: string }) {
  if (socket?.connected) {
    socket.emit('sendMessage', data);
  }
}

export function getHistory(userId: string, otherUserId: string) {
  if (socket?.connected) {
    socket.emit('getHistory', { userId, otherUserId, limit: 50 });
  }
}

export function markMessagesRead(messageIds: string[]) {
  if (socket?.connected) {
    socket.emit('markRead', { messageIds });
  }
}
