import { Whatsapp } from '@wppconnect-team/wppconnect';
import { Repository } from 'typeorm';
import { MessageLog } from '../entities/MessageLog';
import schedule from 'node-schedule';

// Process phone number to the required format
export const processPhoneNumber = (phone: string): string => {
  return `${phone}@c.us`;
};

// Schedule message sending
export const scheduleMessage = (
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
