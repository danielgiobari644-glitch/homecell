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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

function saveSubscription(sub, uid, email, role) {
  try {
    const data = fs.readFileSync(subscriptionsFile, 'utf8');
    const subs = JSON.parse(data || '[]');
    const index = subs.findIndex(s => s.endpoint === sub.endpoint);
    const subWithMetadata = {
      ...sub,
      uid: uid || null,
      email: email || null,
      role: role || null,
      updatedAt: new Date().toISOString()
    };
    if (index === -1) {
      subs.push(subWithMetadata);
      logMsg(`Saved new subscription. Total subscribers: ${subs.length}`);
    } else {
      subs[index] = { ...subs[index], ...subWithMetadata };
      logMsg(`Updated existing subscription metadata for ${email || 'unknown'}.`);
    }
    fs.writeFileSync(subscriptionsFile, JSON.stringify(subs, null, 2), 'utf8');
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
  const { subscription, uid, email, role } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }
  saveSubscription(subscription, uid, email, role);
  res.status(201).json({ success: true });
});

app.post('/api/broadcast-push', async (req, res) => {
  const { title, body, url, targetRole, targetUid, excludeUid } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const data = fs.readFileSync(subscriptionsFile, 'utf8');
    let subs = JSON.parse(data || '[]');
    
    // Filter subscribers based on criteria if provided
    if (targetRole) {
      subs = subs.filter(sub => sub.role === targetRole);
    }
    if (targetUid) {
      subs = subs.filter(sub => sub.uid === targetUid);
    }
    if (excludeUid) {
      subs = subs.filter(sub => sub.uid !== excludeUid);
    }

    logMsg(`Broadcasting: "${title}" to ${subs.length} filtered subscribers (role=${targetRole || 'all'}, uid=${targetUid || 'all'}, exclude=${excludeUid || 'none'}).`);

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

// Store Asset Direct Upload Endpoint for Super Admin
app.post('/api/upload-store-asset', (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    let base64Data = fileData;
    let mimeType = fileType || 'application/octet-stream';
    if (fileData.includes(';base64,')) {
      const parts = fileData.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    let ext = 'bin';
    if (fileName && fileName.includes('.')) {
      ext = fileName.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('mp3') || mimeType.includes('audio/mpeg')) ext = 'mp3';
    else if (mimeType.includes('wav')) ext = 'wav';
    else if (mimeType.includes('zip')) ext = 'zip';

    const safeBaseName = (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') : 'asset').slice(0, 40);
    const safeName = `store_${Date.now()}_${safeBaseName}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    logMsg(`Saved store asset to ${filePath} (${buffer.length} bytes, type: ${mimeType})`);
    res.json({
      success: true,
      fileUrl: `/uploads/${safeName}`,
      fileName: fileName || safeName,
      size: buffer.length,
      mimeType: mimeType
    });
  } catch (err) {
    logMsg(`Error saving store asset: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Video Upload Endpoint for Super Admin Loading Screen Videos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.post('/api/upload-video', (req, res) => {
  try {
    const { videoData, fileName } = req.body;
    if (!videoData) {
      return res.status(400).json({ error: 'No video data provided' });
    }

    let base64Data = videoData;
    let mimeType = 'video/mp4';
    if (videoData.includes(';base64,')) {
      const parts = videoData.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
    const safeName = `loading_video_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    logMsg(`Saved custom video to ${filePath} (${buffer.length} bytes)`);
    res.json({
      success: true,
      videoUrl: `/uploads/${safeName}`,
      size: buffer.length,
      mimeType: mimeType
    });
  } catch (err) {
    logMsg(`Error saving video: ${err.message}`);
    res.status(500).json({ error: err.message });
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
