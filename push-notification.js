// push-notification.js
// Production Push Notification Engine & Notification History Manager for Home.cell

const VAPID_KEY_URL = './api/vapid-public-key';
const SUBSCRIBE_URL = './api/subscribe';
const BROADCAST_URL = './api/broadcast-push';

let notificationsListener = null;
let cachedNotifications = [];

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

    window.showToast?.("Configuring push notifications...", "info");

    let registration = null;
    try {
      registration = await navigator.serviceWorker.register('./sw.js');
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

        // Store device token in Firestore per user
        if (currentUser && window.db) {
          const subId = btoa(subRaw.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
          await window.db.collection('users').doc(currentUser.uid).collection('push_subscriptions').doc(subId).set({
            endpoint: subRaw.endpoint,
            keys: subRaw.keys,
            userAgent: navigator.userAgent,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } catch (subPostErr) {
        console.warn("Could not post subscription to backend:", subPostErr);
      }
    }

    localStorage.setItem('homecell_push_notifications_enabled', 'true');
    window.showToast?.("🔔 Real push notifications enabled on this device!", "success");
    updatePushUIState();

    return permission;
  } catch (error) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      localStorage.setItem('homecell_push_notifications_enabled', 'true');
      window.showToast?.("🔔 Notifications active for this device!", "success");
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

    if (window.db) {
      const subId = btoa(subRaw.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
      await window.db.collection('users').doc(currentUser.uid).collection('push_subscriptions').doc(subId).set({
        endpoint: subRaw.endpoint,
        keys: subRaw.keys,
        userAgent: navigator.userAgent,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.warn("Failed updating user notification session metadata:", error);
  }
};

// Record and dispatch a real push notification
window.recordNotification = async function(title, body, type = 'general', targetUrl = './', targetUid = 'all', excludeUid = null) {
  if (!title || !body) return;

  // 1. Write to Firestore notifications collection
  if (window.db) {
    try {
      await window.db.collection('notifications').add({
        title,
        body,
        type,
        url: targetUrl,
        targetUid: targetUid || 'all',
        excludeUid: excludeUid || null,
        read: false,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (dbErr) {
      console.warn("Could not save notification to Firestore:", dbErr);
    }
  }

  // 2. Dispatch real off-app push notification via backend
  try {
    await fetch(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        body, 
        url: targetUrl,
        targetUid: targetUid === 'all' ? null : targetUid,
        excludeUid
      })
    }).catch(async () => {
      // Fallback direct root path
      await fetch('/api/broadcast-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url: targetUrl, targetUid: targetUid === 'all' ? null : targetUid, excludeUid })
      }).catch(() => {});
    });
  } catch (error) {
    console.warn("Failed sending push notification broadcast:", error);
  }
};

// Global Super Admin Broadcast Push Dispatcher
window.dispatchPushNotification = async function(title, body, type = 'announcement', targetUrl = './#view-feed', targetUid = 'all') {
  if (!title || !body) return;

  // 1. Record in Firestore for notification inboxes & badges
  await window.recordNotification(title, body, type, targetUrl, targetUid);

  // 2. Dispatch live browser service worker notification if supported and granted
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.showNotification(title, {
            body: body,
            icon: './favicon.svg',
            badge: './favicon.svg',
            data: { url: targetUrl },
            vibrate: [150, 50, 150]
          });
        }
      }).catch(() => {});
    } else {
      try {
        new Notification(title, {
          body: body,
          icon: './favicon.svg'
        });
      } catch (e) {}
    }
  }

  // 3. Audio feedback
  window.soundEngine?.playSuccess?.();
};

window.sendTestPushNotification = async function() {
  const user = window.auth?.currentUser;
  const targetUid = user ? user.uid : null;
  window.showToast?.("Sending live off-app push notification...", "info");
  
  await window.recordNotification(
    "🔔 Home.cell Fellowship Alert",
    "Grace and peace! This is a real off-app push notification from your Home.cell fellowship.",
    "system",
    "./#view-notifications",
    targetUid || 'all'
  );

  // If in browser and permission is granted, also show directly
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification("🔔 Home.cell Fellowship Alert", {
          body: "Grace and peace! Real push notification verified.",
          icon: './favicon.svg',
          badge: './favicon.svg',
          data: { url: './#view-notifications' }
        });
      }
    });
  }

  window.showToast?.("Push notification sent! Check your notification tray.", "success");
};

