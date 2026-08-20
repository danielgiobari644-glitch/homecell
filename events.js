// events.js
// Church & Cell Gatherings, RSVP, Reminders & Scheduling

let eventsListener = null;

function initEventsModule() {
  syncEventsStream();
}

function syncEventsStream() {
  const container = document.getElementById('events-stream-container');
  if (!container) return;

  if (eventsListener) eventsListener();

  const db = window.db;
  if (!db) return;

  eventsListener = db.collection('upcoming_events')
    .onSnapshot(snap => {
      if (snap.empty) {
        // Try fallback to 'events' collection
        db.collection('events').get().then(fallbackSnap => {
          if (fallbackSnap.empty) {
            container.innerHTML = `
              <div class="col-span-full text-center py-12 text-slate-400">
                <i data-lucide="calendar" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                <p class="font-bold">No upcoming events scheduled.</p>
              </div>
            `;
            return;
          }
          const evts = [];
          fallbackSnap.forEach(doc => evts.push({ id: doc.id, ...doc.data() }));
          renderEventsGrid(evts);
        }).catch(() => {
          container.innerHTML = `
            <div class="col-span-full text-center py-12 text-slate-400">
              <i data-lucide="calendar" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
              <p class="font-bold">No upcoming events scheduled.</p>
            </div>
          `;
        });
        return;
      }

      const events = [];
      snap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
      renderEventsGrid(events);
    }, err => {
      console.warn("Events error:", err);
    });
}

function renderEventsGrid(events) {
  const container = document.getElementById('events-stream-container');
  if (!container) return;

  const user = window.auth?.currentUser;
  const isSuperAdmin = window.checkIsSuperAdmin ? window.checkIsSuperAdmin() : (
    window.currentUserRole === 'Super Admin' ||
    user?.email?.toLowerCase() === 'danielgiobari644@gmail.com'
  );

  container.innerHTML = events.map(ev => {
    const isAttending = user && ev.attendees && ev.attendees[user.uid] === true;
    const attendeesCount = ev.attendeesCount || 0;
    const formattedDate = formatEventDatesDisplay(ev);
    const safeTitle = (ev.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeImg = (ev.imageUrl || '').replace(/'/g, "\\'");

    return `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
        <div>
          <div class="relative h-44 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            ${ev.imageUrl ? `
              <img src="${ev.imageUrl}" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ` : `
              <div class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <i data-lucide="calendar" class="w-10 h-10 mb-1 opacity-40"></i>
                <span class="text-xs font-bold">Church Gathering</span>
              </div>
            `}
            
            ${isSuperAdmin ? `
              <button onclick="event.stopPropagation(); window.openChangeCoverModal({ type: 'event', id: '${ev.id}', title: '${safeTitle}', imageUrl: '${safeImg}' })" class="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5 border border-white/20 z-10 cursor-pointer transition-all hover:scale-105">
                <i data-lucide="camera" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>Change Cover</span>
              </button>
            ` : ''}
          </div>

          <div class="p-5 space-y-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 inline-block">
              📅 ${formattedDate}
            </span>
            <h4 class="font-black text-slate-900 dark:text-zinc-100 text-base">${ev.title}</h4>
            <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${ev.description}</p>
            <p class="text-[11px] font-bold text-slate-400">📍 Location: <span class="text-slate-700 dark:text-zinc-300">${ev.location}</span></p>
          </div>
        </div>

        <div class="p-5 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800/60 mt-3 pt-3">
          <span class="text-xs font-bold text-slate-500">${attendeesCount} Attending</span>
          <button onclick="toggleRsvpEvent('${ev.id}')" class="px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
            isAttending
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
          }">
            ${isAttending ? '✓ Attending' : 'RSVP Now'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function formatEventDatesDisplay(ev) {
  if (!ev || !ev.eventDate) return 'Date TBA';
  try {
    const dt = new Date(ev.eventDate);
    return dt.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return ev.eventDate;
  }
}
window.formatEventDatesDisplay = formatEventDatesDisplay;

async function toggleRsvpEvent(eventId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to RSVP for gatherings.", "warning");
    return;
  }

  const db = window.db;
  if (!db) return;

  const evRef = db.collection('upcoming_events').doc(eventId);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(evRef);
      if (!doc.exists) return;

      const data = doc.data();
      const attendees = data.attendees || {};
      let count = data.attendeesCount || 0;

      if (attendees[user.uid]) {
        delete attendees[user.uid];
        count = Math.max(0, count - 1);
      } else {
        attendees[user.uid] = true;
        count += 1;
      }

      transaction.update(evRef, {
        attendees: attendees,
        attendeesCount: count
      });
    });

    window.showToast?.("RSVP updated!", "success");
  } catch (e) {
    window.showToast?.("Could not update RSVP.", "error");
  }
}

window.initEventsModule = initEventsModule;
window.toggleRsvpEvent = toggleRsvpEvent;
