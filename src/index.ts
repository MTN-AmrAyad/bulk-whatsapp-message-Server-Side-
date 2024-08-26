import express from 'express';
import { Whatsapp } from '@wppconnect-team/wppconnect';
import multer from 'multer';
import XLSX from 'xlsx';
import schedule from 'node-schedule';
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
import { Repository } from 'typeorm';
export const clientInstances: Map<number, Whatsapp> = new Map();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.use('/auth', authRoutes);

// Process phone number to the required format
const processPhoneNumber = (phone: string): string => {
  return `${phone}@c.us`;
};

// Schedule message sending
const scheduleMessage = (
  client: Whatsapp,
  phone: string,
  message: string,
  date: Date,
  messageLogRepository: Repository<MessageLog>,
) => {
  schedule.scheduleJob(date, () => {
    client
      .getStatus(phone)
      .then(() => {
        client.sendText(phone, message).then(async () => {
          console.log(`Message sent to ${phone}`);
          await messageLogRepository.save({
            phoneNumber: phone,
            message,
            sentAt: new Date(),
            status: 'sent',
          });
        });
      })
      .catch(async err => {
        console.error(`Failed to send message to ${phone}:`, err);
        await messageLogRepository.save({
          phoneNumber: phone,
          message,
          sentAt: new Date(),
          status: 'failed',
          error: err.message,
        });
      });
  });
};

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
    const scheduledDate = new Date(date);
    const messageLogRepository = AppDataSource.getRepository(MessageLog);

    let phoneNumbers: string[] = [];

    if (numbers && Array.isArray(numbers)) {
      phoneNumbers = numbers;
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

    phoneNumbers.forEach(phone => {
      console.log(`Scheduling message to ${phone} at ${scheduledDate}, ${message}`);
      const clientInstance = clientInstances.get(req.user!.id);
      if (!clientInstance) {
        return res.status(500).json({ error: 'WPPConnect client not initialized' });
      }
      scheduleMessage(clientInstance, phone, message, scheduledDate, messageLogRepository);
    });

    res.status(200).json({ message: 'Messages scheduled successfully' });
  } catch (error) {
    console.error('Error in /send-messages:', error);
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
// Initialize WPPConnect client
// let clientInstance: Whatsapp;

// create({
//   session: getConfig('SESSION_NAME')!,
//   autoClose: 0,
//   puppeteerOptions: {
//     headless: true,
//     args: ['--no-sandbox'],
//   },
// })
//   .then(client => {
//     clientInstance = client;
//     console.log('WPPConnect client initialized successfully');
//   })
//   .catch(error => {
//     console.error('Error initializing WPPConnect client:', error);
//   });
