// push-notification.js
// Modern Client-side Push Notification Engine for real background/offline notifications

const VAPID_KEY_URL = '/api/vapid-public-key';
const SUBSCRIBE_URL = '/api/subscribe';
const BROADCAST_URL = '/api/broadcast-push';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

window.isNotificationSupported = function() {
  return ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
};

window.getNotificationPermissionState = function() {
  if (!window.isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Requests permission and registers push subscription
window.requestNotificationPermission = async function() {
  if (!window.isNotificationSupported()) {
    console.warn("Push notifications are not supported in this browser.");
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log("Notification permission denied or dismissed.");
      return permission;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log("Service Worker registered successfully:", registration);

    // Get VAPID Public Key from the server
    const keyRes = await fetch(VAPID_KEY_URL);
    if (!keyRes.ok) throw new Error("Failed to load VAPID public key from server.");
    const { publicKey } = await keyRes.json();

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe to push manager
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
    }

    // Safely extract subscription keys and endpoint to prevent circular structure issues
    let subRaw = null;
    try {
      if (subscription && typeof subscription.toJSON === 'function') {
        const parsed = subscription.toJSON();
        subRaw = {
          endpoint: parsed.endpoint,
          keys: {
            p256dh: parsed.keys?.p256dh || null,
            auth: parsed.keys?.auth || null
          }
        };
      }
    } catch (e) {
      console.warn("Failed to call subscription.toJSON(), falling back to manual extraction:", e);
    }

    if (!subRaw && subscription) {
      let p256dh = null;
      let auth = null;
      try {
        if (typeof subscription.getKey === 'function') {
          const p256dhBuffer = subscription.getKey('p256dh');
          if (p256dhBuffer) {
            p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(p256dhBuffer)));
          }
          const authBuffer = subscription.getKey('auth');
          if (authBuffer) {
            auth = btoa(String.fromCharCode.apply(null, new Uint8Array(authBuffer)));
          }
        }
      } catch (keyErr) {
        console.warn("Could not retrieve subscription keys:", keyErr);
      }
      subRaw = {
        endpoint: subscription.endpoint,
        keys: { p256dh, auth }
      };
    }

    // Send subscription to server
    const subRes = await fetch(SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subRaw })
    });

    if (subRes.ok) {
      console.log("Successfully registered push notification subscription on server.");
      window.showToast?.("Push notifications enabled successfully!", "success");
      updatePushUIState();
    } else {
      console.error("Server subscription failed.");
    }

    return permission;
  } catch (error) {
    console.error("Error setting up push notifications:", error);
    window.showToast?.("Failed to set up push notifications.", "error");
    return 'default';
  }
};

// Broadcasts push notification payload to the backend
window.sendPushNotification = async function(title, body, targetUrl = '/') {
  if (!title || !body) return;

  try {
    const res = await fetch(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url: targetUrl })
    });
    
    if (res.ok) {
      console.log(`Push broadcast successful for: "${title}"`);
    } else {
      console.warn("Backend failed to broadcast push.");
    }
  } catch (error) {
    console.warn("Failed sending push notification request to server:", error);
  }
};

// Update status visualizer
function updatePushUIState() {
  const btn = document.getElementById('btn-enable-push');
  const statusIndicator = document.getElementById('push-status-text');
  const settingsStatus = document.getElementById('settings-push-status');

  const state = window.getNotificationPermissionState();

  if (settingsStatus) {
    if (state === 'granted') {
      settingsStatus.innerText = "🟢 Push Notifications Enabled";
      settingsStatus.className = "text-xs font-semibold text-emerald-600 dark:text-emerald-400 block text-center uppercase tracking-wider";
    } else if (state === 'denied') {
      settingsStatus.innerText = "🔴 Push Blocked in Browser";
      settingsStatus.className = "text-xs font-semibold text-rose-500 block text-center uppercase tracking-wider";
    } else if (state === 'unsupported') {
      settingsStatus.innerText = "⚠️ Push Unsupported in Browser";
      settingsStatus.className = "text-xs font-semibold text-slate-400 block text-center uppercase tracking-wider";
    } else {
      settingsStatus.innerText = "⚪ Offline push inactive";
      settingsStatus.className = "text-xs text-slate-500 dark:text-zinc-400 block text-center uppercase tracking-wider";
    }
  }

  if (!btn || !statusIndicator) return;

  if (state === 'granted') {
    btn.classList.add('hidden');
    statusIndicator.innerText = "🟢 Push Notifications Enabled";
    statusIndicator.className = "text-xs font-semibold text-emerald-600 dark:text-emerald-400";
  } else if (state === 'denied') {
    btn.classList.remove('hidden');
    btn.innerText = "Blocked in Browser Settings";
    btn.disabled = true;
    statusIndicator.innerText = "🔴 Blocked by browser settings";
    statusIndicator.className = "text-xs font-semibold text-rose-500";
  } else if (state === 'unsupported') {
    btn.classList.add('hidden');
    statusIndicator.innerText = "⚠️ Unsupported browser";
    statusIndicator.className = "text-xs font-semibold text-slate-400";
  } else {
    btn.classList.remove('hidden');
    btn.innerText = "Enable Real Push Notifications";
    btn.disabled = false;
    statusIndicator.innerText = "⚪ Receive updates even offline/off the app";
    statusIndicator.className = "text-xs text-slate-500 dark:text-zinc-400";
  }
}

// Automatically update push UI on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(updatePushUIState, 1500);
});

window.updatePushUIState = updatePushUIState;
