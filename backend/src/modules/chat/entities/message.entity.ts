import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'uuid' })
  receiverId: string;

  @Column({ type: 'uuid', nullable: true })
  tramiteId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'text' })
  type: string; // text, image, file

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
