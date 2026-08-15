// quiz.js
// Highly Interactive, Premium Bible Quizzes & Live Fellowship Trivia Engine for Home.cell

const PREMIUM_QUIZZES = [
  {
    id: "power_of_thanksgiving",
    title: "The Power of Thanksgiving",
    topic: "Biblical Gratitude & Praise",
    difficulty: "All Levels",
    coverGradient: "from-amber-600 via-purple-700 to-indigo-900",
    coverEmoji: "🙌",
    coverImageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
    description: "Explore the deep spiritual power of thanksgiving, praise, and gratitude in Holy Scripture.",
    questions: [
      {
        question: "According to 1 Thessalonians 5:18, in what circumstances are believers instructed to give thanks?",
        options: [
          "Only during times of abundance",
          "In everything, for this is God's will",
          "When prayers are immediately answered",
          "Strictly during holy feast days"
        ],
        answerIdx: 1
      },
      {
        question: "In the Gospel of Luke, how many lepers were healed by Jesus, and how many returned to give thanks?",
        options: [
          "10 healed, 5 returned",
          "12 healed, 12 returned",
          "10 healed, 1 returned",
          "7 healed, 3 returned"
        ],
        answerIdx: 2
      },
      {
        question: "What psalm begins with 'Enter into His gates with thanksgiving, and into His courts with praise'?",
        options: [
          "Psalm 23",
          "Psalm 91",
          "Psalm 100",
          "Psalm 150"
        ],
        answerIdx: 2
      },
      {
        question: "What did Jesus do before performing the miracle of feeding the 5,000 with five loaves and two fish?",
        options: [
          "He gave thanks to the Father",
          "He asked for a sign from heaven",
          "He commanded the wind to stop",
          "He fasted for three days"
        ],
        answerIdx: 0
      },
      {
        question: "In Philippians 4:6, Apostle Paul urges believers to present requests to God with what key attitude?",
        options: [
          "With fasting and weeping",
          "With thanksgiving",
          "With fear and trembling",
          "With loud cries"
        ],
        answerIdx: 1
      },
      {
        question: "Which Old Testament king appointed Levites to record, thank, and praise the LORD God continuously?",
        options: [
          "King Saul",
          "King Solomon",
          "King David",
          "King Hezekiah"
        ],
        answerIdx: 2
      },
      {
        question: "When Paul and Silas were imprisoned in Philippi (Acts 16), what were they doing at midnight before the earthquake?",
        options: [
          "Planning their escape",
          "Praying and singing hymns of thanksgiving to God",
          "Sleeping soundly",
          "Arguing with the jailer"
        ],
        answerIdx: 1
      }
    ]
  },
  {
    id: "gospels_jesus",
    title: "The Life & Miracles of Jesus",
    topic: "New Testament Gospels",
    difficulty: "Medium",
    coverGradient: "from-blue-600 to-indigo-800",
    coverEmoji: "🌟",
    coverImageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    description: "Journey through the four Gospels and test your knowledge of Jesus' teachings, miracles, and resurrection.",
    questions: [
      {
        question: "In which town was Jesus born according to the Gospels?",
        options: ["Nazareth", "Bethlehem", "Jerusalem", "Jericho"],
        answerIdx: 1
      },
      {
        question: "How many baskets of leftovers were gathered after Jesus fed the 5,000?",
        options: ["7 baskets", "10 baskets", "12 baskets", "15 baskets"],
        answerIdx: 2
      },
      {
        question: "Which miracle of Jesus is recorded in all four Gospels?",
        options: ["Walking on water", "Turning water into wine", "Raising Lazarus from the dead", "Feeding of the 5,000"],
        answerIdx: 3
      },
      {
        question: "Who was the Roman governor who sentenced Jesus to be crucified?",
        options: ["Herod Antipas", "Pontius Pilate", "Caesar Augustus", "Felix"],
        answerIdx: 1
      },
      {
        question: "What was Jesus' first recorded miracle?",
        options: ["Curing a leper", "Calming the storm", "Turning water into wine at Cana", "Healing Peter's mother-in-law"],
        answerIdx: 2
      }
    ]
  },
  {
    id: "wisdom_solomon",
    title: "Wisdom of Solomon & Proverbs",
    topic: "Wisdom Literature",
    difficulty: "Hard",
    coverGradient: "from-amber-600 to-amber-900",
    coverEmoji: "👑",
    description: "Challenge your mind with the Proverbs, Ecclesiastes, and the legendary wisdom of King Solomon.",
    questions: [
      {
        question: "What did Solomon ask God for when offered anything he desired?",
        options: ["Long life", "Great riches", "An understanding heart to judge", "The death of his enemies"],
        answerIdx: 2
      },
      {
        question: "According to Proverbs, what is the beginning of wisdom?",
        options: ["The fear of the LORD", "Frequent fastings", "Extensive study", "Silence"],
        answerIdx: 0
      },
      {
        question: "How many proverbs did King Solomon speak, according to 1 Kings?",
        options: ["1,000 proverbs", "3,000 proverbs", "5,000 proverbs", "10,000 proverbs"],
        answerIdx: 1
      },
      {
        question: "Who visited King Solomon to test him with hard questions?",
        options: ["The Queen of Sheba", "The King of Tyre", "The Pharaoh of Egypt", "The Queen of Babylon"],
        answerIdx: 0
      },
      {
        question: "Which book of Wisdom begins with: 'Vanity of vanities, saith the Preacher...'?",
        options: ["Proverbs", "Ecclesiastes", "Song of Solomon", "Job"],
        answerIdx: 1
      }
    ]
  },
  {
    id: "acts_apostles",
    title: "Acts & Early Apostolic Church",
    topic: "Pentecost & Missions",
    difficulty: "Hard",
    coverGradient: "from-purple-600 to-pink-700",
    coverEmoji: "🔥",
    description: "Follow the Holy Spirit's fiery movement in the early Church, from the upper room in Jerusalem to Rome.",
    questions: [
      {
        question: "On which Jewish festival did the Holy Spirit descend upon the apostles?",
        options: ["Passover", "Pentecost", "Tabernacles", "Yom Kippur"],
        answerIdx: 1
      },
      {
        question: "What was the original name of the Apostle Paul before his conversion?",
        options: ["Silas", "Barnabas", "Saul of Tarsus", "Stephen"],
        answerIdx: 2
      },
      {
        question: "In what city were the disciples first called 'Christians'?",
        options: ["Jerusalem", "Antioch", "Damascus", "Ephesus"],
        answerIdx: 1
      },
      {
        question: "Who was chosen by cast lot to replace Judas Iscariot as an apostle?",
        options: ["Matthias", "Barnabas", "Justus", "Timothy"],
        answerIdx: 0
      },
      {
        question: "In whose house did the Apostle Peter preach to the first Gentile converts?",
        options: ["Simon the Tanner", "Cornelius the Centurion", "Ananias", "Lydia"],
        answerIdx: 1
      }
    ]
  }
];

