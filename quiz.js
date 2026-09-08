// quiz.js
// Home.cell - Fellowship-Specific Scripture Quizzes with Role-Based Permissions & Live Scoring

const DEFAULT_TRIVIA_BANK = [
  {
    question: "Who led the Israelites across the Red Sea on dry ground?",
    options: ["Joshua", "Moses", "Aaron", "Gideon"],
    answerIndex: 1,
    scriptureReference: "Exodus 14:21-22"
  },
  {
    question: "How many days and nights did Jesus fast in the wilderness?",
    options: ["7 days", "12 days", "40 days", "100 days"],
    answerIndex: 2,
    scriptureReference: "Matthew 4:2"
  },
  {
    question: "Which prophet was swallowed by a great fish?",
    options: ["Elijah", "Jonah", "Isaiah", "Jeremiah"],
    answerIndex: 1,
    scriptureReference: "Jonah 1:17"
  },
  {
    question: "What is the longest chapter in the Bible?",
    options: ["Psalm 23", "Psalm 119", "Isaiah 53", "Matthew 1"],
    answerIndex: 1,
    scriptureReference: "Psalm 119 (176 verses)"
  },
  {
    question: "What was the name of the garden where Adam and Eve first lived?",
    options: ["Gethsemane", "Eden", "Galilee", "Bethel"],
    answerIndex: 1,
    scriptureReference: "Genesis 2:8"
  },
  {
    question: "What did David use to defeat the giant Goliath?",
    options: ["A sword and spear", "A sling and five smooth stones", "A chariot of fire", "A golden bow"],
    answerIndex: 1,
    scriptureReference: "1 Samuel 17:40, 49"
  },
  {
    question: "What is the first Fruit of the Spirit mentioned in Galatians 5:22?",
    options: ["Joy", "Peace", "Love", "Patience"],
    answerIndex: 2,
    scriptureReference: "Galatians 5:22"
  },
  {
    question: "In what city was Jesus born?",
    options: ["Nazareth", "Jerusalem", "Bethlehem", "Capernaum"],
    answerIndex: 2,
    scriptureReference: "Luke 2:4-7"
  }
];

let fellowshipQuizzesListener = null;
let currentActiveQuiz = null;
let currentQuestionIndex = 0;
let userQuizScore = 0;
let quizTimerInterval = null;
let quizTimeRemaining = 20;

// Question Builder & Media State
let builderQuestions = [];
let selectedQuizThumbnailFile = null;
let selectedQuizThumbnailDataUrl = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function initQuizModule() {
  syncFellowshipQuizzes();
}

// -------------------------------------------------------------
// SYNC FELLOWSHIP QUIZZES
// -------------------------------------------------------------

