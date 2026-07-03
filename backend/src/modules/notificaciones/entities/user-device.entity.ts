import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('user_devices')
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'push_token', type: 'varchar', length: 255, unique: true })
  pushToken: string;

  @Column({ type: 'varchar', length: 20, default: 'android' })
  platform: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