// Active Trivia state
let currentQuiz = null;
let currentQuestionIdx = 0;
let userScore = 0;
let userStreak = 0;
let triviaTimer = null;
let secondsRemaining = 15;
let hasAnsweredCurrent = false;
let triviaTimerLimit = 15;
let pointsPerQuestion = 100;

// Real Firestore state subscriptions
let leaderboardUnsubscribe = null;
let reactionsUnsubscribe = null;
let usersCache = [];
let seenReactionIds = new Set();

function initQuizLounge() {
  renderQuizSelectionGrid();
}

// Real-time listener for quiz participation count on selection cards
const quizParticipantCountUnsubscribers = new Map();

function subscribeToQuizParticipantCount(quizId) {
  if (!quizId) return;
  if (quizParticipantCountUnsubscribers.has(quizId)) {
    quizParticipantCountUnsubscribers.get(quizId)();
  }

  const unsub = window.db.collection('quiz_scores')
    .where('quizId', '==', quizId)
    .onSnapshot(snap => {
      const count = snap.size;
      const countEl = document.getElementById(`quiz-participant-count-${quizId}`);
      if (countEl) {
        countEl.innerHTML = `<i data-lucide="users" class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 inline"></i> <span>${count.toLocaleString()} participant${count === 1 ? '' : 's'}</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }, err => console.warn(`Quiz participant count snapshot error for ${quizId}:`, err));

  quizParticipantCountUnsubscribers.set(quizId, unsub);
}

// Render available quizzes including premium and custom admin-created
function renderQuizSelectionGrid() {
  const grid = document.getElementById('quiz-deck-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // Render Premium Quizzes
  PREMIUM_QUIZZES.forEach(quiz => {
    const card = document.createElement('div');
    card.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:-translate-y-1";
    card.innerHTML = `
      <div class="space-y-3">
        <!-- Cover Art Gradient or Image -->
        <div class="h-36 w-full rounded-2xl bg-gradient-to-br ${quiz.coverGradient} flex items-center justify-center text-4xl shadow-md relative overflow-hidden">
          <div class="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300"></div>
          ${quiz.coverImageUrl ? `<img src="${quiz.coverImageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />` : `<span>${quiz.coverEmoji}</span>`}
          <button onclick="window.copyDirectQuizLink('${quiz.id}')" class="absolute top-2.5 right-2.5 p-2 bg-slate-900/70 hover:bg-slate-900/90 text-amber-300 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-md" title="Copy Direct Quiz Link">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
        </div>
        <div>
          <div class="flex items-center justify-between gap-1.5 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">${quiz.topic}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">${quiz.difficulty}</span>
            </div>
          </div>
          <h4 class="text-lg font-black text-slate-900 dark:text-zinc-50 font-display mt-2 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">${quiz.title}</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">${quiz.description}</p>
          <div id="quiz-participant-count-${quiz.id}" class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-300 mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
            <i data-lucide="users" class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"></i>
            <span>0 participants</span>
          </div>
        </div>
      </div>
      <button onclick="startLiveTriviaSession('${quiz.id}')" class="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md">
        🚀 Join Live Quiz Arena (${quiz.questions.length} Qs)
      </button>
    `;
    grid.appendChild(card);
    subscribeToQuizParticipantCount(quiz.id);
  });

  // Load Custom Admin Created Quizzes from FireStore
  window.db.collection('quizzes').get().then(snap => {
    snap.forEach(doc => {
      const quiz = doc.data();
      const card = document.createElement('div');
      card.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:-translate-y-1";
      card.innerHTML = `
        <div class="space-y-3">
          <div class="h-36 w-full rounded-2xl bg-gradient-to-br ${quiz.coverGradient || 'from-indigo-600 to-purple-800'} flex items-center justify-center text-4xl shadow-md relative overflow-hidden">
            ${quiz.coverImageUrl ? `<img src="${quiz.coverImageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />` : `<span>${quiz.coverEmoji || '✨'}</span>`}
            <button onclick="window.copyDirectQuizLink('${quiz.id}')" class="absolute top-2.5 right-2.5 p-2 bg-slate-900/70 hover:bg-slate-900/90 text-amber-300 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-md" title="Copy Direct Quiz Link">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>
          </div>
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">${quiz.topic || 'Custom Study'}</span>
            <h4 class="text-lg font-black text-slate-900 dark:text-zinc-50 font-display mt-2 leading-tight">${quiz.title}</h4>
            <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">${quiz.description}</p>
            <div id="quiz-participant-count-${quiz.id}" class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-300 mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
              <i data-lucide="users" class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"></i>
              <span>0 participants</span>
            </div>
          </div>
        </div>
        <button onclick="window.startCustomQuizSession('${quiz.id}')" class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md">
          ⚡ Enter Live Quiz Arena (${quiz.questions ? quiz.questions.length : 0} Qs)
        </button>
      `;
      grid.appendChild(card);
      subscribeToQuizParticipantCount(quiz.id);
    });

    if (window.lucide) window.lucide.createIcons();
  }).catch(err => console.warn("Published quizzes fetch failed:", err));

  // Load Admin Created Custom Questions (Legacy fallback)
  window.db.collection('trivia_questions').get().then(snap => {
    if (!snap.empty) {
      const qList = [];
      snap.forEach(doc => {
        const d = doc.data();
        qList.push({
          question: d.question,
          options: d.options,
          answerIdx: d.answerIdx
        });
      });

      const card = document.createElement('div');
      card.className = "bg-gradient-to-tr from-purple-950 to-indigo-950 border border-amber-500/30 rounded-3xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:-translate-y-1 text-white";
      card.innerHTML = `
        <div class="space-y-3">
          <div class="h-36 w-full rounded-2xl bg-gradient-to-br from-amber-500 to-purple-800 flex items-center justify-center text-4xl shadow-md relative overflow-hidden">
            <span>🔥</span>
          </div>
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">Congregational Special</span>
            <h4 class="text-lg font-black text-amber-100 font-display mt-2 leading-tight">Admin's Sunday Live Challenge</h4>
            <p class="text-xs text-zinc-300 mt-1.5 leading-relaxed">Play custom questions dynamically uploaded by the General Super Admins and leadership.</p>
            <div id="quiz-participant-count-admin_custom" class="flex items-center gap-1.5 text-xs font-bold text-amber-300/80 mt-3 pt-2 border-t border-amber-500/20">
              <i data-lucide="users" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>0 participants</span>
            </div>
          </div>
        </div>
        <button onclick="startAdminCustomTriviaSession()" class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg">
          ⚡ Join Admin Live Room (${qList.length} Qs)
        </button>
      `;
      grid.appendChild(card);
      subscribeToQuizParticipantCount('admin_custom');
    }

    if (window.lucide) window.lucide.createIcons();
  }).catch(err => console.warn("Custom trivia fetch:", err));
}

// Standalone launcher and mode detector for direct quiz links
function checkDirectQuizUrl() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;

  const quizParam = params.get('quiz') || params.get('quizId');
  const isDirectQuiz = params.has('quiz') || 
                       params.has('quizId') || 
                       params.get('mode') === 'quiz' || 
                       params.get('tab') === 'quiz' || 
                       hash === '#quiz';

  if (isDirectQuiz) {
    console.log("Direct Quiz Link detected! Launching Standalone Direct Quiz Mode...");

    // Flag direct quiz mode on document elements
    document.documentElement.classList.add('direct-quiz-mode');
    document.body.classList.add('direct-quiz-mode');

    // Reveal standalone header
    const stdHeader = document.getElementById('standalone-quiz-header');
    if (stdHeader) stdHeader.classList.remove('hidden');

    // Switch view to bible tab and activate quiz mode
    setTimeout(() => {
      if (window.switchTab) window.switchTab('bible');
      if (window.setBibleSubMode) window.setBibleSubMode('quiz');

      const quizId = (quizParam && quizParam !== 'true' && quizParam !== '1') ? quizParam : 'power_of_thanksgiving';
      setTimeout(() => {
        const premium = PREMIUM_QUIZZES.find(q => q.id === quizId);
        if (premium) {
          window.startLiveTriviaSession(quizId);
        } else {
          window.startCustomQuizSession(quizId);
        }
      }, 600);
    }, 300);
  }
}

window.addEventListener('DOMContentLoaded', checkDirectQuizUrl);

// Start custom quiz session
function startCustomQuizSession(quizId) {
  window.db.collection('quizzes').doc(quizId).get().then(doc => {
    if (!doc.exists) {
      window.showToast?.("This quiz is no longer available in the assembly.", "error");
      return;
    }
    const quiz = doc.data();
    setupTriviaLounge(quiz);
  }).catch(err => {
    window.showToast?.("Could not join quiz: " + err.message, "error");
  });
}

window.startCustomQuizSession = startCustomQuizSession;
window.renderQuizSelectionGrid = renderQuizSelectionGrid;

// Start a simulated Live Trivia Session
function startLiveTriviaSession(quizId) {
  const selected = PREMIUM_QUIZZES.find(q => q.id === quizId) || PREMIUM_QUIZZES[0];
  setupTriviaLounge(selected);
}

// Start Custom Admin Quiz session
function startAdminCustomTriviaSession() {
  window.db.collection('trivia_questions').get().then(snap => {
    if (snap.empty) {
      window.showToast?.("No questions uploaded by admin yet.", "info");
      return;
    }

    const qList = [];
    snap.forEach(doc => {
      const d = doc.data();
      qList.push({
        question: d.question,
        options: d.options,
        answerIdx: d.answerIdx
      });
    });

    const mockQuiz = {
      id: "admin_custom",
      title: "Admin's Sunday Live Challenge",
      topic: "Church Specials",
      difficulty: "Dynamic",
      coverGradient: "from-purple-600 to-indigo-900",
      coverEmoji: "🔥",
      description: "Direct fellowship challenges.",
      questions: qList
    };

    setupTriviaLounge(mockQuiz);
  });
}

function setupTriviaLounge(quiz) {
  currentQuiz = quiz;
  currentQuestionIdx = 0;
  userScore = 0;
  userStreak = 0;
  hasAnsweredCurrent = false;

  triviaTimerLimit = 15;
  pointsPerQuestion = 100;

  // Initialize real Firestore data & real-time listeners for current quiz
  fetchRealUsersAndSubscribe(quiz.id);
  subscribeToQuizReactions(quiz.id);

  // Populate header details
  const titleEl = document.getElementById('trivia-session-title');
  const descEl = document.getElementById('trivia-session-desc');
  const topicTag = document.getElementById('trivia-topic-tag');
  const coverEmoji = document.getElementById('trivia-cover-emoji');
  const coverBox = document.getElementById('trivia-cover-box');

  if (titleEl) titleEl.innerText = quiz.title;
  if (descEl) descEl.innerText = quiz.description || "Join the live fellowship competition and glorify God!";
  if (topicTag) topicTag.innerText = quiz.topic || "Bible Quiz";
  if (coverEmoji) coverEmoji.innerText = quiz.coverEmoji || "📖";
  
  if (coverBox && quiz.coverImageUrl) {
    coverBox.innerHTML = `<img src="${quiz.coverImageUrl}" class="w-full h-full object-cover" />`;
  } else if (coverBox) {
    coverBox.innerHTML = `<span>${quiz.coverEmoji || '🙌'}</span>`;
  }

  // Fetch configs from DB if existing
  window.db.collection('system_configs').doc('trivia').get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      triviaTimerLimit = d.timerLimit || 15;
      pointsPerQuestion = d.pointsPerQuestion || 100;
    }
  }).catch(err => {
    console.warn("Could not load trivia configs from DB, using defaults:", err);
  }).finally(() => {
    // Show active session container, hide grid
    document.getElementById('quiz-intro-deck').classList.add('hidden');
    document.getElementById('live-trivia-session-board').classList.remove('hidden');

    // Default to Arena tab
    switchQuizRoomTab('arena');

    // Trigger countdown transition
    const lobby = document.getElementById('trivia-waiting-lobby');
    const arenaPane = document.getElementById('trivia-pane-arena');
    const countdownText = document.getElementById('lobby-countdown-timer');

    if (lobby) lobby.classList.remove('hidden');
    if (arenaPane) arenaPane.classList.add('hidden');

    let cnt = 3;
    if (countdownText) countdownText.innerText = `Synchronizing live congregation... Starts in ${cnt}...`;
    
    const loader = setInterval(() => {
      cnt--;
      if (cnt > 0) {
        if (countdownText) countdownText.innerText = `Synchronizing live congregation... Starts in ${cnt}...`;
      } else {
        clearInterval(loader);
        if (lobby) lobby.classList.add('hidden');
        if (arenaPane) arenaPane.classList.remove('hidden');
        loadTriviaQuestion();
      }
    }, 1000);
  });
}

function loadTriviaQuestion() {
  if (!currentQuiz) return;
  
  hasAnsweredCurrent = false;
  secondsRemaining = triviaTimerLimit;

  const q = currentQuiz.questions[currentQuestionIdx];
  
  // Render progress & question
  const progressText = document.getElementById('trivia-q-progress');
  const progressBar = document.getElementById('trivia-q-progress-bar');
  const questionText = document.getElementById('trivia-live-question-text');

  if (progressText) progressText.innerText = `Question ${currentQuestionIdx + 1} of ${currentQuiz.questions.length}`;
  if (progressBar) progressBar.style.width = `${((currentQuestionIdx + 1) / currentQuiz.questions.length) * 100}%`;
  if (questionText) questionText.innerText = q.question;

  // Render 4 Touch-Friendly Option Buttons (A, B, C, D)
  const optBox = document.getElementById('trivia-live-options-box');
  if (optBox) {
    optBox.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = "group w-full text-left p-4 md:p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-slate-900 dark:text-zinc-100 transition-all duration-200 cursor-pointer flex justify-between items-center shadow-sm active:scale-[0.99] relative overflow-hidden";
      btn.setAttribute('id', `trivia-live-opt-${idx}`);
      btn.onclick = () => submitTriviaAnswer(idx);
      btn.innerHTML = `
        <div class="flex items-center gap-3.5 flex-1 pr-2">
          <span class="w-8.5 h-8.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 text-xs font-black flex items-center justify-center font-mono shrink-0 transition-colors shadow-xs">
            ${letters[idx]}
          </span>
          <span class="text-xs md:text-sm font-bold leading-snug text-slate-800 dark:text-zinc-100">${opt}</span>
        </div>
        <span id="trivia-opt-badge-${idx}" class="text-xs font-black shrink-0"></span>
      `;
      optBox.appendChild(btn);
    });
  }

  // Update live player stats in UI
  updatePlayerLiveStats();

  // Start countdown timer
  startQuestionCountdown();
}

function startQuestionCountdown() {
  if (triviaTimer) clearInterval(triviaTimer);
  
  const timerBar = document.getElementById('trivia-timer-bar');
  const timerText = document.getElementById('trivia-timer-sec');
  
  if (timerBar) {
    timerBar.style.width = '100%';
    timerBar.className = 'h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full transition-all duration-300';
  }
  if (timerText) timerText.innerText = `${secondsRemaining}s`;

  triviaTimer = setInterval(() => {
    secondsRemaining--;
    if (timerText) timerText.innerText = `${secondsRemaining}s`;
    
    if (timerBar) {
      const pct = (secondsRemaining / triviaTimerLimit) * 100;
      timerBar.style.width = `${pct}%`;
      if (secondsRemaining <= 5) {
        timerBar.className = 'h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-300 animate-pulse';
      }
    }

    if (secondsRemaining <= 0) {
      clearInterval(triviaTimer);
      autoFailQuestion();
    }
  }, 1000);
}

function submitTriviaAnswer(selectedIdx) {
  if (hasAnsweredCurrent) return;
  hasAnsweredCurrent = true;
  clearInterval(triviaTimer);

  const q = currentQuiz.questions[currentQuestionIdx];
  const correctIdx = q.answerIdx;

  const selectedBtn = document.getElementById(`trivia-live-opt-${selectedIdx}`);
  const correctBtn = document.getElementById(`trivia-live-opt-${correctIdx}`);
  const selectedBadge = document.getElementById(`trivia-opt-badge-${selectedIdx}`);
  const correctBadge = document.getElementById(`trivia-opt-badge-${correctIdx}`);

  if (selectedIdx === correctIdx) {
    userStreak++;
    const speedBonus = secondsRemaining > 10 ? 50 : 0;
    const earnedPts = pointsPerQuestion + speedBonus;
    userScore += earnedPts;

    if (selectedBtn) {
      selectedBtn.className = "w-full text-left p-4 md:p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/20 text-emerald-300 dark:text-emerald-200 font-bold text-xs md:text-sm transition-all flex justify-between items-center ring-2 ring-emerald-500/50 shadow-emerald-500/20 shadow-lg";
    }
    if (selectedBadge) {
      selectedBadge.innerHTML = `<span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[11px] shadow">✅ +${earnedPts} PTS</span>`;
    }

    window.showToast?.("Amen! Correct Answer!", "success");
  } else {
    userStreak = 0;

    if (selectedBtn) {
      selectedBtn.className = "w-full text-left p-4 md:p-5 rounded-2xl border-2 border-rose-500 bg-rose-500/20 text-rose-300 dark:text-rose-200 font-bold text-xs md:text-sm transition-all flex justify-between items-center ring-2 ring-rose-500/50";
    }
    if (selectedBadge) {
      selectedBadge.innerHTML = `<span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-[11px] shadow">❌ Incorrect</span>`;
    }

    if (correctBtn) {
      correctBtn.className = "w-full text-left p-4 md:p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/20 text-emerald-300 dark:text-emerald-200 font-bold text-xs md:text-sm transition-all flex justify-between items-center ring-2 ring-emerald-500/50 shadow-emerald-500/20 shadow-lg";
      if (correctBadge) {
        correctBadge.innerHTML = `<span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[11px] shadow">✅ Correct Answer</span>`;
      }
    }

    window.showToast?.("Incorrect answer. Study scripture more to grow!", "error");
  }

  // Update player stats
  updatePlayerLiveStats();

  // Stagger next question transition
  setTimeout(() => {
    advanceTrivia();
  }, 2200);
}

function autoFailQuestion() {
  hasAnsweredCurrent = true;
  userStreak = 0;
  const q = currentQuiz.questions[currentQuestionIdx];
  const correctIdx = q.answerIdx;
  const correctBtn = document.getElementById(`trivia-live-opt-${correctIdx}`);
  const correctBadge = document.getElementById(`trivia-opt-badge-${correctIdx}`);

  if (correctBtn) {
    correctBtn.className = "w-full text-left p-4 md:p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/20 text-emerald-300 dark:text-emerald-200 font-bold text-xs md:text-sm transition-all flex justify-between items-center ring-2 ring-emerald-500/50 shadow-emerald-500/20 shadow-lg";
  }
  if (correctBadge) {
    correctBadge.innerHTML = `<span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[11px] shadow">⏳ Time Up! Correct Answer</span>`;
  }
  window.showToast?.("Time's up for this holy riddle!", "info");

  updatePlayerLiveStats();

  setTimeout(() => {
    advanceTrivia();
  }, 2200);
}

function saveCurrentScoreToFirestore() {
  const user = window.auth?.currentUser || window.firebase?.auth()?.currentUser;
  if (!user || !currentQuiz) return;

  const db = window.db;
  if (!db) return;

  const quizId = currentQuiz.id;
  const docId = `${user.uid}_${quizId}`;
  const displayName = window.currentUserProfile?.displayName || user.displayName || user.email || 'Faith Warrior';
  const userRole = window.currentUserRole || 'Member';

  db.collection('quiz_scores').doc(docId).set({
    id: docId,
    userUid: user.uid,
    userName: displayName,
    userRole: userRole,
    quizId: quizId,
    quizTitle: currentQuiz.title,
    score: userScore,
    streak: userStreak,
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => console.warn("Score update error:", err));
}

function updatePlayerLiveStats() {
  // Update Score
  const scoreEl = document.getElementById('trivia-player-score');
  if (scoreEl) scoreEl.innerText = `${userScore} PTS`;

  // Update Streak
  const streakEl = document.getElementById('trivia-player-streak');
  if (streakEl) streakEl.innerText = `🔥 ${userStreak} Streak`;

  saveCurrentScoreToFirestore();
}

function fetchRealUsersAndSubscribe(quizId) {
  subscribeToRealLeaderboard(quizId);
}

function subscribeToRealLeaderboard(quizId) {
  if (leaderboardUnsubscribe) leaderboardUnsubscribe();
  const db = window.db;
  if (!db) return;

  const targetQuizId = quizId || (currentQuiz ? currentQuiz.id : 'power_of_thanksgiving');

  leaderboardUnsubscribe = db.collection('quiz_scores')
    .where('quizId', '==', targetQuizId)
    .onSnapshot(snap => {
      const scores = [];
      snap.forEach(doc => {
        scores.push(doc.data());
      });
      scores.sort((a, b) => (b.score || 0) - (a.score || 0));
      renderRealLeaderboardAndParticipants(scores);
    }, err => {
      console.warn("quiz_scores snapshot query failed:", err);
      db.collection('quiz_scores').get().then(snap => {
        const scores = [];
        snap.forEach(doc => {
          const d = doc.data();
          if (d.quizId === targetQuizId || !d.quizId) scores.push(d);
        });
        scores.sort((a,b) => (b.score || 0) - (a.score || 0));
        renderRealLeaderboardAndParticipants(scores);
      }).catch(e => console.warn("Fallback query error:", e));
    });
}

function renderRealLeaderboardAndParticipants(scoresList) {
  const currentUser = window.auth?.currentUser || window.firebase?.auth()?.currentUser;
  const currentUid = currentUser?.uid;

  let scoreEntries = [...scoresList];
  const userInScores = scoreEntries.find(s => s.userUid === currentUid);

  if (!userInScores && currentUid) {
    const displayName = window.currentUserProfile?.displayName || currentUser.displayName || currentUser.email || 'You';
    scoreEntries.push({
      userUid: currentUid,
      userName: displayName + " (You)",
      userRole: window.currentUserRole || 'Member',
      score: userScore,
      quizId: currentQuiz ? currentQuiz.id : ''
    });
  }

  scoreEntries.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Calculate current user rank
  const userRankIdx = scoreEntries.findIndex(p => p.userUid === currentUid);
  const userRank = userRankIdx >= 0 ? userRankIdx + 1 : 1;
  const rankEl = document.getElementById('trivia-player-rank');
  if (rankEl) rankEl.innerText = `#${userRank}`;

  // Update room online count
  const roomCountEl = document.getElementById('trivia-room-online-count');
  const totalBelievers = Math.max(scoreEntries.length, 1);
  if (roomCountEl) {
    roomCountEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ${totalBelievers} Quiz Participant${totalBelievers === 1 ? '' : 's'}`;
  }

  // Render Compact Scoreboard Sidebar
  renderCohortScoreboard(scoreEntries);

  // Render Full Leaderboard Pane
  renderFullLeaderboardPane(scoreEntries);

  // Render Participants Pane
  renderParticipantsPane(scoreEntries);
}

function renderCohortScoreboard(scoreEntries) {
  const container = document.getElementById('trivia-cohort-scoreboard');
  if (!container) return;

  container.innerHTML = '';
  const currentUser = window.auth?.currentUser || window.firebase?.auth()?.currentUser;

  scoreEntries.slice(0, 6).forEach((p, idx) => {
    const isSelf = p.userUid === currentUser?.uid;
    const row = document.createElement('div');
    row.className = `p-3 rounded-2xl border flex items-center justify-between transition-all ${
      isSelf 
        ? "bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 font-black text-purple-900 dark:text-purple-300 shadow-sm" 
        : "bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
    }`;
    row.innerHTML = `
      <div class="flex items-center gap-2.5 truncate pr-2">
        <span class="w-5 text-xs font-mono font-black text-slate-400 text-center">${idx + 1}.</span>
        <span class="text-xs">${p.avatar || '👤'}</span>
        <span class="text-xs font-bold truncate max-w-[110px]">${p.userName || 'Member'} ${isSelf ? '(You)' : ''}</span>
      </div>
      <span class="text-xs font-mono font-black shrink-0 text-amber-500">${p.score || 0} PTS</span>
    `;
    container.appendChild(row);
  });
}

function renderFullLeaderboardPane(scoreEntries) {
  const container = document.getElementById('trivia-full-leaderboard-container');
  if (!container) return;

  container.innerHTML = '';
  const currentUser = window.auth?.currentUser || window.firebase?.auth()?.currentUser;

  scoreEntries.forEach((p, idx) => {
    const isSelf = p.userUid === currentUser?.uid;
    let medal = `#${idx + 1}`;
    if (idx === 0) medal = "🥇 Gold Champion";
    else if (idx === 1) medal = "🥈 Silver Medal";
    else if (idx === 2) medal = "🥉 Bronze Medal";

    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border flex items-center justify-between transition-all ${
      isSelf
        ? "bg-gradient-to-r from-purple-900 to-indigo-900 border-amber-400/50 text-white shadow-lg ring-2 ring-amber-400/30"
        : "bg-slate-50 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200"
    }`;
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-sm font-black font-mono w-8 text-center text-amber-400">${idx + 1}</span>
        <span class="text-xl">${p.avatar || '👤'}</span>
        <div>
          <h5 class="text-xs md:text-sm font-black">${p.userName || 'Member'} ${isSelf ? '(You)' : ''}</h5>
          <span class="text-[10px] opacity-75 font-semibold">${p.userRole || 'Believer'} • ${medal}</span>
        </div>
      </div>
      <span class="text-sm md:text-base font-black font-mono text-amber-400">${p.score || 0} PTS</span>
    `;
    container.appendChild(card);
  });
}

function renderParticipantsPane(scoreEntries) {
  const container = document.getElementById('trivia-full-participants-container');
  if (!container) return;

  container.innerHTML = '';

  if (!scoreEntries || scoreEntries.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 dark:text-zinc-500 space-y-2">
        <i data-lucide="users" class="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600"></i>
        <p class="text-xs font-bold">No participants yet for this quiz.</p>
        <p class="text-[10px] text-slate-400">Be the first to enter and complete the challenge!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  scoreEntries.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = "p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between";
    card.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="text-lg">${p.avatar || '👤'}</span>
        <div>
          <span class="text-xs font-extrabold block text-slate-900 dark:text-zinc-100">${p.userName || 'Member'}</span>
          <span class="text-[10px] text-slate-400">${p.userRole || 'Believer'} • Rank #${idx + 1}</span>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        ${p.score || 0} PTS
      </span>
    `;
    container.appendChild(card);
  });
}

// Sub-Navigation Tab Switcher inside Quiz Room
window.switchQuizRoomTab = function(tabName) {
  const tabs = ['arena', 'leaderboard', 'participants', 'chat'];
  tabs.forEach(t => {
    const btn = document.getElementById(`trivia-tab-${t}`);
    const pane = document.getElementById(`trivia-pane-${t}`);
    
    if (btn) {
      if (t === tabName) {
        btn.className = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5";
      } else {
        btn.className = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5";
      }
    }

    if (pane) {
      if (t === tabName) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    }
  });
};

function subscribeToQuizReactions(quizId) {
  if (reactionsUnsubscribe) reactionsUnsubscribe();
  const db = window.db;
  if (!db) return;

  const targetQuizId = quizId || (currentQuiz ? currentQuiz.id : 'power_of_thanksgiving');
  seenReactionIds.clear();
  let initialLoadDone = false;

  reactionsUnsubscribe = db.collection('quiz_reactions')
    .where('quizId', '==', targetQuizId)
    .onSnapshot(snap => {
      const items = [];
      snap.forEach(doc => {
        items.push(doc.data());
      });

      // Sort in memory by createdAt
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
        return timeA - timeB;
      });

      items.forEach(data => {
        if (data.id && !seenReactionIds.has(data.id)) {
          seenReactionIds.add(data.id);

          const currentUser = window.auth?.currentUser || window.firebase?.auth()?.currentUser;
          const isSelf = data.senderUid === (currentUser?.uid || '');

          addQuizChatMessageToUI(data.senderName, data.text, isSelf, data.type);

          if (data.type === 'reaction' && initialLoadDone) {
            triggerFloatingPraiseAnimation(data.text, data.senderName);
          }
        }
      });
      initialLoadDone = true;
    }, err => {
      console.warn("Quiz reactions listener failed:", err);
    });
}

function triggerFloatingPraiseAnimation(text, senderName) {
  const container = document.getElementById('floating-reactions-container');
  if (container) {
    const el = document.createElement('div');
    el.className = 'absolute font-black text-xs md:text-sm px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 shadow-2xl pointer-events-none z-50 animate-bounce border border-amber-300 flex items-center gap-1.5';
    el.innerHTML = `<span>${text}</span> <span class="text-[9px] opacity-80">(${senderName})</span>`;
    el.style.left = `${15 + Math.random() * 70}%`;
    el.style.bottom = '25%';
    el.style.transition = 'all 1.6s ease-out';
    container.appendChild(el);

    setTimeout(() => {
      el.style.transform = 'translateY(-180px) scale(1.25)';
      el.style.opacity = '0';
    }, 50);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1700);
  }
}

window.sendQuizPraiseReaction = function(text) {
  const user = window.auth?.currentUser || window.firebase?.auth()?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to react in the live quiz arena.", "info");
    return;
  }

  const db = window.db;
  if (!db) return;

  const quizId = currentQuiz ? currentQuiz.id : 'power_of_thanksgiving';
  const displayName = window.currentUserProfile?.displayName || user.displayName || user.email || 'Fellowship Member';
  const docRef = db.collection('quiz_reactions').doc();

  // Optimistically trigger local float animation
  triggerFloatingPraiseAnimation(text, "You");

  docRef.set({
    id: docRef.id,
    quizId: quizId,
    senderUid: user.uid,
    senderName: displayName,
    senderRole: window.currentUserRole || 'Member',
    text: text,
    type: 'reaction',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }).catch(err => console.warn("Send reaction error:", err));
};

window.sendQuizChatMessage = function() {
  const input = document.getElementById('trivia-chat-input');
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  input.value = '';

  const user = window.auth?.currentUser || window.firebase?.auth()?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to send messages.", "info");
    return;
  }

  const db = window.db;
  if (!db) return;

  const quizId = currentQuiz ? currentQuiz.id : 'power_of_thanksgiving';
  const displayName = window.currentUserProfile?.displayName || user.displayName || user.email || 'Fellowship Member';
  const docRef = db.collection('quiz_reactions').doc();

  docRef.set({
    id: docRef.id,
    quizId: quizId,
    senderUid: user.uid,
    senderName: displayName,
    senderRole: window.currentUserRole || 'Member',
    text: val,
    type: 'message',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }).catch(err => console.warn("Send chat message error:", err));
};

function addQuizChatMessageToUI(sender, text, isSelf, type) {
  const log = document.getElementById('trivia-chat-log');
  if (!log) return;

  const msg = document.createElement('div');
  msg.className = `p-2.5 rounded-xl border text-xs ${
    isSelf 
      ? "bg-purple-100 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 ml-6" 
      : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 mr-6"
  }`;
  msg.innerHTML = `
    <div class="flex items-center justify-between mb-0.5">
      <span class="font-black text-[10px] text-amber-500 uppercase">${sender} ${isSelf ? '(You)' : ''}</span>
      <span class="text-[9px] text-slate-400">Live</span>
    </div>
    <p class="font-medium leading-relaxed">${text}</p>
  `;
  log.appendChild(msg);
  log.scrollTop = log.scrollHeight;
}

function advanceTrivia() {
  currentQuestionIdx++;
  if (currentQuestionIdx < currentQuiz.questions.length) {
    loadTriviaQuestion();
  } else {
    completeTriviaSession();
  }
}

function completeTriviaSession() {
  if (triviaTimer) clearInterval(triviaTimer);

  const arenaPane = document.getElementById('trivia-pane-arena');
  const results = document.getElementById('trivia-results-card');
  if (!arenaPane || !results) return;

  arenaPane.classList.add('hidden');
  results.classList.remove('hidden');

  // Determine Rank
  const finalLeaderboard = [
    { name: "You", score: userScore, isUser: true },
    ...liveParticipants
  ].sort((a, b) => b.score - a.score);

  const userRankIdx = finalLeaderboard.findIndex(p => p.isUser);
  const userRank = userRankIdx + 1;
  const maxPossible = currentQuiz.questions.length * (pointsPerQuestion + 50);
  const userScorePct = Math.round((userScore / (currentQuiz.questions.length * pointsPerQuestion)) * 100);

  let medal = "🥉 Bronze";
  if (userRank === 1) medal = "🥇 Gold Champion";
  else if (userRank === 2) medal = "🥈 Silver";

  const resScore = document.getElementById('res-score');
  const resRank = document.getElementById('res-rank');
  const resPts = document.getElementById('res-pts');

  if (resScore) resScore.innerText = `${userScorePct}% (${Math.round(userScore / pointsPerQuestion)}/${currentQuiz.questions.length} Correct)`;
  if (resRank) resRank.innerText = `#${userRank} (${medal})`;
  if (resPts) resPts.innerText = `${userScore} PTS`;

  // Trigger Streak increment
  if (userScore > 0) {
    window.incrementUserStreak?.(`taking Live Trivia: ${currentQuiz.title}`);

    // Award Kingdom Coins securely for completing quiz
    const baseKcReward = 25;
    const rankBonusKc = (userRank === 1) ? 25 : (userRank === 2) ? 15 : 5;
    const totalKcEarned = baseKcReward + rankBonusKc;

    const user = window.auth?.currentUser;
    const db = window.db;
    if (user && db) {
      db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) {
          const uData = doc.data();
          const curKc = uData.kingdomCoins || 0;
          const wins = (uData.quizWinsCount || 0) + 1;

          doc.ref.update({
            kingdomCoins: curKc + totalKcEarned,
            quizWinsCount: wins,
            completedQuizToday: true
          });

          if (window.currentUserProfile) window.currentUserProfile.kingdomCoins = curKc + totalKcEarned;
          window.recordKcTransaction?.('credit', totalKcEarned, `Completed Quiz: ${currentQuiz.title}`, `Earned ${totalKcEarned} KC (#${userRank} rank)`);
          window.showToast?.(`🪙 Earned +${totalKcEarned} Kingdom Coins for finishing quiz!`, "success");
        }
      }).catch(e => console.warn("Quiz KC reward update error:", e));
    }
  }

  // Trigger celebration Confetti
  triggerConfetti();

  // Setup broadcast button click
  const broadcastBtn = document.getElementById('btn-trivia-broadcast');
  if (broadcastBtn) {
    broadcastBtn.onclick = () => broadcastTriviaTriumph(Math.round(userScore / pointsPerQuestion), currentQuiz.questions.length, currentQuiz.title, medal);
  }

  // Show Android download prompt modal if on Android device or in direct quiz mode
  const isAndroid = /android/i.test(navigator.userAgent) || (window.getDevicePlatform && window.getDevicePlatform() === 'Android');
  if (isAndroid || document.body.classList.contains('direct-quiz-mode')) {
    setTimeout(() => {
      const androidModal = document.getElementById('quiz-android-download-modal');
      if (androidModal) {
        androidModal.classList.remove('hidden');
        androidModal.classList.add('flex');
      }
    }, 1200);
  }
}

