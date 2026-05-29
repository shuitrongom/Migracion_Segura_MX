import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('app_config')
export class AppConfig {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'varchar', length: 500 })
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
