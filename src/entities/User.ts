import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MessageLog } from './MessageLog';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  sessionId?: string;

  @OneToMany(() => MessageLog, messageLog => messageLog.user)
  messageLogs!: MessageLog[];
}