function exitTrivia() {
  if (triviaTimer) clearInterval(triviaTimer);
  const deck = document.getElementById('quiz-intro-deck');
  const board = document.getElementById('live-trivia-session-board');
  const results = document.getElementById('trivia-results-card');

  if (deck) deck.classList.remove('hidden');
  if (board) board.classList.add('hidden');
  if (results) results.classList.add('hidden');
  renderQuizSelectionGrid();
}

// Broadcast trivia triumph to community feed & off-app push notifications!
function broadcastTriviaTriumph(correct, total, title, medal) {
  const user = window.auth?.currentUser || window.firebase?.auth()?.currentUser;
  if (!user) {
    window.showToast?.("Authentication error: Please sign in to broadcast achievements.", "error");
    return;
  }

  const displayName = window.currentUserProfile?.displayName || user.email || 'Fellowship Member';
  const textMsg = `🏆 Sunday Trivia Triumph! ${displayName} has conquered the '${title}' live session scoring ${correct}/${total} correct and achieving the ${medal} medal! Can you top their scores? ⚡`;

  // Write to Community Feed
  const docId = window.db.collection('community_feed').doc().id;
  window.db.collection('community_feed').doc(docId).set({
    id: docId,
    text: textMsg,
    type: 'testimony',
    authorUid: user.uid,
    authorName: displayName,
    authorRole: window.currentUserRole || 'Member',
    imageUrl: null,
    videoUrl: null,
    likesCount: 0,
    likes: {},
    comments: [],
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    window.showToast?.("Broadcast posted to fellowship feed successfully!", "success");
    
    // Trigger real background push notification off the app!
    window.sendPushNotification?.(
      `🔥 Trivia Champion Alert!`,
      `Congratulations to ${displayName} for conquering the '${title}' live session! Tap to play.`,
      `/?tab=bible`,
      null, // targetRole
      null, // targetUid
      user.uid // excludeUid
    );

    exitTrivia();
  }).catch(err => window.handleFirestoreError(err, 'write', `community_feed/${docId}`));
}