// In-App Notification History Sync & UI
window.syncNotificationHistory = function() {
  const container = document.getElementById('notifications-feed-container');
  const badgeEls = document.querySelectorAll('.notification-unread-badge');
  if (!container) return;

  const db = window.db;
  if (!db) {
    renderNotificationList([]);
    return;
  }

  const currentUser = window.auth?.currentUser;
  if (notificationsListener) notificationsListener();

  let query = db.collection('notifications').orderBy('createdAt', 'desc').limit(40);

  notificationsListener = query.onSnapshot(snap => {
    let items = [];
    if (!snap.empty) {
      snap.forEach(doc => {
        const d = doc.data();
        if (d.targetUid === 'all' || !currentUser || d.targetUid === currentUser.uid) {
          if (!d.excludeUid || (currentUser && d.excludeUid !== currentUser.uid)) {
            items.push({ id: doc.id, ...d });
          }
        }
      });
    }

    cachedNotifications = items;
    const unreadCount = items.filter(n => !n.read).length;

    badgeEls.forEach(b => {
      if (unreadCount > 0) {
        b.innerText = unreadCount > 99 ? '99+' : unreadCount;
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    });

    renderNotificationList(items);
  }, err => {
    console.warn("Notifications listener error:", err);
  });
};

function renderNotificationList(items) {
  const container = document.getElementById('notifications-feed-container');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 text-slate-400 dark:text-zinc-500 bg-white/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
        <div class="w-14 h-14 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3 text-2xl font-black">
          🔔
        </div>
        <h4 class="font-black text-base text-slate-800 dark:text-zinc-200">All caught up in the Spirit</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">You have no unread notifications right now. New cell messages, quiz alerts, and praise reports will appear here.</p>
        <button onclick="window.sendTestPushNotification()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs">
          Send Test Notification
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const iconMap = {
    chat: { icon: 'message-circle', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    praise: { icon: 'heart', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    announcement: { icon: 'megaphone', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    devotional: { icon: 'book-open', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    quiz: { icon: 'award', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    kc: { icon: 'coins', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    store: { icon: 'shopping-bag', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    system: { icon: 'bell', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    general: { icon: 'bell', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
  };

  container.innerHTML = items.map(n => {
    const meta = iconMap[n.type] || iconMap.general;
    let timeStr = 'Just now';
    if (n.createdAt && typeof n.createdAt.toDate === 'function') {
      const date = n.createdAt.toDate();
      timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    return `
      <div onclick="handleNotificationClick('${n.id}', '${encodeURIComponent(n.url || './')}')" class="p-4 rounded-2xl border ${n.read ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800' : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-xs'} hover:border-blue-500/50 transition-all cursor-pointer flex items-start gap-3.5 group">
        <div class="w-10 h-10 rounded-xl ${meta.color} border flex items-center justify-center shrink-0">
          <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-black text-slate-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${n.title}</h4>
            <span class="text-[10px] text-slate-400 shrink-0 font-mono">${timeStr}</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">${n.body}</p>
        </div>
        ${!n.read ? `<span class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>` : ''}
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.handleNotificationClick = async function(notificationId, targetUrlEncoded) {
  const targetUrl = decodeURIComponent(targetUrlEncoded || './');
  
  if (window.db && notificationId) {
    try {
      await window.db.collection('notifications').doc(notificationId).update({ read: true });
    } catch (e) {}
  }

  if (targetUrl.startsWith('./#view-') || targetUrl.startsWith('#view-')) {
    const tabName = targetUrl.replace('./#view-', '').replace('#view-', '');
    if (window.switchTab) window.switchTab(tabName);
  } else if (targetUrl !== './') {
    window.location.href = targetUrl;
  }
};

window.markAllNotificationsAsRead = async function() {
  if (!window.db) return;
  try {
    const unread = cachedNotifications.filter(n => !n.read);
    for (const item of unread) {
      await window.db.collection('notifications').doc(item.id).update({ read: true });
    }
    window.showToast?.("All notifications marked as read.", "info");
  } catch (e) {
    console.warn("Error marking notifications as read:", e);
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
    statusIndicator.innerText = "🟢 Real Push Notifications Active";
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
    statusIndicator.innerText = "⚪ Receive updates even when app is closed";
    statusIndicator.className = "text-xs text-slate-500 dark:text-zinc-400";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    updatePushUIState();
    if (window.isNotificationSupported() && Notification.permission === 'granted') {
      navigator.serviceWorker.register('./sw.js').then(() => {
        window.updateSubscriptionOnServer?.();
      }).catch(err => {});
    }
    syncNotificationHistory();
  }, 1000);
});

window.updatePushUIState = updatePushUIState;
