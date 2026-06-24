// calendar.js
// Custom Monthly Calendar with dynamic day-grids, RSVPs, and Agenda panels

let currentCalendarDate = new Date();
let universalEvents = [];
let userCellEvents = [];
let selectedDay = null;

function initCalendarModule() {
  syncCalendarEvents();
}

function syncCalendarEvents() {
  // Sync Universal Fellowship Events
  window.db.collection('parish_events').onSnapshot(snap => {
    universalEvents = [];
    snap.forEach(doc => {
      universalEvents.push(doc.data());
    });
    renderCalendar();
  }, err => window.handleFirestoreError(err, 'list', 'parish_events'));

  // Sync Joined Cell Events if applicable
  const cellId = window.currentUserProfile?.cellId;
  if (cellId && cellId !== 'none') {
    window.db.collection('cells').doc(cellId).collection('events').onSnapshot(snap => {
      userCellEvents = [];
      snap.forEach(doc => {
        const ev = doc.data();
        ev.isCellEvent = true;
        userCellEvents.push(ev);
      });
      renderCalendar();
    }, err => console.warn("Lounge security restriction for calendar."));
  } else {
    userCellEvents = [];
    renderCalendar();
  }
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthYearLabel = document.getElementById('calendar-month-year');
  if (!grid || !monthYearLabel) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  monthYearLabel.innerText = currentCalendarDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  grid.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Offset padding for first day of the week
  for (let i = 0; i < firstDayIndex; i++) {
    const blank = document.createElement('div');
    blank.className = "p-4 bg-slate-50/20 dark:bg-zinc-950/20 text-transparent select-none rounded-xl";
    blank.innerText = "-";
    grid.appendChild(blank);
  }

  // Populate days
  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Filter events on this specific date
    const dayUniversal = universalEvents.filter(e => e.date === dateStr);
    const dayCell = userCellEvents.filter(e => e.date === dateStr);
    const hasEvents = dayUniversal.length > 0 || dayCell.length > 0;

    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    const isSelected = selectedDay === day;

    const box = document.createElement('div');
    box.className = `p-3 min-h-[70px] flex flex-col justify-between border transition-all cursor-pointer rounded-xl ${
      isSelected
        ? 'bg-blue-600 text-white border-transparent shadow-lg scale-102 z-10'
        : isToday
        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-900 text-blue-700 dark:text-blue-300'
        : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
    }`;

    box.onclick = () => selectDay(day);

    box.innerHTML = `
      <span class="text-xs font-bold font-mono">${day}</span>
      ${
        hasEvents
          ? `<div class="flex gap-1 flex-wrap mt-2">
               ${dayUniversal.map(() => `<span class="w-2 h-2 rounded-full bg-blue-500" title="Fellowship Event"></span>`).join('')}
               ${dayCell.map(() => `<span class="w-2 h-2 rounded-full bg-emerald-500" title="Cell Event"></span>`).join('')}
             </div>`
          : ''
      }
    `;

    grid.appendChild(box);
  }

  // Reload active selected day agenda
  if (selectedDay) {
    loadAgendaForSelectedDay();
  }
}

function selectDay(day) {
  selectedDay = day;
  renderCalendar();
  loadAgendaForSelectedDay();
}

function prevMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  selectedDay = null;
  renderCalendar();
}

function nextMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  selectedDay = null;
  renderCalendar();
}

function loadAgendaForSelectedDay() {
  const agendaTitle = document.getElementById('agenda-title');
  const agendaList = document.getElementById('agenda-events-list');
  if (!agendaTitle || !agendaList || !selectedDay) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const formattedDate = new Date(year, month, selectedDay).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  agendaTitle.innerText = `Agenda for ${formattedDate}`;

  agendaList.innerHTML = '';

  const dayUniversal = universalEvents.filter(e => e.date === dateStr);
  const dayCell = userCellEvents.filter(e => e.date === dateStr);

  const allDayEvents = [...dayUniversal, ...dayCell];

  if (allDayEvents.length === 0) {
    agendaList.innerHTML = `
      <div class="text-center py-6 text-slate-400">
        <i data-lucide="calendar-range" class="w-10 h-10 mx-auto opacity-30 mb-2"></i>
        <p class="text-xs italic">No scheduled fellowship or cell group gatherings on this day.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  allDayEvents.forEach(ev => {
    const isCellEvent = ev.isCellEvent === true;
    const evId = ev.id || 'cell-ev';
    
    // Count RSVPs
    const rsvps = ev.rsvps || {};
    let going = 0, maybe = 0, declined = 0;
    Object.values(rsvps).forEach(val => {
      if (val === 'Going') going++;
      if (val === 'Maybe') maybe++;
      if (val === 'Declined') declined++;
    });

    const userRsvp = rsvps[window.auth.currentUser?.uid] || 'None';

    const card = document.createElement('div');
    card.className = "p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4";
    card.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <div>
          <span class="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            isCellEvent
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
          }">${isCellEvent ? 'Cell Group' : 'Universal Fellowship Gathering'}</span>
          <h4 class="text-lg font-black font-display tracking-tight text-slate-900 dark:text-zinc-100 mt-1">${ev.title}</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${ev.description}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 items-center justify-between text-xs font-semibold text-slate-400 pt-3 border-t border-slate-50 dark:border-zinc-800/60">
        <!-- RSVP Stats -->
        <div class="flex gap-3 text-[11px]">
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Going: <strong class="text-slate-800 dark:text-zinc-200">${going}</strong></span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Maybe: <strong class="text-slate-800 dark:text-zinc-200">${maybe}</strong></span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Declined: <strong class="text-slate-800 dark:text-zinc-200">${declined}</strong></span>
        </div>

        <!-- RSVP RSVP button triggers (Universal only) -->
        ${
          !isCellEvent
            ? `<div class="flex gap-1.5 items-center">
                 <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">Your RSVP: ${userRsvp !== 'None' ? `<strong>${userRsvp}</strong>` : 'None'}</span>
                 <button onclick="rsvpParishEvent('${evId}', 'Going')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${userRsvp === 'Going' ? 'bg-emerald-600 text-white border-transparent' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'}">Going</button>
                 <button onclick="rsvpParishEvent('${evId}', 'Maybe')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${userRsvp === 'Maybe' ? 'bg-amber-600 text-white border-transparent' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'}">Maybe</button>
                 <button onclick="rsvpParishEvent('${evId}', 'Declined')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${userRsvp === 'Declined' ? 'bg-rose-600 text-white border-transparent' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'}">Declined</button>
               </div>`
            : `<span class="text-[10px] text-slate-400 italic">No RSVP required for cell-specific gatherings</span>`
        }
      </div>
    `;

    agendaList.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

function rsvpParishEvent(eventId, status) {
  const uid = window.auth.currentUser?.uid;
  if (!uid) return;

  const ref = window.db.collection('parish_events').doc(eventId);

  window.db.runTransaction(transaction => {
    return transaction.get(ref).then(doc => {
      if (!doc.exists) return;
      const data = doc.data();
      const rsvps = data.rsvps || {};
      
      rsvps[uid] = status;

      transaction.update(ref, { rsvps });
    });
  }).then(() => {
    window.showToast?.(`RSVP updated successfully to ${status}!`);
    loadAgendaForSelectedDay();
  }).catch(err => window.handleFirestoreError(err, 'write', `parish_events/${eventId}`));
}

// Expose globally
window.initCalendarModule = initCalendarModule;
window.rsvpParishEvent = rsvpParishEvent;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.selectDay = selectDay;
