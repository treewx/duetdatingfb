require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const Database = require('./database');
const MessageHandler = require('./messageHandler');

const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'duet_verify_token_123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.APP_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new Database();
const messageHandler = new MessageHandler(db, PAGE_ACCESS_TOKEN);

function verifyRequestSignature(req, res, buf) {
  const signature = req.get('X-Hub-Signature-256');
  
  if (!signature) {
    console.warn('Missing signature');
    return;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(buf)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid signature');
    throw new Error('Invalid signature');
  }
}

app.use('/webhook', express.raw({ verify: verifyRequestSignature, type: 'application/json' }));

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());

    if (body.object === 'page') {
      body.entry.forEach(entry => {
        const webhookEvent = entry.messaging[0];
        const senderId = webhookEvent.sender.id;

        if (webhookEvent.message) {
          messageHandler.handleMessage(senderId, webhookEvent.message);
        } else if (webhookEvent.postback) {
          messageHandler.handlePostback(senderId, webhookEvent.postback);
        }
      });

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Duet Dating App Messenger Bot',
    status: 'Running',
    endpoints: {
      webhook: '/webhook',
      health: '/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Duet Messenger Bot running on port ${PORT}`);
  console.log(`📱 Webhook URL: ${process.env.WEBHOOK_URL || 'http://localhost:' + PORT}/webhook`);
});

module.exports = app;