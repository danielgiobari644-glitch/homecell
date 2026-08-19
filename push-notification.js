// push-notification.js
// Client-side Push Notification Engine for Home.cell

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

window.requestNotificationPermission = async function() {
  if (!window.isNotificationSupported()) {
    window.showToast?.("Push notifications are not supported in this browser.", "warning");
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      window.showToast?.("Notification permission was not granted.", "warning");
      updatePushUIState();
      return permission;
    }

    window.showToast?.("Setting up notifications...", "info");

    let registration = null;
    try {
      registration = await navigator.serviceWorker.register('sw.js');
      if (navigator.serviceWorker.ready) {
        registration = await navigator.serviceWorker.ready;
      }
    } catch (swErr) {
      console.warn("Service Worker registration notice:", swErr);
      registration = await navigator.serviceWorker.getRegistration().catch(() => null);
    }

    let subscription = null;
    if (registration && registration.pushManager) {
      try {
        const keyRes = await fetch(VAPID_KEY_URL);
        if (keyRes.ok) {
          const { publicKey } = await keyRes.json();
          if (publicKey) {
            const applicationServerKey = urlBase64ToUint8Array(publicKey);
            subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
              });
            }
          }
        }
      } catch (pushErr) {
        console.warn("PushManager subscription warning:", pushErr);
      }
    }

    let subRaw = null;
    if (subscription) {
      try {
        if (typeof subscription.toJSON === 'function') {
          const parsed = subscription.toJSON();
          subRaw = {
            endpoint: parsed.endpoint,
            keys: {
              p256dh: parsed.keys?.p256dh || null,
              auth: parsed.keys?.auth || null
            }
          };
        }
      } catch (e) {}

      if (!subRaw) {
        subRaw = {
          endpoint: subscription.endpoint,
          keys: { p256dh: null, auth: null }
        };
      }
    }

    const currentUser = window.auth?.currentUser;
    if (subRaw && subRaw.endpoint) {
      try {
        await fetch(SUBSCRIBE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subscription: subRaw,
            uid: currentUser ? currentUser.uid : null,
            email: currentUser ? currentUser.email : null,
            role: window.currentUserRole || null
          })
        });
      } catch (subPostErr) {
        console.warn("Could not post subscription to backend:", subPostErr);
      }
    }

    localStorage.setItem('homecell_push_notifications_enabled', 'true');
    window.showToast?.("🔔 Notifications enabled successfully!", "success");
    updatePushUIState();

    return permission;
  } catch (error) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      localStorage.setItem('homecell_push_notifications_enabled', 'true');
      window.showToast?.("🔔 Notifications enabled for this device!", "success");
      updatePushUIState();
      return 'granted';
    }
    window.showToast?.("Could not configure push notifications: " + error.message, "error");
    return 'default';
  }
};

window.updateSubscriptionOnServer = async function() {
  if (!window.isNotificationSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    
    let subRaw = null;
    if (typeof subscription.toJSON === 'function') {
      const parsed = subscription.toJSON();
      subRaw = {
        endpoint: parsed.endpoint,
        keys: {
          p256dh: parsed.keys?.p256dh || null,
          auth: parsed.keys?.auth || null
        }
      };
    }
    
    if (!subRaw) {
      subRaw = {
        endpoint: subscription.endpoint,
        keys: { p256dh: null, auth: null }
      };
    }
    
    const currentUser = window.auth?.currentUser;
    if (!currentUser) return;

    await fetch(SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subRaw,
        uid: currentUser.uid,
        email: currentUser.email,
        role: window.currentUserRole || 'Member'
      })
    });
  } catch (error) {
    console.warn("Failed updating user notification session metadata:", error);
  }
};

window.sendPushNotification = async function(title, body, targetUrl = '/', targetRole = null, targetUid = null, excludeUid = null) {
  if (!title || !body) return;

  try {
    await fetch(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        body, 
        url: targetUrl,
        targetRole,
        targetUid,
        excludeUid
      })
    });
  } catch (error) {
    console.warn("Failed sending push notification request to server:", error);
  }
};

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
    btn.innerText = "Enable Notifications";
    btn.disabled = false;
    statusIndicator.innerText = "⚪ Receive updates even offline";
    statusIndicator.className = "text-xs text-slate-500 dark:text-zinc-400";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    updatePushUIState();
    if (window.isNotificationSupported() && Notification.permission === 'granted') {
      navigator.serviceWorker.register('sw.js').then(() => {
        window.updateSubscriptionOnServer?.();
      }).catch(err => {});
    }
  }, 1500);
});

window.updatePushUIState = updatePushUIState;
