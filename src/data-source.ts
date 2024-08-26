import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { getConfig } from 'dotenv-handler';
import { MessageLog } from './entities/MessageLog';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: getConfig('DB_HOST'),
  port: Number(getConfig('DB_PORT')),
  username: getConfig('DB_USER'),
  password: getConfig('DB_PASSWORD'),
  database: getConfig('DB_NAME'),
  synchronize: true,
  logging: false,
  entities: [User, MessageLog],
  migrations: [],
  subscribers: [],
});
