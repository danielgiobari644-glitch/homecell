// cells.js
// Home.cell - Fellowship Discovery, Creation, Multi-Membership, Switcher & Private Fellowship Sanctuary

let activeFellowshipChatListener = null;
let activeFellowshipMembersListener = null;
let activeFellowshipEventsListener = null;

function initCellsModule() {
  renderDiscoveryFellowships();
  if (window.activeFellowshipId) {
    syncFellowshipDashboard();
  }
}

// -------------------------------------------------------------
// 1. DISCOVERY & ONBOARDING ("Find Your Home Fellowship")
// -------------------------------------------------------------
let discoverySearchQuery = '';

window.handleDiscoverySearch = function(query) {
  discoverySearchQuery = (query || '').toLowerCase().trim();
  renderDiscoveryFellowships();
};

window.renderDiscoveryFellowships = function() {
  const container = document.getElementById('discovery-fellowships-grid');
  const countEl = document.getElementById('discovery-fellowships-count');
  if (!container) return;

  const fellowships = window.allFellowships || [];
  const filtered = fellowships.filter(f => {
    if (!discoverySearchQuery) return true;
    const name = (f.name || '').toLowerCase();
    const motto = (f.motto || '').toLowerCase();
    const address = (f.address || '').toLowerCase();
    const city = (f.city || '').toLowerCase();
    const leader = (f.leaderName || '').toLowerCase();
    const day = (f.day || '').toLowerCase();
    return name.includes(discoverySearchQuery) ||
           motto.includes(discoverySearchQuery) ||
           address.includes(discoverySearchQuery) ||
           city.includes(discoverySearchQuery) ||
           leader.includes(discoverySearchQuery) ||
           day.includes(discoverySearchQuery);
  });

  if (countEl) {
    countEl.innerText = `${filtered.length} Home Fellowship${filtered.length === 1 ? '' : 's'} available`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-4 glass-panel rounded-3xl p-8 max-w-md mx-auto">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto text-2xl">
          <i data-lucide="compass" class="w-7 h-7"></i>
        </div>
        <h4 class="font-extrabold text-lg text-slate-900 dark:text-zinc-100">No Fellowships Found</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          ${discoverySearchQuery ? `No fellowship matched "${discoverySearchQuery}". Try clearing the search or plant a new fellowship in your neighborhood.` : 'No active fellowships have been planted yet.'}
        </p>
        <button onclick="window.openCreateFellowshipModal()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm inline-flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Create First Fellowship
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(f => {
    const isMember = (window.userMemberships || []).some(m => m.fellowshipId === f.id);
    const myMem = (window.userMemberships || []).find(m => m.fellowshipId === f.id);
    const isActive = window.activeFellowshipId === f.id;
    const memberCount = f.memberCount || 1;

    return `
      <div class="glass-panel rounded-3xl p-6 flex flex-col justify-between border ${
        isActive ? 'border-blue-500/80 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-zinc-800'
      } hover:border-blue-400/50 transition-all space-y-5">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${f.city || 'Local Fellowship'}
              </span>
              <h3 class="font-display font-black text-xl text-slate-900 dark:text-zinc-100 mt-1">${f.name}</h3>
            </div>
            ${isMember ? `
              <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isActive ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }">
                ${isActive ? 'Active Cell' : 'Joined'}
              </span>
            ` : ''}
          </div>

          ${f.motto ? `<p class="text-xs font-serif italic text-slate-600 dark:text-zinc-300 font-semibold">"${f.motto}"</p>` : ''}
          ${f.description ? `<p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-3">${f.description}</p>` : ''}

          <div class="pt-2 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2 text-[11px]">
            <div class="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-500 shrink-0"></i>
              <span>${f.day || 'Wednesdays'} at ${f.time || '6:00 PM'}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <i data-lucide="users" class="w-3.5 h-3.5 text-indigo-500 shrink-0"></i>
              <span>${memberCount} Believer${memberCount === 1 ? '' : 's'}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600 dark:text-zinc-400 col-span-2">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-amber-500 shrink-0"></i>
              <span class="truncate">${f.address}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600 dark:text-zinc-400 col-span-2">
              <i data-lucide="user-check" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>
              <span>Leader: <strong class="text-slate-800 dark:text-zinc-200">${f.leaderName || 'Cell Leader'}</strong></span>
            </div>
            ${f.phone ? `
              <div class="flex items-center gap-2 text-slate-600 dark:text-zinc-400 col-span-2">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-cyan-500 shrink-0"></i>
                <a href="tel:${f.phone}" class="hover:underline font-mono text-[10px] text-blue-600 dark:text-blue-400">${f.phone}</a>
              </div>
            ` : ''}
            ${f.additionalInfo ? `
              <div class="col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                <strong class="text-slate-700 dark:text-zinc-300 block mb-0.5">Admin Notice:</strong> ${f.additionalInfo}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex gap-2">
          ${
            isMember
              ? `
                <button onclick="window.switchActiveFellowship('${f.id}'); window.enterMainPlatform();" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                  Enter Fellowship <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              `
              : `
                <button onclick="window.joinFellowship('${f.id}')" class="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                  Join Fellowship <i data-lucide="user-plus" class="w-4 h-4"></i>
                </button>
              `
          }
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
};

// Create Fellowship Modal
window.openCreateFellowshipModal = function() {
  document.getElementById('create-fellowship-modal')?.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.closeCreateFellowshipModal = function() {
  document.getElementById('create-fellowship-modal')?.classList.add('hidden');
};

window.submitCreateFellowshipForm = async function(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('create-fellowship-name')?.value;
  const motto = document.getElementById('create-fellowship-motto')?.value;
  const address = document.getElementById('create-fellowship-address')?.value;
  const city = document.getElementById('create-fellowship-city')?.value;
  const day = document.getElementById('create-fellowship-day')?.value;
  const time = document.getElementById('create-fellowship-time')?.value;
  const phone = document.getElementById('create-fellowship-phone')?.value;
  const description = document.getElementById('create-fellowship-desc')?.value;
  const additionalInfo = document.getElementById('create-fellowship-info')?.value;
  const fileInput = document.getElementById('create-fellowship-cover-file');

  if (!name || !address) {
    window.showToast?.("Please provide both a Fellowship Name and an Address.", "error");
    return;
  }

  const btn = document.getElementById('create-fellowship-submit-btn');
  const originalText = btn ? btn.innerHTML : 'Create Fellowship';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-1">⌛</span> Planting Fellowship...`;
  }

  try {
    let imageUrl = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80';

    // Cloudinary upload if file selected
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const uploadRes = await window.uploadToCloudinary(file, 'homecell/fellowships');
      imageUrl = uploadRes.url;
    }

    await window.createHomeFellowship({
      name,
      motto,
      address,
      city,
      day,
      time,
      phone,
      description,
      imageUrl,
      additionalInfo
    });

    window.closeCreateFellowshipModal();
    // Reset form
    document.getElementById('create-fellowship-form')?.reset();
  } catch (err) {
    console.error("Create fellowship error:", err);
    window.showToast?.(err.message || "Failed to create fellowship.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
};

// -------------------------------------------------------------
// 2. ACTIVE FELLOWSHIP SANCTUARY VIEWS
// -------------------------------------------------------------

window.currentFellowshipSubTab = 'dashboard';

window.switchFellowshipSubTab = function(subTab) {
  window.currentFellowshipSubTab = subTab;
  const tabs = ['dashboard', 'chat', 'members', 'quizzes', 'events', 'resources'];

  tabs.forEach(t => {
    const btn = document.getElementById(`fellowship-tab-${t}`);
    const view = document.getElementById(`fellowship-view-${t}`);
    if (btn) {
      if (t === subTab) {
        btn.className = "px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer bg-blue-600 text-white shadow-xs shrink-0 flex items-center gap-1.5";
      } else {
        btn.className = "px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 shrink-0 flex items-center gap-1.5";
      }
    }
    if (view) {
      if (t === subTab) view.classList.remove('hidden');
      else view.classList.add('hidden');
    }
  });

  if (subTab === 'chat') window.loadFellowshipMessages();
  if (subTab === 'members') window.loadFellowshipMembers();
  if (subTab === 'quizzes') window.syncFellowshipQuizzes();
  if (subTab === 'events') window.syncFellowshipEvents();
};

window.syncFellowshipDashboard = function() {
  const f = window.activeFellowship || (window.allFellowships || []).find(x => x.id === window.activeFellowshipId);
  const container = document.getElementById('fellowship-dashboard-content');
  if (!container) return;

  if (!f) {
    container.innerHTML = `
      <div class="glass-panel rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-8">
        <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto text-2xl">
          <i data-lucide="home" class="w-8 h-8"></i>
        </div>
        <h3 class="font-display font-black text-2xl text-slate-900 dark:text-zinc-100">Select a Home Fellowship</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          Join or choose a Home Fellowship to access your private community sanctuary, prayers, and quizzes.
        </p>
        <button onclick="window.showDiscoveryView()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2">
          <i data-lucide="compass" class="w-4 h-4"></i> Browse All Fellowships
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const userMem = (window.userMemberships || []).find(m => m.fellowshipId === f.id);
  const roleText = userMem?.role === 'leader' ? 'Cell Leader' : (userMem?.role === 'moderator' ? 'Moderator' : 'Member');
  const isLeaderOrAdmin = userMem?.role === 'leader' || window.checkIsSuperAdmin();

  container.innerHTML = `
    <!-- Fellowship Banner Hero -->
    <div class="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div class="h-48 sm:h-60 w-full bg-cover bg-center relative" style="background-image: url('${f.imageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80'}');">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent"></div>
        
        ${isLeaderOrAdmin ? `
          <div class="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button onclick="window.openChangeCoverModal('fellowship_cover', '${f.id}', '${f.name.replace(/'/g, "\\'")}', '${f.imageUrl || ''}')" class="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5 border border-white/20 cursor-pointer transition-all hover:scale-105">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>Change Cover</span>
            </button>
            <button onclick="window.openChangeCoverModal('fellowship_logo', '${f.id}', '${f.name.replace(/'/g, "\\'")}', '${f.logoUrl || ''}')" class="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5 border border-white/20 cursor-pointer transition-all hover:scale-105">
              <i data-lucide="shield" class="w-3.5 h-3.5 text-blue-400"></i>
              <span>Change Logo</span>
            </button>
          </div>
        ` : ''}

        <div class="absolute bottom-6 left-6 right-6 text-white flex items-end gap-4">
          <!-- Fellowship Logo / Emblem -->
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 dark:bg-zinc-900/80 border-2 border-white/30 backdrop-blur-md flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
            ${f.logoUrl ? `
              <img src="${f.logoUrl}" alt="${f.name} Logo" class="w-full h-full object-cover" />
            ` : `
              <div class="text-2xl sm:text-3xl font-black text-amber-400 select-none">
                ${f.name ? f.name.charAt(0).toUpperCase() : '⛪'}
              </div>
            `}
          </div>

          <div class="space-y-1 min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-xs">
                📍 ${f.city || 'Home Cell'}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/90 text-slate-950 backdrop-blur-xs">
                Your Role: ${roleText}
              </span>
            </div>
            <h2 class="font-display font-black text-2xl sm:text-4xl text-white drop-shadow-sm truncate">${f.name}</h2>
            ${f.motto ? `<p class="text-xs sm:text-sm font-serif italic text-slate-200 font-medium max-w-2xl line-clamp-1">"${f.motto}"</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Quick Action Bar -->
      <div class="p-6 bg-white dark:bg-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-zinc-800">
        <button onclick="window.switchFellowshipSubTab('chat')" class="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-all text-left space-y-1 cursor-pointer border border-blue-100 dark:border-blue-900/50">
          <i data-lucide="message-square" class="w-5 h-5 text-blue-600"></i>
          <span class="text-xs font-black text-slate-900 dark:text-zinc-100 block">Fellowship Chat</span>
          <span class="text-[10px] text-slate-500">Private believer lounge</span>
        </button>
        <button onclick="window.switchFellowshipSubTab('members')" class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-all text-left space-y-1 cursor-pointer border border-indigo-100 dark:border-indigo-900/50">
          <i data-lucide="users" class="w-5 h-5 text-indigo-600"></i>
          <span class="text-xs font-black text-slate-900 dark:text-zinc-100 block">Directory</span>
          <span class="text-[10px] text-slate-500">${f.memberCount || 1} Members</span>
        </button>
        <button onclick="window.switchFellowshipSubTab('quizzes')" class="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-all text-left space-y-1 cursor-pointer border border-purple-100 dark:border-purple-900/50">
          <i data-lucide="help-circle" class="w-5 h-5 text-purple-600"></i>
          <span class="text-xs font-black text-slate-900 dark:text-zinc-100 block">Trivia Quizzes</span>
          <span class="text-[10px] text-slate-500">Bible study challenges</span>
        </button>
        <button onclick="window.switchFellowshipSubTab('events')" class="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-all text-left space-y-1 cursor-pointer border border-amber-100 dark:border-amber-900/50">
          <i data-lucide="calendar" class="w-5 h-5 text-amber-600"></i>
          <span class="text-xs font-black text-slate-900 dark:text-zinc-100 block">Gatherings</span>
          <span class="text-[10px] text-slate-500">${f.day || 'Weekly'}</span>
        </button>
      </div>
    </div>

    <!-- Fellowship Information Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left Column: Fellowship Details & Schedule -->
      <div class="md:col-span-2 space-y-6">
        <div class="glass-panel rounded-3xl p-6 space-y-4">
          <h4 class="font-black text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4 text-blue-600"></i> About Our Fellowship
          </h4>
          <p class="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
            ${f.description || 'Welcome to our Home Fellowship family! We gather regularly to study the Word of God, pray together, and support one another in Christ.'}
          </p>

          <div class="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-zinc-800 text-xs">
            <div class="space-y-1">
              <span class="text-[10px] font-black uppercase text-slate-400">Meeting Schedule</span>
              <p class="font-bold text-slate-800 dark:text-zinc-200">Every ${f.day || 'Wednesday'} at ${f.time || '6:00 PM'}</p>
            </div>
            <div class="space-y-1">
              <span class="text-[10px] font-black uppercase text-slate-400">Cell Leader</span>
              <p class="font-bold text-slate-800 dark:text-zinc-200">${f.leaderName || 'Cell Leader'}</p>
            </div>
            <div class="space-y-1 sm:col-span-2">
              <span class="text-[10px] font-black uppercase text-slate-400">Physical Address</span>
              <p class="font-bold text-slate-800 dark:text-zinc-200">${f.address}</p>
            </div>
            ${f.phone ? `
              <div class="space-y-1 sm:col-span-2">
                <span class="text-[10px] font-black uppercase text-slate-400">Fellowship Phone</span>
                <p class="font-bold text-blue-600 dark:text-blue-400"><a href="tel:${f.phone}">${f.phone}</a></p>
              </div>
            ` : ''}
            ${f.additionalInfo ? `
              <div class="sm:col-span-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                <strong class="font-black block mb-0.5">Admin Notice:</strong>
                ${f.additionalInfo}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Scripture Focus of the Week -->
        <div class="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white space-y-2.5 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Scripture Focus</span>
          <p class="font-display font-bold text-base sm:text-lg italic leading-relaxed text-slate-100">
            "And they continued steadfastly in the apostles' doctrine and fellowship, in the breaking of bread, and in prayers."
          </p>
          <span class="text-xs font-mono font-bold text-blue-300 block">— Acts 2:42</span>
        </div>
      </div>

      <!-- Right Column: Leaders, Actions & Controls -->
      <div class="space-y-6">
        <div class="glass-panel rounded-3xl p-6 space-y-4">
          <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-500"></i> Fellowship Leadership
          </h4>
          <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60">
            <div class="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              ${(f.leaderName || 'L').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="text-xs font-black text-slate-900 dark:text-zinc-100">${f.leaderName || 'Cell Leader'}</div>
              <div class="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Cell Leader / Admin</div>
              ${f.phone ? `<a href="tel:${f.phone}" class="text-[10px] text-slate-500 hover:underline block">${f.phone}</a>` : ''}
            </div>
          </div>

          <div class="pt-2 space-y-2">
            <button onclick="window.switchFellowshipSubTab('chat')" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2">
              <i data-lucide="message-square" class="w-4 h-4"></i> Send Message in Chat
            </button>
            <button onclick="window.copyFellowshipDetails('${f.id}')" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
              <i data-lucide="share-2" class="w-4 h-4"></i> Share Fellowship Address
            </button>
            <button onclick="window.showDiscoveryView()" class="w-full py-2 text-slate-500 hover:text-blue-600 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center block">
              Discover Other Fellowships
            </button>
          </div>
        </div>

        ${isLeaderOrAdmin ? `
          <div class="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <span class="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              👑 Leader Controls
            </span>
            <p class="text-xs text-slate-600 dark:text-zinc-400">
              As Cell Leader, you can schedule events, create fellowship quizzes, and coordinate members.
            </p>
            <div class="flex gap-2">
              <button onclick="window.openCreateQuizModal('${f.id}')" class="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs">
                + Create Quiz
              </button>
              <button onclick="window.openCreateEventModal('${f.id}')" class="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs">
                + Add Event
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
};

window.copyFellowshipDetails = function(fId) {
  const f = (window.allFellowships || []).find(x => x.id === fId);
  if (!f) return;
  const text = `Join us at ${f.name}!\nAddress: ${f.address}\nMeeting: Every ${f.day || 'Wednesday'} at ${f.time || '6:00 PM'}\nLeader: ${f.leaderName} (${f.phone || ''})`;
  navigator.clipboard?.writeText(text).then(() => {
    window.showToast?.("Fellowship details copied to clipboard!", "success");
  }).catch(() => {
    window.showToast?.("Failed to copy details.", "error");
  });
};

// -------------------------------------------------------------
// 3. PRIVATE FELLOWSHIP CHAT
// -------------------------------------------------------------

window.loadFellowshipMessages = function() {
  const fId = window.activeFellowshipId;
  const container = document.getElementById('fellowship-chat-messages-container');
  if (!container || !fId) return;

  if (activeFellowshipChatListener) activeFellowshipChatListener();

  activeFellowshipChatListener = window.db.collection('fellowship_messages')
    .where('fellowshipId', '==', fId)
    .orderBy('createdAt', 'asc')
    .limit(80)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `
          <div class="py-16 text-center space-y-2 text-slate-400">
            <i data-lucide="message-square" class="w-10 h-10 mx-auto opacity-40 mb-2"></i>
            <p class="font-bold text-xs">No messages yet in this fellowship sanctuary.</p>
            <p class="text-[11px]">Be the first to share an encouragement or prayer!</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const currentUser = window.auth?.currentUser;

      snap.forEach(doc => {
        const msg = doc.data();
        const isMe = currentUser && msg.authorId === currentUser.uid;

        const row = document.createElement('div');
        row.className = `flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`;

        const timeStr = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';

        row.innerHTML = `
          <div class="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-800 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            ${msg.authorPhoto ? `<img src="${msg.authorPhoto}" class="w-full h-full object-cover" />` : (msg.authorName || 'B').charAt(0).toUpperCase()}
          </div>
          <div class="space-y-1 max-w-[85%]">
            <div class="flex items-center gap-2 ${isMe ? 'justify-end' : ''}">
              <span class="text-[11px] font-black text-slate-700 dark:text-zinc-300">${isMe ? 'You' : msg.authorName}</span>
              <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
            </div>
            <div class="p-3.5 rounded-2xl text-xs leading-relaxed ${
              isMe
                ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 rounded-tl-xs shadow-xs'
            }">
              ${msg.text ? `<p class="whitespace-pre-wrap break-words">${msg.text}</p>` : ''}
              ${msg.mediaUrl ? `
                <div class="mt-2 rounded-xl overflow-hidden max-w-sm">
                  ${msg.mediaType === 'video'
                    ? `<video src="${msg.mediaUrl}" controls class="w-full max-h-64 rounded-xl object-contain bg-black"></video>`
                    : `<img src="${msg.mediaUrl}" class="w-full max-h-64 object-cover rounded-xl" onclick="window.open('${msg.mediaUrl}', '_blank')" />`
                  }
                </div>
              ` : ''}
            </div>
          </div>
        `;

        container.appendChild(row);
      });

      if (window.lucide) window.lucide.createIcons();
      container.scrollTop = container.scrollHeight;
    }, err => {
      console.warn("Fellowship chat error:", err);
    });
};

window.sendFellowshipMessage = async function(e) {
  if (e) e.preventDefault();
  const fId = window.activeFellowshipId;
  const user = window.auth?.currentUser;
  if (!user || !fId) return;

  const input = document.getElementById('fellowship-chat-input');
  const fileInput = document.getElementById('fellowship-chat-file-input');
  const text = input ? input.value.trim() : '';

  if (!text && (!fileInput || !fileInput.files || fileInput.files.length === 0)) return;

  let mediaUrl = null;
  let mediaType = null;

  try {
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      window.showToast?.("Uploading media to fellowship...", "info");
      const uploadRes = await window.uploadToCloudinary(file, 'homecell/fellowships');
      mediaUrl = uploadRes.url;
      mediaType = uploadRes.resourceType;
    }

    await window.db.collection('fellowship_messages').add({
      fellowshipId: fId,
      authorId: user.uid,
      authorName: window.currentUserProfile?.displayName || user.displayName || 'Believer',
      authorPhoto: window.currentUserProfile?.photoURL || user.photoURL || '',
      text: text,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    if (input) input.value = '';
    if (fileInput) fileInput.value = '';
    document.getElementById('fellowship-chat-attachment-preview')?.classList.add('hidden');
    window.soundEngine?.playMessage?.();
  } catch (err) {
    console.error("Send message error:", err);
    window.showToast?.("Failed to send message: " + err.message, "error");
  }
};

// -------------------------------------------------------------
// 4. FELLOWSHIP MEMBERS DIRECTORY & ROLE MANAGEMENT
// -------------------------------------------------------------

window.loadFellowshipMembers = function() {
  const fId = window.activeFellowshipId;
  const container = document.getElementById('fellowship-members-container');
  if (!container || !fId) return;

  if (activeFellowshipMembersListener) activeFellowshipMembersListener();

  activeFellowshipMembersListener = window.db.collection('memberships')
    .where('fellowshipId', '==', fId)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No registered members found.</div>`;
        return;
      }

      const isLeaderOrSuperAdmin = window.activeFellowshipRole === 'leader' || window.checkIsSuperAdmin();

      snap.forEach(doc => {
        const m = doc.data();
        const roleLabel = m.role === 'leader' ? 'Cell Leader' : (m.role === 'moderator' ? 'Moderator' : 'Member');
        const roleBadgeColor = m.role === 'leader' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : (m.role === 'moderator' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400');

        const card = document.createElement('div');
        card.className = "p-4 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 dark:border-zinc-800";
        card.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
              ${m.userPhotoURL ? `<img src="${m.userPhotoURL}" class="w-full h-full object-cover" />` : (m.userDisplayName || 'B').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="font-black text-xs text-slate-900 dark:text-zinc-100">${m.userDisplayName || 'Believer'}</div>
              <div class="text-[10px] text-slate-400">${m.userEmail || ''}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${roleBadgeColor}">
              ${roleLabel}
            </span>

            ${isLeaderOrSuperAdmin && m.userId !== window.auth?.currentUser?.uid ? `
              <div class="flex items-center gap-1">
                <select onchange="window.updateMemberRole('${doc.id}', this.value)" class="text-[10px] font-bold p-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <option value="member" ${m.role === 'member' ? 'selected' : ''}>Member</option>
                  <option value="moderator" ${m.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                  <option value="leader" ${m.role === 'leader' ? 'selected' : ''}>Cell Leader</option>
                </select>
                <button onclick="window.removeMemberFromFellowship('${doc.id}', '${m.fellowshipId}')" class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer" title="Remove Member">
                  <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            ` : ''}
          </div>
        `;
        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Members directory error:", err));
};

window.updateMemberRole = async function(membershipDocId, newRole) {
  try {
    await window.db.collection('memberships').doc(membershipDocId).update({
      role: newRole
    });
    window.showToast?.(`Member role updated to ${newRole}!`, "success");
  } catch (err) {
    console.error("Update role error:", err);
    window.showToast?.("Failed to update role: " + err.message, "error");
  }
};

window.removeMemberFromFellowship = async function(membershipDocId, fellowshipId) {
  if (!confirm("Are you sure you want to remove this member from the fellowship?")) return;
  try {
    await window.db.collection('memberships').doc(membershipDocId).delete();
    await window.db.collection('fellowships').doc(fellowshipId).update({
      memberCount: window.firebase.firestore.FieldValue.increment(-1)
    }).catch(() => {});
    window.showToast?.("Member removed from fellowship.", "info");
  } catch (err) {
    console.error("Remove member error:", err);
    window.showToast?.("Failed to remove member: " + err.message, "error");
  }
};

// -------------------------------------------------------------
// 5. FELLOWSHIP EVENTS
// -------------------------------------------------------------

window.syncFellowshipEvents = function() {
  const fId = window.activeFellowshipId;
  const container = document.getElementById('fellowship-events-container');
  if (!container || !fId) return;

  if (activeFellowshipEventsListener) activeFellowshipEventsListener();

  activeFellowshipEventsListener = window.db.collection('events')
    .where('fellowshipId', '==', fId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 text-xs">
            <i data-lucide="calendar" class="w-10 h-10 mx-auto opacity-40 mb-2"></i>
            <p class="font-bold">No upcoming events scheduled yet.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      snap.forEach(doc => {
        const ev = doc.data();
        const card = document.createElement('div');
        card.className = "p-5 rounded-2xl glass-panel space-y-3 border border-slate-200 dark:border-zinc-800";
        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-black uppercase text-amber-500 tracking-wider">${ev.date || 'Upcoming'}</span>
              <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100 mt-0.5">${ev.title}</h4>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">${ev.time || ''}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${ev.description || ''}</p>
          ${ev.location ? `
            <div class="text-[11px] text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-500"></i> ${ev.location}
            </div>
          ` : ''}
        `;
        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Events error:", err));
};

window.openCreateEventModal = function(fId) {
  document.getElementById('create-event-modal')?.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.closeCreateEventModal = function() {
  document.getElementById('create-event-modal')?.classList.add('hidden');
};

window.submitCreateEventForm = async function(e) {
  if (e) e.preventDefault();
  const fId = window.activeFellowshipId;
  const user = window.auth?.currentUser;
  if (!fId || !user) return;

  const title = document.getElementById('create-event-title')?.value;
  const date = document.getElementById('create-event-date')?.value;
  const time = document.getElementById('create-event-time')?.value;
  const location = document.getElementById('create-event-location')?.value;
  const desc = document.getElementById('create-event-desc')?.value;

  if (!title || !date) {
    window.showToast?.("Title and Date are required.", "error");
    return;
  }

  try {
    const f = (window.allFellowships || []).find(x => x.id === fId);
    await window.db.collection('events').add({
      fellowshipId: fId,
      fellowshipName: f?.name || 'Home Fellowship',
      title: title.trim(),
      date: date,
      time: time || '6:00 PM',
      location: location ? location.trim() : (f?.address || ''),
      description: desc ? desc.trim() : '',
      createdBy: user.uid,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    window.closeCreateEventModal();
    document.getElementById('create-event-form')?.reset();
    window.showToast?.("Event scheduled successfully!", "success");
  } catch (err) {
    console.error("Create event error:", err);
    window.showToast?.("Failed to schedule event: " + err.message, "error");
  }
};

window.initCellsModule = initCellsModule;
