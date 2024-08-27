import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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
}
