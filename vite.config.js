import { defineConfig } from 'vite';
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

let vapidKeys = {
  publicKey: "BGKOcabDBghxOrqaFIRoI3hnbNHN6qz-PzZKQGA-ug1wkH7bFRr70sC6zKzdEFlZtAITa8IeiC5rSigXTd3iTM8",
  privateKey: "DQ1DLucOfzmZfa-MbEt7KI9V5Mty36uS3cPokKl7hKU"
};

try {
  if (fs.existsSync('./vapid_keys.json')) {
    vapidKeys = JSON.parse(fs.readFileSync('./vapid_keys.json', 'utf8'));
  }
} catch (e) {
  console.warn("Could not read vapid_keys.json, using defaults:", e);
}

try {
  webpush.setVapidDetails(
    'mailto:danielgiobari644@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (e) {
  console.warn("VAPID setup notice:", e);
}

const pushSubscriptions = new Map();

function pushNotificationPlugin() {
  return {
    name: 'push-notification-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = req.url ? req.url.split('?')[0] : '';
        if ((pathOnly === '/api/vapid-public-key' || pathOnly.endsWith('/api/vapid-public-key')) && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({ publicKey: vapidKeys.publicKey }));
        }

        if ((pathOnly === '/api/subscribe' || pathOnly.endsWith('/api/subscribe')) && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              if (data.subscription && data.subscription.endpoint) {
                const subKey = data.subscription.endpoint;
                pushSubscriptions.set(subKey, {
                  subscription: data.subscription,
                  uid: data.uid || null,
                  email: data.email || null,
                  role: data.role || 'Member',
                  updatedAt: new Date().toISOString()
                });
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, count: pushSubscriptions.size }));
            } catch (err) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if ((pathOnly === '/api/broadcast-push' || pathOnly.endsWith('/api/broadcast-push')) && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const title = data.title || 'Home.cell Notification';
              const message = data.body || data.message || 'New fellowship update in Home.cell!';
              const url = data.url || './';
              const targetUid = data.targetUid || null;
              const excludeUid = data.excludeUid || null;

              const payload = JSON.stringify({
                title,
                body: message,
                url,
                timestamp: Date.now()
              });

              let sentCount = 0;
              const expiredEndpoints = [];

              for (const [endpoint, client] of pushSubscriptions.entries()) {
                if (targetUid && client.uid && client.uid !== targetUid) continue;
                if (excludeUid && client.uid && client.uid === excludeUid) continue;

                try {
                  await webpush.sendNotification(client.subscription, payload);
                  sentCount++;
                } catch (pushErr) {
                  if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                    expiredEndpoints.push(endpoint);
                  } else {
                    console.warn("Push error for endpoint:", pushErr.message);
                  }
                }
              }

              expiredEndpoints.forEach(ep => pushSubscriptions.delete(ep));

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              return res.end(JSON.stringify({
                success: true,
                sent: sentCount,
                totalSubscribers: pushSubscriptions.size
              }));
            } catch (err) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [pushNotificationPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});

