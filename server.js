import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(__dirname, 'server_log.txt');

// Initialize / clear log file
fs.writeFileSync(logFile, `Server started at ${new Date().toISOString()}\n__dirname is: ${__dirname}\n`);

function logMsg(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  logMsg(`[Request] ${req.method} ${req.url}`);
  next();
});

// Setup VAPID keys for real push notifications
const vapidKeysFile = path.join(__dirname, 'vapid_keys.json');
let vapidKeys = null;
if (fs.existsSync(vapidKeysFile)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(vapidKeysFile, 'utf8'));
  } catch (e) {
    logMsg(`Error reading vapid_keys.json: ${e.message}`);
  }
}

if (!vapidKeys) {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidKeysFile, JSON.stringify(vapidKeys, null, 2), 'utf8');
  logMsg("Generated fresh VAPID keys for Web Push Notifications.");
}

webpush.setVapidDetails(
  'mailto:support@homecell.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const subscriptionsFile = path.join(__dirname, 'subscriptions.json');
if (!fs.existsSync(subscriptionsFile)) {
  fs.writeFileSync(subscriptionsFile, '[]', 'utf8');
}

function saveSubscription(sub) {
  try {
    const data = fs.readFileSync(subscriptionsFile, 'utf8');
    const subs = JSON.parse(data || '[]');
    const exists = subs.some(s => s.endpoint === sub.endpoint);
    if (!exists) {
      subs.push(sub);
      fs.writeFileSync(subscriptionsFile, JSON.stringify(subs, null, 2), 'utf8');
      logMsg(`Saved new subscription. Total subscribers: ${subs.length}`);
    }
  } catch (e) {
    logMsg(`Error saving subscription: ${e.message}`);
  }
}

function removeSubscription(endpoint) {
  try {
    const data = fs.readFileSync(subscriptionsFile, 'utf8');
    let subs = JSON.parse(data || '[]');
    subs = subs.filter(s => s.endpoint !== endpoint);
    fs.writeFileSync(subscriptionsFile, JSON.stringify(subs, null, 2), 'utf8');
    logMsg(`Removed subscriber. Total subscribers: ${subs.length}`);
  } catch (e) {
    logMsg(`Error removing subscription: ${e.message}`);
  }
}

// REST API for Web Push
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/subscribe', (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }
  saveSubscription(subscription);
  res.status(201).json({ success: true });
});

app.post('/api/broadcast-push', async (req, res) => {
  const { title, body, url } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const data = fs.readFileSync(subscriptionsFile, 'utf8');
    const subs = JSON.parse(data || '[]');
    logMsg(`Broadcasting: "${title}" to ${subs.length} subscribers.`);

    const payload = JSON.stringify({ title, body, url: url || '/' });

    const sendPromises = subs.map(sub => {
      return webpush.sendNotification(sub, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            removeSubscription(sub.endpoint);
          } else {
            logMsg(`Error sending to ${sub.endpoint}: ${err.message}`);
          }
        });
    });

    await Promise.all(sendPromises);
    res.json({ success: true, sentCount: subs.length });
  } catch (e) {
    logMsg(`Error in broadcast-push: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// For all other routes, serve index.html
app.get('*', (req, res) => {
  logMsg(`[Fallback to index.html for ${req.url}]`);
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  logMsg(`Server running on port ${PORT}`);
});
