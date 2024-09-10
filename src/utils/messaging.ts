import { Whatsapp } from '@wppconnect-team/wppconnect';
import { Repository } from 'typeorm';
import { MessageLog } from '../entities/MessageLog';
import schedule from 'node-schedule';
import path from 'path';
// Process phone number to the required format
export const processPhoneNumber = (phone: string): string => {
  if (phone) {
    phone = phone
      .toString()
      .trim()
      .replace(/[^0-9]/g, '');
  }
  return `${phone}@c.us`;
};

// Schedule message sending
export const scheduleFileMessage = (
  client: Whatsapp,
  phone: string,
  message: string,
  date: Date,
  messageLogRepository: Repository<MessageLog>,
  user_id: number,
) => {
  schedule.scheduleJob(date, () => {
    const filePath = path.join(__dirname, '../../قرار ادارى .pdf');
    client
      .getStatus(phone)
      .then(() => {
        client
          .sendFile(phone, filePath, {
            caption: message,
          })
          .then(async () => {
            console.log(`Message sent to ${phone}`);
            await messageLogRepository.save({
              phoneNumber: phone,
              message,
              sentAt: new Date(),
              status: 'sent',
              user_id,
            });
          });
      })
      .catch(async err => {
        // console.error(`Failed to send message to ${phone}:`, err);
        await messageLogRepository.save({
          phoneNumber: phone,
          message,
          sentAt: new Date(),
          status: 'failed',
          error: err.message,
          user_id,
        });
      });
  });
};

export const scheduleMessage = (
  client: Whatsapp,
  phone: string,
  message: string,
  date: Date,
  messageLogRepository: Repository<MessageLog>,
  user_id: number,
) => {
  schedule.scheduleJob(date, () => {
    client
      .getStatus(phone)
      .then(() => {
        client.sendText(phone, message).then(async () => {
          // console.log(`Message sent to ${phone}`);
          await messageLogRepository.save({
            phoneNumber: phone,
            message,
            sentAt: new Date(),
            status: 'sent',
            user_id,
          });
        });
      })
      .catch(async err => {
        // console.error(`Failed to send message to ${phone}:`, err);
        await messageLogRepository.save({
          phoneNumber: phone,
          message,
          sentAt: new Date(),
          status: 'failed',
          error: err.message,
          user_id,
        });
      });
  });
};
