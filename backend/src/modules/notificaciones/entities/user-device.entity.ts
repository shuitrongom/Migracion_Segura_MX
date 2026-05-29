import { Entity, PrimaryColumn, Column, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity('user_devices')
export class UserDevice {
  @PrimaryColumn('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  pushToken: string;

  @Column({ type: 'varchar', length: 20, default: 'android' })
  platform: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