window.syncFellowshipQuizzes = function() {
  const fId = window.activeFellowshipId;
  const container = document.getElementById('fellowship-quizzes-grid');
  if (!container) return;

  if (fellowshipQuizzesListener) fellowshipQuizzesListener();

  if (!fId) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 text-xs">
        Select a fellowship to view its scripture trivia challenges.
      </div>
    `;
    return;
  }

  fellowshipQuizzesListener = window.db.collection('quizzes')
    .where('fellowshipId', '==', fId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center space-y-3 glass-panel rounded-3xl p-8 max-w-md mx-auto">
            <div class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto text-xl">
              <i data-lucide="help-circle" class="w-6 h-6"></i>
            </div>
            <h4 class="font-extrabold text-sm text-slate-800 dark:text-zinc-200">No Fellowship Quizzes Yet</h4>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              Create a custom scripture trivia challenge for your fellow members!
            </p>
            <button onclick="window.openCreateQuizModal('${fId}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i> Create First Quiz
            </button>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const currentUser = window.auth?.currentUser;
      const isSuperAdmin = window.checkIsSuperAdmin();
      const isFellowshipLeader = window.activeFellowshipRole === 'leader';

      snap.forEach(doc => {
        const q = doc.data();
        const quizId = doc.id;
        const isCreator = currentUser && q.createdBy === currentUser.uid;
        // Delete permissions: Creator, Fellowship Leader, or Super Admin
        const canDelete = isCreator || isFellowshipLeader || isSuperAdmin;
        const qCount = q.questions?.length || 0;

        const card = document.createElement('div');
        card.className = "glass-panel rounded-3xl p-6 flex flex-col justify-between border border-slate-200 dark:border-zinc-800 hover:border-purple-400/50 transition-all space-y-4 shadow-xs";

        card.innerHTML = `
          <div class="space-y-3">
            ${q.thumbnailUrl ? `
              <div class="w-full h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                <img src="${escapeHtml(q.thumbnailUrl)}" alt="${escapeHtml(q.title)}" class="w-full h-full object-cover" />
              </div>
            ` : ''}
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <i data-lucide="book" class="w-3 h-3"></i> ${q.fellowshipName || 'Fellowship Quiz'}
                </span>
                <h4 class="font-display font-black text-lg text-slate-900 dark:text-zinc-100 mt-0.5">${q.title}</h4>
              </div>
              ${canDelete ? `
                <button onclick="window.deleteFellowshipQuiz('${quizId}')" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer" title="Delete Quiz">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>

            ${q.description ? `<p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2">${q.description}</p>` : ''}

            <div class="pt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
              <span class="flex items-center gap-1"><i data-lucide="layers" class="w-3.5 h-3.5 text-blue-500"></i> ${qCount} Questions</span>
              <span class="flex items-center gap-1"><i data-lucide="user" class="w-3.5 h-3.5 text-indigo-500"></i> By ${q.creatorName || 'Member'}</span>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button onclick="window.startQuizGameplay('${quizId}')" class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2">
              Start Quiz <i data-lucide="play" class="w-4 h-4"></i>
            </button>
          </div>
        `;

        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Quiz list error:", err));
};

// -------------------------------------------------------------
// QUESTION BUILDER & JSON TEMPLATES
// -------------------------------------------------------------

function renderBuilderQuestions() {
  const container = document.getElementById('quiz-builder-questions-list');
  const countEl = document.getElementById('quiz-builder-count');
  if (countEl) countEl.innerText = builderQuestions.length;
  if (!container) return;

  if (builderQuestions.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400 dark:text-zinc-500 text-xs border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
        No questions yet. Click <strong class="text-purple-600 dark:text-purple-400 font-bold">+ Add Question</strong> or <strong class="text-amber-600 dark:text-amber-400 font-bold">Auto-fill 5 Trivia</strong> to get started.
      </div>
    `;
    return;
  }

  container.innerHTML = builderQuestions.map((q, idx) => {
    return `
      <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-850 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Question ${idx + 1}</span>
          <button type="button" onclick="window.removeQuestionFromBuilder(${idx})" class="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-all cursor-pointer" title="Remove question">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <div>
          <input type="text" placeholder="Enter Scripture question..." value="${escapeHtml(q.question)}" oninput="window.updateBuilderQuestionField(${idx}, 'question', this.value)" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none" required />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${(q.options || ["", "", "", ""]).map((opt, optIdx) => `
            <div class="flex items-center gap-1.5 p-1.5 rounded-xl border ${q.answerIndex === optIdx ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}">
              <label class="cursor-pointer flex items-center gap-1 pl-1" title="Mark as correct answer">
                <input type="radio" name="builder-correct-${idx}" value="${optIdx}" ${q.answerIndex === optIdx ? 'checked' : ''} onchange="window.updateBuilderQuestionField(${idx}, 'answerIndex', ${optIdx})" class="text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                <span class="text-[10px] font-bold font-mono text-slate-500 dark:text-zinc-400">${String.fromCharCode(65 + optIdx)}</span>
              </label>
              <input type="text" placeholder="Option ${String.fromCharCode(65 + optIdx)}" value="${escapeHtml(opt)}" oninput="window.updateBuilderQuestionField(${idx}, 'option', this.value, ${optIdx})" class="flex-1 p-1 bg-transparent text-xs outline-none" required />
            </div>
          `).join('')}
        </div>

        <div>
          <input type="text" placeholder="Scripture Reference (optional, e.g. John 3:16)" value="${escapeHtml(q.scriptureReference || '')}" oninput="window.updateBuilderQuestionField(${idx}, 'scriptureReference', this.value)" class="w-full p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-mono focus:ring-1 focus:ring-purple-500 outline-none" />
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.addBlankQuestionToBuilder = function(data = null) {
  builderQuestions.push({
    question: data?.question || '',
    options: Array.isArray(data?.options) && data.options.length >= 2 ? [...data.options] : ['', '', '', ''],
    answerIndex: typeof data?.answerIndex === 'number' ? data.answerIndex : 0,
    scriptureReference: data?.scriptureReference || ''
  });
  renderBuilderQuestions();
};

window.removeQuestionFromBuilder = function(idx) {
  if (idx >= 0 && idx < builderQuestions.length) {
    builderQuestions.splice(idx, 1);
    renderBuilderQuestions();
  }
};

window.updateBuilderQuestionField = function(idx, field, val, optIdx) {
  if (!builderQuestions[idx]) return;
  if (field === 'question') {
    builderQuestions[idx].question = val;
  } else if (field === 'option') {
    if (!Array.isArray(builderQuestions[idx].options)) {
      builderQuestions[idx].options = ['', '', '', ''];
    }
    builderQuestions[idx].options[optIdx] = val;
  } else if (field === 'answerIndex') {
    builderQuestions[idx].answerIndex = parseInt(val, 10) || 0;
    renderBuilderQuestions();
  } else if (field === 'scriptureReference') {
    builderQuestions[idx].scriptureReference = val;
  }
};

window.autoLoadPresetQuizQuestions = function(showToast = true) {
  const shuffled = [...DEFAULT_TRIVIA_BANK].sort(() => Math.random() - 0.5).slice(0, 5);
  builderQuestions = shuffled.map(item => ({
    question: item.question,
    options: [...item.options],
    answerIndex: item.answerIndex,
    scriptureReference: item.scriptureReference || ''
  }));
  renderBuilderQuestions();
  if (showToast) {
    window.showToast?.("Loaded 5 Scripture Trivia questions into bank!", "success");
  }
};

// Download standard JSON template for bulk creation
window.downloadQuizJsonTemplate = function() {
  const template = {
    title: "Epistles of Grace Challenge",
    description: "A scripture trivia challenge testing knowledge on grace, faith, and Paul's epistles.",
    timeLimit: 20,
    questions: [
      {
        question: "What is the first Fruit of the Spirit mentioned in Galatians 5:22?",
        options: ["Joy", "Peace", "Love", "Patience"],
        answerIndex: 2,
        scriptureReference: "Galatians 5:22"
      },
      {
        question: "Who led the Israelites across the Red Sea on dry ground?",
        options: ["Joshua", "Moses", "Aaron", "Gideon"],
        answerIndex: 1,
        scriptureReference: "Exodus 14:21-22"
      },
      {
        question: "How many days and nights did Jesus fast in the wilderness?",
        options: ["7 days", "12 days", "40 days", "100 days"],
        answerIndex: 2,
        scriptureReference: "Matthew 4:2"
      },
      {
        question: "Which prophet was swallowed by a great fish?",
        options: ["Elijah", "Jonah", "Isaiah", "Jeremiah"],
        answerIndex: 1,
        scriptureReference: "Jonah 1:17"
      },
      {
        question: "What did David use to defeat the giant Goliath?",
        options: ["A sword and spear", "A sling and five smooth stones", "A chariot of fire", "A golden bow"],
        answerIndex: 1,
        scriptureReference: "1 Samuel 17:40, 49"
      }
    ]
  };

  try {
    const jsonStr = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "homecell-quiz-template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast?.("Quiz JSON template downloaded!", "success");
  } catch (err) {
    console.error("Template download error:", err);
    window.showToast?.("Failed to download template: " + err.message, "error");
  }
};

// Handle JSON upload from file
window.handleQuizJsonUpload = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      let incomingQuestions = [];

      if (Array.isArray(parsed)) {
        incomingQuestions = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.title && !document.getElementById('create-quiz-title')?.value) {
          const tInput = document.getElementById('create-quiz-title');
          if (tInput) tInput.value = parsed.title;
        }
        if (parsed.description && !document.getElementById('create-quiz-desc')?.value) {
          const dInput = document.getElementById('create-quiz-desc');
          if (dInput) dInput.value = parsed.description;
        }
        if (Array.isArray(parsed.questions)) {
          incomingQuestions = parsed.questions;
        }
      }

      if (!incomingQuestions || incomingQuestions.length === 0) {
        window.showToast?.("No valid questions array found in JSON.", "error");
        return;
      }

      // Validate and sanitize questions
      const sanitized = incomingQuestions.map(q => {
        const opts = Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [];
        while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
        return {
          question: String(q.question || '').trim(),
          options: opts.slice(0, 4),
          answerIndex: typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < opts.length ? q.answerIndex : 0,
          scriptureReference: String(q.scriptureReference || '').trim()
        };
      }).filter(q => q.question.length > 0);

      if (sanitized.length === 0) {
        window.showToast?.("Could not find complete questions in file.", "error");
        return;
      }

      builderQuestions = sanitized;
      renderBuilderQuestions();
      window.showToast?.(`Imported ${sanitized.length} questions from JSON!`, "success");
    } catch (err) {
      console.error("JSON parse error:", err);
      window.showToast?.("Invalid JSON file: " + err.message, "error");
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};

// Handle Thumbnail Selection & Removal
window.handleQuizThumbnailSelected = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  selectedQuizThumbnailFile = file;
  const reader = new FileReader();
  reader.onload = function(e) {
    selectedQuizThumbnailDataUrl = e.target.result;
    const imgEl = document.getElementById('create-quiz-thumbnail-img');
    const previewEl = document.getElementById('create-quiz-thumbnail-preview');
    if (imgEl) imgEl.src = e.target.result;
    if (previewEl) previewEl.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
};

window.removeQuizThumbnail = function() {
  selectedQuizThumbnailFile = null;
  selectedQuizThumbnailDataUrl = null;
  const fileInput = document.getElementById('create-quiz-thumbnail-file');
  if (fileInput) fileInput.value = '';
  const previewEl = document.getElementById('create-quiz-thumbnail-preview');
  if (previewEl) previewEl.classList.add('hidden');
  const imgEl = document.getElementById('create-quiz-thumbnail-img');
  if (imgEl) imgEl.src = '';
};

// -------------------------------------------------------------
// CREATE QUIZ MODAL
// -------------------------------------------------------------

window.openCreateQuizModal = function(targetFellowshipId) {
  const modal = document.getElementById('create-quiz-modal');
  const select = document.getElementById('create-quiz-fellowship-select');
  if (!modal) return;

  // Populate fellowship select with user's joined fellowships
  if (select) {
    select.innerHTML = (window.userMemberships || []).map(m => {
      const isSelected = (targetFellowshipId || window.activeFellowshipId) === m.fellowshipId;
      return `<option value="${m.fellowshipId}" ${isSelected ? 'selected' : ''}>${m.fellowshipName}</option>`;
    }).join('');
  }

  // Initialize questions if empty
  if (!builderQuestions || builderQuestions.length === 0) {
    window.autoLoadPresetQuizQuestions(false);
  } else {
    renderBuilderQuestions();
  }

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.closeCreateQuizModal = function() {
  document.getElementById('create-quiz-modal')?.classList.add('hidden');
};

window.submitCreateQuizForm = async function(e) {
  if (e) e.preventDefault();
  const user = window.auth?.currentUser;
  if (!user) return;

  const fSelect = document.getElementById('create-quiz-fellowship-select');
  const titleInput = document.getElementById('create-quiz-title');
  const descInput = document.getElementById('create-quiz-desc');
  const submitBtn = document.getElementById('create-quiz-submit-btn');

  const fId = fSelect ? fSelect.value : window.activeFellowshipId;
  const title = titleInput ? titleInput.value.trim() : '';
  const desc = descInput ? descInput.value.trim() : '';

  if (!fId || !title) {
    window.showToast?.("Please choose a fellowship and provide a title.", "error");
    return;
  }

  // Validate questions from builder
  const validQuestions = (builderQuestions || []).filter(q => {
    return q.question && q.question.trim().length > 0 &&
           Array.isArray(q.options) && q.options.filter(o => o && o.trim().length > 0).length >= 2;
  });

  if (validQuestions.length === 0) {
    window.showToast?.("Please add at least 1 valid question with options.", "warning");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Publishing...`;
  }

  const f = (window.allFellowships || []).find(x => x.id === fId);

  // Upload thumbnail if chosen
  let thumbnailUrl = '';
  if (selectedQuizThumbnailFile) {
    try {
      if (typeof window.uploadToCloudinary === 'function') {
        const uploadRes = await window.uploadToCloudinary(selectedQuizThumbnailFile, 'homecell/quizzes');
        thumbnailUrl = uploadRes?.url || selectedQuizThumbnailDataUrl || '';
      } else {
        thumbnailUrl = selectedQuizThumbnailDataUrl || '';
      }
    } catch (uploadErr) {
      console.warn("Quiz thumbnail upload to Cloudinary failed, fallback used:", uploadErr);
      thumbnailUrl = selectedQuizThumbnailDataUrl || '';
    }
  }

  try {
    await window.db.collection('quizzes').add({
      fellowshipId: fId,
      fellowshipName: f?.name || 'Home Fellowship',
      title: title,
      description: desc,
      thumbnailUrl: thumbnailUrl || '',
      createdBy: user.uid,
      creatorName: window.currentUserProfile?.displayName || user.displayName || 'Believer',
      questions: validQuestions,
      timeLimit: 20,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    window.closeCreateQuizModal();
    document.getElementById('create-quiz-form')?.reset();
    window.removeQuizThumbnail();
    builderQuestions = [];
    renderBuilderQuestions();
    window.showToast?.(`Quiz "${title}" created for ${f?.name || 'Fellowship'}!`, "success");
  } catch (err) {
    console.error("Create quiz error:", err);
    window.showToast?.("Failed to create quiz: " + err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Publish Fellowship Quiz";
    }
  }
};

window.deleteFellowshipQuiz = async function(quizId) {
  if (!confirm("Are you sure you want to delete this quiz?")) return;
  try {
    await window.db.collection('quizzes').doc(quizId).delete();
    window.showToast?.("Quiz removed.", "info");
  } catch (err) {
    console.error("Delete quiz error:", err);
    window.showToast?.("Failed to delete quiz: " + err.message, "error");
  }
};

// -------------------------------------------------------------
// LIVE QUIZ GAMEPLAY
// -------------------------------------------------------------

window.startQuizGameplay = async function(quizId) {
  try {
    const doc = await window.db.collection('quizzes').doc(quizId).get();
    if (!doc.exists) {
      window.showToast?.("Quiz not found.", "error");
      return;
    }

    currentActiveQuiz = { id: doc.id, ...doc.data() };
    currentQuestionIndex = 0;
    userQuizScore = 0;

    const modal = document.getElementById('quiz-play-modal');
    if (modal) modal.classList.remove('hidden');

    renderActiveQuestion();
  } catch (err) {
    console.error("Start quiz error:", err);
    window.showToast?.("Could not load quiz: " + err.message, "error");
  }
};

function renderActiveQuestion() {
  if (!currentActiveQuiz || !currentActiveQuiz.questions) return;

  const questions = currentActiveQuiz.questions;
  if (currentQuestionIndex >= questions.length) {
    finishQuizGameplay();
    return;
  }

  const q = questions[currentQuestionIndex];
  const titleEl = document.getElementById('quiz-play-title');
  const badgeEl = document.getElementById('quiz-play-fellowship-badge');
  const progressEl = document.getElementById('quiz-play-progress');
  const timerEl = document.getElementById('quiz-play-timer');
  const questionTextEl = document.getElementById('quiz-play-question-text');
  const scriptureRefEl = document.getElementById('quiz-play-scripture-ref');
  const optionsGrid = document.getElementById('quiz-play-options');

  if (titleEl) titleEl.innerText = currentActiveQuiz.title;
  if (badgeEl) badgeEl.innerText = currentActiveQuiz.fellowshipName || 'Home Fellowship';
  if (progressEl) progressEl.innerText = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  if (questionTextEl) questionTextEl.innerText = q.question;
  if (scriptureRefEl) scriptureRefEl.innerText = q.scriptureReference ? `Scripture: ${q.scriptureReference}` : '';

  // Reset timer
  clearInterval(quizTimerInterval);
  quizTimeRemaining = currentActiveQuiz.timeLimit || 20;
  if (timerEl) timerEl.innerText = `${quizTimeRemaining}s`;

  quizTimerInterval = setInterval(() => {
    quizTimeRemaining--;
    if (timerEl) timerEl.innerText = `${quizTimeRemaining}s`;
    if (quizTimeRemaining <= 0) {
      clearInterval(quizTimerInterval);
      window.selectQuizAnswer(-1); // Time expired
    }
  }, 1000);

  if (optionsGrid) {
    optionsGrid.innerHTML = q.options.map((opt, idx) => {
      return `
        <button onclick="window.selectQuizAnswer(${idx})" id="quiz-opt-btn-${idx}" class="p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 font-bold text-xs sm:text-sm hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs">
          <span>${opt}</span>
          <span class="w-6 h-6 rounded-full border border-slate-300 dark:border-zinc-600 text-[10px] font-mono flex items-center justify-center">${String.fromCharCode(65 + idx)}</span>
        </button>
      `;
    }).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

window.selectQuizAnswer = function(chosenIdx) {
  clearInterval(quizTimerInterval);

  const q = currentActiveQuiz.questions[currentQuestionIndex];
  const isCorrect = chosenIdx === q.answerIndex;

  if (isCorrect) {
    userQuizScore++;
    window.soundEngine?.playSuccess?.();
  } else {
    window.soundEngine?.playIncorrect?.();
  }

  // Highlight choices
  q.options.forEach((_, idx) => {
    const btn = document.getElementById(`quiz-opt-btn-${idx}`);
    if (btn) {
      btn.disabled = true;
      if (idx === q.answerIndex) {
        btn.className = "p-4 rounded-2xl border border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold text-xs sm:text-sm text-left flex items-center justify-between";
      } else if (idx === chosenIdx) {
        btn.className = "p-4 rounded-2xl border border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 font-bold text-xs sm:text-sm text-left flex items-center justify-between";
      }
    }
  });

  setTimeout(() => {
    currentQuestionIndex++;
    renderActiveQuestion();
  }, 1200);
};

async function finishQuizGameplay() {
  clearInterval(quizTimerInterval);
  const total = currentActiveQuiz.questions.length;
  const user = window.auth?.currentUser;

  // Persist attempt
  if (user) {
    try {
      await window.db.collection('quiz_attempts').add({
        quizId: currentActiveQuiz.id,
        quizTitle: currentActiveQuiz.title,
        fellowshipId: currentActiveQuiz.fellowshipId,
        fellowshipName: currentActiveQuiz.fellowshipName,
        userId: user.uid,
        userName: window.currentUserProfile?.displayName || user.displayName || 'Believer',
        score: userQuizScore,
        totalQuestions: total,
        completedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      // Increment user total quiz wins if score > 70%
      if (userQuizScore / total >= 0.7) {
        await window.db.collection('users').doc(user.uid).update({
          quizWinsCount: window.firebase.firestore.FieldValue.increment(1)
        });
      }
    } catch (e) {
      console.warn("Save score error:", e);
    }
  }

  const container = document.getElementById('quiz-play-modal-content');
  if (container) {
    const percent = Math.round((userQuizScore / total) * 100);
    container.innerHTML = `
      <div class="text-center py-8 space-y-4">
        <div class="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto text-3xl shadow-md">
          🏆
        </div>
        <h3 class="font-display font-black text-2xl text-slate-900 dark:text-zinc-100">Quiz Completed!</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          You scored <strong class="text-purple-600 dark:text-purple-400 font-mono text-base">${userQuizScore} / ${total}</strong> (${percent}%)
        </p>

        <div class="pt-4 flex justify-center gap-3">
          <button onclick="window.closeQuizGameplay()" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm">
            Close Challenge
          </button>
        </div>
      </div>
    `;
  }
}

window.closeQuizGameplay = function() {
  clearInterval(quizTimerInterval);
  const modal = document.getElementById('quiz-play-modal');
  if (modal) modal.classList.add('hidden');
};

window.initQuizModule = initQuizModule;
