// quiz.js
// Highly Interactive, Premium Bible Quizzes & Simulated Live Trivia Session Engine

const PREMIUM_QUIZZES = [
  {
    id: "gospels_jesus",
    title: "The Life & Miracles of Jesus",
    topic: "New Testament Gospels",
    difficulty: "Medium",
    coverGradient: "from-blue-600 to-indigo-800",
    coverEmoji: "🌟",
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
    topic: "Old Testament Wisdom Literature",
    difficulty: "Hard",
    coverGradient: "from-blue-500 to-indigo-700",
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
    title: "Acts and the Early Apostolic Church",
    topic: "Apostolic Era & Pentecost",
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
let triviaTimer = null;
let secondsRemaining = 15;
let hasAnsweredCurrent = false;
let triviaTimerLimit = 15;
let pointsPerQuestion = 100;

// Real-time participants (Empty for local play mode, zero simulated participants)
let liveParticipants = [];

function initQuizLounge() {
  renderQuizSelectionGrid();
}

// Render available quizzes including premium and custom admin-created
function renderQuizSelectionGrid() {
  const grid = document.getElementById('quiz-deck-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // Render Premium Quizzes
  PREMIUM_QUIZZES.forEach(quiz => {
    const card = document.createElement('div');
    card.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group hover:-translate-y-1 duration-300";
    card.innerHTML = `
      <div class="space-y-3">
        <!-- Cover Art Gradient or Image -->
        <div class="h-32 w-full rounded-2xl bg-gradient-to-br ${quiz.coverGradient} flex items-center justify-center text-4xl shadow-sm relative overflow-hidden">
          <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          ${quiz.coverImageUrl ? `<img src="${quiz.coverImageUrl}" class="w-full h-full object-cover" />` : `<span>${quiz.coverEmoji}</span>`}
          <button onclick="window.copyDirectQuizLink('${quiz.id}')" class="absolute top-2 right-2 p-2 bg-slate-900/60 hover:bg-slate-900/90 text-white rounded-xl backdrop-blur transition-all cursor-pointer" title="Copy Direct Quiz Link">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <div>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">${quiz.topic}</span>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 ml-1.5">${quiz.difficulty}</span>
          <h4 class="text-lg font-black text-slate-900 dark:text-zinc-50 font-display mt-2 leading-tight">${quiz.title}</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">${quiz.description}</p>
        </div>
      </div>
      <button onclick="startLiveTriviaSession('${quiz.id}')" class="w-full py-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white text-slate-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
        🚀 Join Live Trivia Session
      </button>
    `;
    grid.appendChild(card);
  });

  // Load Custom Admin Created Quizzes from FireStore
  window.db.collection('quizzes').get().then(snap => {
    snap.forEach(doc => {
      const quiz = doc.data();
      const card = document.createElement('div');
      card.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group hover:-translate-y-1 duration-300";
      card.innerHTML = `
        <div class="space-y-3">
          <!-- Cover Art Gradient or Custom Image -->
          <div class="h-32 w-full rounded-2xl bg-gradient-to-br ${quiz.coverGradient || 'from-indigo-600 to-purple-800'} flex items-center justify-center text-4xl shadow-sm relative overflow-hidden">
            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            ${quiz.coverImageUrl ? `<img src="${quiz.coverImageUrl}" class="w-full h-full object-cover" />` : `<span>${quiz.coverEmoji || '✨'}</span>`}
            <button onclick="window.copyDirectQuizLink('${quiz.id}')" class="absolute top-2 right-2 p-2 bg-slate-900/60 hover:bg-slate-900/90 text-white rounded-xl backdrop-blur transition-all cursor-pointer" title="Copy Direct Quiz Link">
              <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">${quiz.topic || 'Custom Study'}</span>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 ml-1.5">${quiz.difficulty || 'Intermediate'}</span>
            <h4 class="text-lg font-black text-slate-900 dark:text-zinc-50 font-display mt-2 leading-tight">${quiz.title}</h4>
            <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">${quiz.description}</p>
          </div>
        </div>
        <button onclick="window.startCustomQuizSession('${quiz.id}')" class="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm">
          ⚡ Join Live Trivia Session (${quiz.questions ? quiz.questions.length : 0} Qs)
        </button>
      `;
      grid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }).catch(err => console.warn("Published quizzes fetch failed:", err));

  // Load Admin Created Custom Questions (Legacy fallback) as a special Sunday Special Live Challenge
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
      card.className = "bg-gradient-to-tr from-purple-50 to-indigo-50 dark:from-zinc-950/40 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-900/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group hover:-translate-y-1 duration-300";
      card.innerHTML = `
        <div class="space-y-3">
          <!-- Cover Art Gradient -->
          <div class="h-32 w-full rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center text-4xl shadow-sm relative overflow-hidden animate-pulse">
            <span>🔥</span>
          </div>
          <div>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">Congregational Special</span>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 ml-1.5">Live Live</span>
            <h4 class="text-lg font-black text-slate-900 dark:text-zinc-50 font-display mt-2 leading-tight">Admin's Sunday Live Challenge</h4>
            <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Play custom questions dynamically uploaded by the General Super Admins and leadership.</p>
          </div>
        </div>
        <button onclick="startAdminCustomTriviaSession()" class="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
          ⚡ Enter Admin Live Lounge (${qList.length} Qs)
        </button>
      `;
      grid.appendChild(card);
    }

    if (window.lucide) window.lucide.createIcons();
  }).catch(err => console.warn("Custom trivia fetch:", err));
}

// Auto-launcher for direct quiz links
function checkDirectQuizUrl() {
  const params = new URLSearchParams(window.location.search);
  const quizId = params.get('quizId');
  if (quizId) {
    setTimeout(() => {
      window.switchTab?.('bible');
      window.setBibleSubMode?.('quiz');
      setTimeout(() => {
        const premium = PREMIUM_QUIZZES.find(q => q.id === quizId);
        if (premium) {
          window.startLiveTriviaSession(quizId);
        } else {
          window.startCustomQuizSession(quizId);
        }
      }, 600);
    }, 400);
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
  const selected = PREMIUM_QUIZZES.find(q => q.id === quizId);
  if (!selected) return;

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
  hasAnsweredCurrent = false;

  // Set default values in case Firestore has none
  triviaTimerLimit = 15;
  pointsPerQuestion = 100;

  // Reset live cohort scores
  liveParticipants.forEach(p => p.score = 0);

  // Fetch from DB
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

    // Trigger countdown transition
    const lobby = document.getElementById('trivia-waiting-lobby');
    const arena = document.getElementById('trivia-active-arena');
    const countdownText = document.getElementById('lobby-countdown-timer');

    lobby.classList.remove('hidden');
    arena.classList.add('hidden');

    let cnt = 3;
    countdownText.innerText = `Preparing your scripture challenge... Starts in ${cnt}...`;
    
    const loader = setInterval(() => {
      cnt--;
      if (cnt > 0) {
        countdownText.innerText = `Preparing your scripture challenge... Starts in ${cnt}...`;
      } else {
        clearInterval(loader);
        lobby.classList.add('hidden');
        arena.classList.remove('hidden');
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
  
  // Render header stats
  document.getElementById('trivia-session-title').innerText = currentQuiz.title;
  document.getElementById('trivia-q-progress').innerText = `Question ${currentQuestionIdx + 1} of ${currentQuiz.questions.length}`;
  document.getElementById('trivia-live-question-text').innerText = q.question;
  
  // Render options buttons
  const optBox = document.getElementById('trivia-live-options-box');
  optBox.innerHTML = '';
  
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = "w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 font-semibold text-xs text-slate-800 dark:text-zinc-200 transition-all cursor-pointer flex justify-between items-center active:scale-[0.98]";
    btn.setAttribute('id', `trivia-live-opt-${idx}`);
    btn.onclick = () => submitTriviaAnswer(idx);
    btn.innerHTML = `
      <span>${opt}</span>
      <span class="w-6 h-6 rounded-full border border-slate-200 dark:border-zinc-800 text-[10px] font-bold flex items-center justify-center font-mono uppercase bg-slate-50 dark:bg-zinc-950">${String.fromCharCode(65 + idx)}</span>
    `;
    optBox.appendChild(btn);
  });

  // Render cohort scoreboard
  renderCohortScoreboard();

  // Start countdown timer
  startQuestionCountdown();
}

function startQuestionCountdown() {
  if (triviaTimer) clearInterval(triviaTimer);
  
  const timerBar = document.getElementById('trivia-timer-bar');
  const timerText = document.getElementById('trivia-timer-sec');
  
  if (timerBar) {
    timerBar.style.width = '100%';
    timerBar.className = 'h-full bg-blue-500 rounded-full transition-all duration-300';
  }
  if (timerText) timerText.innerText = `${secondsRemaining}s`;

  triviaTimer = setInterval(() => {
    secondsRemaining--;
    if (timerText) timerText.innerText = `${secondsRemaining}s`;
    
    if (timerBar) {
      const pct = (secondsRemaining / triviaTimerLimit) * 100;
      timerBar.style.width = `${pct}%`;
      if (secondsRemaining <= 5) {
        timerBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-300 animate-pulse';
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

  // Highlight choices
  if (selectedIdx === correctIdx) {
    userScore += pointsPerQuestion; // Add points
    if (selectedBtn) {
      selectedBtn.className = "w-full text-left p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 font-bold text-xs text-emerald-800 dark:text-emerald-400 transition-all flex justify-between items-center";
      selectedBtn.innerHTML += `<span class="text-emerald-600">✅ +${pointsPerQuestion} PTS</span>`;
    }
    window.showToast?.("Amen! Correct Answer!", "success");
  } else {
    if (selectedBtn) {
      selectedBtn.className = "w-full text-left p-4 rounded-2xl border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/20 font-bold text-xs text-rose-800 dark:text-rose-400 transition-all flex justify-between items-center";
      selectedBtn.innerHTML += `<span class="text-rose-600">❌ Incorrect</span>`;
    }
    if (correctBtn) {
      correctBtn.className = "w-full text-left p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 font-bold text-xs text-emerald-800 dark:text-emerald-400 transition-all flex justify-between items-center";
      correctBtn.innerHTML += `<span class="text-emerald-600">✅ Correct Answer</span>`;
    }
    window.showToast?.("Incorrect answer. Study scripture more to grow!", "error");
  }

  // Answer simulated cohort in real-time
  simulateCohortActivity(correctIdx);

  // Stagger next question transition
  setTimeout(() => {
    advanceTrivia();
  }, 2500);
}

function autoFailQuestion() {
  hasAnsweredCurrent = true;
  const q = currentQuiz.questions[currentQuestionIdx];
  const correctIdx = q.answerIdx;
  const correctBtn = document.getElementById(`trivia-live-opt-${correctIdx}`);

  if (correctBtn) {
    correctBtn.className = "w-full text-left p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 font-bold text-xs text-emerald-800 dark:text-emerald-400 transition-all flex justify-between items-center";
    correctBtn.innerHTML += `<span class="text-emerald-600">⏳ Time Up! Correct Answer</span>`;
  }
  window.showToast?.("Time's up for this holy riddle!", "info");

  simulateCohortActivity(correctIdx);

  setTimeout(() => {
    advanceTrivia();
  }, 2500);
}

function simulateCohortActivity(correctIdx) {
  liveParticipants.forEach(p => {
    const isCorrect = Math.random() < p.accuracy;
    if (isCorrect) {
      p.score += pointsPerQuestion;
    }
  });
  renderCohortScoreboard();
}

function renderCohortScoreboard() {
  const container = document.getElementById('trivia-cohort-scoreboard');
  if (!container) return;

  container.innerHTML = '';
  
  // Combine user and simulated participants
  const allPlayers = [
    { name: "You (Faith Warrior)", score: userScore, isUser: true },
    ...liveParticipants
  ].sort((a, b) => b.score - a.score);

  allPlayers.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = `p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
      p.isUser 
        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 font-bold text-blue-700 dark:text-blue-400" 
        : "bg-slate-50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
    }`;
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono font-black text-slate-400">${idx + 1}.</span>
        <span class="text-xs truncate max-w-[120px]">${p.name}</span>
      </div>
      <span class="text-xs font-mono font-black">${p.score} PTS</span>
    `;
    container.appendChild(row);
  });
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

  const arena = document.getElementById('trivia-active-arena');
  const results = document.getElementById('trivia-results-card');
  if (!arena || !results) return;

  arena.classList.add('hidden');
  results.classList.remove('hidden');

  // Determine Rank
  const finalLeaderboard = [
    { name: "You", score: userScore, isUser: true },
    ...liveParticipants
  ].sort((a, b) => b.score - a.score);

  const userRankIdx = finalLeaderboard.findIndex(p => p.isUser);
  const userRank = userRankIdx + 1;
  const userScorePct = Math.round((userScore / (currentQuiz.questions.length * pointsPerQuestion)) * 100);

  let medal = "🥉 Bronze";
  if (userRank === 1) medal = "🥇 Gold Champion";
  else if (userRank === 2) medal = "🥈 Silver";

  document.getElementById('res-score').innerText = `${userScorePct}% (${Math.round(userScore / pointsPerQuestion)}/${currentQuiz.questions.length} Correct)`;
  document.getElementById('res-rank').innerText = `#${userRank} (${medal} Medal)`;
  document.getElementById('res-pts').innerText = `${userScore} PTS`;

  // Trigger Streak increment
  if (userScore > 0) {
    window.incrementUserStreak(`taking Live Trivia: ${currentQuiz.title}`);
  }

  // Trigger celebration Confetti
  triggerConfetti();

  // Setup broadcast button click
  const broadcastBtn = document.getElementById('btn-trivia-broadcast');
  if (broadcastBtn) {
    broadcastBtn.onclick = () => broadcastTriviaTriumph(Math.round(userScore / pointsPerQuestion), currentQuiz.questions.length, currentQuiz.title, medal);
  }
}

function exitTrivia() {
  if (triviaTimer) clearInterval(triviaTimer);
  document.getElementById('quiz-intro-deck').classList.remove('hidden');
  document.getElementById('live-trivia-session-board').classList.add('hidden');
  document.getElementById('trivia-results-card').classList.add('hidden');
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
    window.sendPushNotification(
      `🔥 Trivia Champion Alert!`,
      `Congratulations to ${displayName} for conquering the '${title}' live session! Tap to play.`,
      `/?tab=bible`,
      null, // targetRole
      null, // targetUid
      user.uid // excludeUid: exclude the trivia winner!
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
    
    const colors = ['bg-sky-400', 'bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-purple-500'];
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
    quizBtn.className = "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-blue-600 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5";
    
    readPane.classList.add('hidden');
    quizPane.classList.remove('hidden');
    
    initQuizLounge();
  } else {
    readBtn.className = "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-blue-600 text-white shadow-sm transition-all cursor-pointer";
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
