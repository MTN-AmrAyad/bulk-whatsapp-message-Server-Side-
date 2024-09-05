import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { getConfig } from 'dotenv-handler';
import { create } from '@wppconnect-team/wppconnect';
import { clientInstances } from '..';

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);

router.post('/register', body('email').isEmail(), body('password').isLength({ min: 6 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.headers['api-key'] !== getConfig('API_KEY')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, password } = req.body;

  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = userRepository.create({ email, password: hashedPassword });
  await userRepository.save(user);

  const token = jwt.sign({ id: user.id }, getConfig('JWT_SECRET') as string, { expiresIn: '12h' });

  res.status(201).json({ token });
});

router.post('/login', body('email').isEmail(), body('password').exists(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await userRepository.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, getConfig('JWT_SECRET') as string, { expiresIn: '12h' });
  let qrCodeImage: string | undefined;
  const sessionId = user.sessionId || Math.random().toString(36).substring(7);
  let sentFlag = false;
  const puppeteerOptions: {
    headless: boolean;
    args: string[];
    protocolTimeout: number;
    executablePath?: string;
  } = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--remote-debugging-port=9222',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    protocolTimeout: 120000,
  };
  // console.log('Using puppeteer options:', puppeteerOptions);
  create({
    session: sessionId,
    disableWelcome: true,
    useChrome: true,
    autoClose: 1000 * 60 * 5,
    puppeteerOptions: puppeteerOptions,
    catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
      console.log('New QR detected, you can generate a new QR code');
      console.log('Attempts: ', attempts);
      console.log('UrlCode: ', urlCode);
      console.log('Base64 QR: ', base64Qr);
      qrCodeImage = base64Qr;
      if (!sentFlag) {
        res.json({ token, qrCodeImage });
        sentFlag = true;
      }
    },
  })
    .then(client => {
      clientInstances.set(user.id, client);
      user.sessionId = sessionId;
      userRepository.save(user);
      if (!sentFlag) {
        res.json({ token });
        sentFlag = true;
      }
      console.log('WPPConnect client initialized successfully');
    })
    .catch(error => {
      user.sessionId = undefined;
      userRepository.save(user);
      console.error('Error initializing WPPConnect client:', error);
    });
});

export default router;