// Sparkly Confetti Animation
function triggerConfetti() {
  const container = document.getElementById('confetti-rain-container');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'absolute w-2 h-2 rounded-full pointer-events-none opacity-80';
    
    const colors = ['bg-amber-400', 'bg-yellow-500', 'bg-purple-500', 'bg-emerald-500', 'bg-indigo-500'];
    confetti.classList.add(colors[Math.floor(Math.random() * colors.length)]);

    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `${-10 - Math.random() * 20}px`;
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    const duration = 2 + Math.random() * 3;
    confetti.style.animation = `confetti-fall ${duration}s linear forwards`;
    
    container.appendChild(confetti);
  }
}

// Add CSS keyframes for falling confetti if not present
if (!document.getElementById('confetti-keyframes')) {
  const style = document.createElement('style');
  style.id = 'confetti-keyframes';
  style.innerText = `
    @keyframes confetti-fall {
      0% {
        top: -10px;
        transform: translateX(0) rotate(0deg);
      }
      100% {
        top: 100%;
        transform: translateX(${Math.random() * 100 - 50}px) rotate(${360 + Math.random() * 360}deg);
      }
    }
  `;
  document.head.appendChild(style);
}

// Toggle read bible mode vs quiz mode
window.setBibleSubMode = function(mode) {
  const readBtn = document.getElementById('btn-bible-mode-read');
  const quizBtn = document.getElementById('btn-bible-mode-quiz');
  const readPane = document.getElementById('bible-read-container');
  const quizPane = document.getElementById('bible-quiz-container');

  if (!readBtn || !quizBtn || !readPane || !quizPane) return;

  if (mode === 'quiz') {
    readBtn.className = "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer";
    quizBtn.className = "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-purple-600 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5";
    
    readPane.classList.add('hidden');
    quizPane.classList.remove('hidden');
    
    initQuizLounge();
  } else {
    readBtn.className = "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-purple-600 text-white shadow-sm transition-all cursor-pointer";
    quizBtn.className = "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5";
    
    readPane.classList.remove('hidden');
    quizPane.classList.add('hidden');
  }
};

// Global exports
window.startLiveTriviaSession = startLiveTriviaSession;
window.startAdminCustomTriviaSession = startAdminCustomTriviaSession;
window.submitTriviaAnswer = submitTriviaAnswer;
window.exitTrivia = exitTrivia;
window.triggerConfetti = triggerConfetti;
