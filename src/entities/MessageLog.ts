import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
@Entity()
export class MessageLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  phoneNumber!: string;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn()
  sentAt!: Date;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  error?: string;

  @ManyToOne(() => User, user => user.messageLogs)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  user_id!: number;
}
