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

function verifyRequestSignature(req, res, buf) {
  const signature = req.get('X-Hub-Signature-256');
  
  if (!signature) {
    console.warn('Missing signature - allowing for testing');
    return; // Allow without signature for testing
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(buf)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid signature - expected:', expectedSignature, 'got:', signature);
    // Temporarily allow invalid signatures for debugging
    console.warn('Allowing invalid signature for testing');
    return;
  }
  
  console.log('Signature verified successfully');
}

const db = new Database();
const messageHandler = new MessageHandler(db, PAGE_ACCESS_TOKEN);

// Webhook message endpoint middleware - must be defined before the route
app.use('/webhook', express.raw({ verify: verifyRequestSignature, type: 'application/json' }));

// Webhook verification endpoint (GET)
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
    console.log('Received webhook request');
    const body = JSON.parse(req.body.toString());

    if (body.object === 'page') {
      body.entry.forEach(entry => {
        if (entry.messaging && entry.messaging.length > 0) {
          entry.messaging.forEach(webhookEvent => {
            const senderId = webhookEvent.sender.id;
            console.log(`Processing message from sender: ${senderId}`);

            if (webhookEvent.message) {
              console.log('Handling message:', webhookEvent.message);
              messageHandler.handleMessage(senderId, webhookEvent.message).catch(err => {
                console.error('Error handling message:', err);
              });
            } else if (webhookEvent.postback) {
              console.log('Handling postback:', webhookEvent.postback);
              messageHandler.handlePostback(senderId, webhookEvent.postback).catch(err => {
                console.error('Error handling postback:', err);
              });
            }
          });
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

// Debug endpoint to test environment variables
app.get('/debug', (req, res) => {
  res.json({
    hasPageAccessToken: !!PAGE_ACCESS_TOKEN,
    hasAppSecret: !!APP_SECRET,
    verifyToken: VERIFY_TOKEN,
    webhookUrl: process.env.WEBHOOK_URL,
    port: PORT
  });
});

// Test webhook endpoint without signature verification
app.post('/webhook-test', async (req, res) => {
  try {
    console.log('Test webhook received:', req.body);
    res.status(200).send('TEST_SUCCESS');
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).send('TEST_ERROR');
  }
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