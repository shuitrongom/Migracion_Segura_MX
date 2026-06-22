import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/message.entity';
import { AdminNotifierService } from '../notificaciones/admin-notifier.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly adminNotifier: AdminNotifierService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      client.join(`user_${userId}`);
      this.logger.log(`Usuario conectado: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.connectedUsers.entries()].find(([, socketId]) => socketId === client.id)?.[0];
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`Usuario desconectado: ${userId}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string; receiverId: string; content: string; tramiteId?: string },
  ) {
    const message = this.messageRepository.create({
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      tramiteId: data.tramiteId || undefined,
      type: 'text',
      read: false,
    });

    const saved = await this.messageRepository.save(message);

    // Enviar al receptor si está conectado
    this.server.to(`user_${data.receiverId}`).emit('newMessage', saved);

    // Confirmar al emisor
    client.emit('messageSent', saved);

    // Notificar al admin si el mensaje viene de un cliente
    try {
      const sender = await this.messageRepository.manager.query(
        `SELECT role, full_name FROM users WHERE id = $1 LIMIT 1`, [data.senderId]
      );
      if (sender?.[0]?.role === 'cliente') {
        await this.adminNotifier.nuevoMensajeChat(
          sender[0].full_name || 'Cliente',
          data.content,
        );
      }
    } catch {}

    return saved;
  }

  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; otherUserId: string; limit?: number },
  ) {
    const messages = await this.messageRepository.find({
      where: [
        { senderId: data.userId, receiverId: data.otherUserId },
        { senderId: data.otherUserId, receiverId: data.userId },
      ],
      order: { createdAt: 'DESC' },
      take: data.limit || 50,
    });

    client.emit('history', messages.reverse());
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageIds: string[] },
  ) {
    await this.messageRepository.update(data.messageIds, { read: true });
    client.emit('messagesRead', data.messageIds);
  }
}
