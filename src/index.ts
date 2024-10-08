import express from 'express';
import { Whatsapp } from '@wppconnect-team/wppconnect';
import multer from 'multer';
import XLSX from 'xlsx';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { loadConfig } from 'dotenv-handler';
import 'reflect-metadata';
import { MessageLog } from './entities/MessageLog';

const envPath = path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`);
loadConfig(envPath, {
  required: ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'],
});

import { AuthenticatedRequest, authMiddleware } from './middlewares/auth';
import authRoutes from './routes/auth';
import { AppDataSource } from './data-source';
import { processPhoneNumber, scheduleFileMessage, scheduleMessage } from './utils/messaging';
import { MoreThan, MoreThanOrEqual } from 'typeorm';

export const clientInstances: Map<number, Whatsapp> = new Map();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.use('/auth', authRoutes);

// Route to handle message sending
app.post('/send-messages', authMiddleware, upload.single('file'), (req: AuthenticatedRequest, res) => {
  try {
    const {
      numbers,
      message,
      date,
    }: {
      numbers: string[];
      message: string;
      date: string;
    } = req.body;
    const user_id = req.user!.id;
    const scheduledDate = new Date(date);
    const messageLogRepository = AppDataSource.getRepository(MessageLog);

    let phoneNumbers: string[] = [];

    if (numbers && Array.isArray(numbers)) {
      phoneNumbers = numbers.map(phone => processPhoneNumber(phone));
    } else if (req.file) {
      const filePath = path.resolve(req.file.path);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: { phone: string }[] = XLSX.utils.sheet_to_json(sheet);
      phoneNumbers = data.map(row => processPhoneNumber(row.phone));
      console.log('Phone numbers:', phoneNumbers);
      // Remove the uploaded file after processing
      fs.unlinkSync(filePath);
    } else {
      return res.status(400).json({ error: 'No numbers provided' });
    }

    phoneNumbers.forEach((phone, index) => {
      const clientInstance = clientInstances.get(req.user!.id);
      if (!clientInstance) {
        return res.status(500).json({ error: 'WPPConnect client not initialized' });
      }
      // add delay to avoid blocking the server by adding time to the scheduled date
      const delay = index * 1000 + Math.floor(index / 10) * 2000; // 1 second delay for every 10 messages
      const scheduledDateWithDelay = new Date(scheduledDate.getTime() + delay);
      scheduleFileMessage(clientInstance, phone, message, scheduledDateWithDelay, messageLogRepository, user_id);
      // scheduleMessage(clientInstance, phone, message, scheduledDateWithDelay, messageLogRepository, user_id);
    });
    console.log(`Scheduled ${phoneNumbers.length} messages, starting at ${scheduledDate}`);
    res.status(200).json({ message: 'Messages scheduled successfully' });
  } catch (error) {
    console.error('Error in /send-messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/logs', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const messageLogRepository = AppDataSource.getRepository(MessageLog);
    const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const minDate = req.query.minDate ? new Date(new Date(req.query.minDate as string)) : undefined;
    const logs = await messageLogRepository.find({
      where: { user_id: req.user?.id, sentAt: minDate ? MoreThanOrEqual(minDate) : MoreThan(new Date(0)) },
      order: { sentAt: 'DESC' },
      skip,
      take: limit,
    });
    const total = await messageLogRepository.count({
      where: { user_id: req.user?.id, sentAt: minDate ? MoreThanOrEqual(minDate) : MoreThan(new Date(0)) },
    });
    res.status(200).json({ logs, total });
  } catch (error) {
    console.error('Error in /logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await AppDataSource.initialize();
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
  }
});
