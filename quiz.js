// quiz.js
// Bible Trivia & Kingdom Champions Live Quiz Engine with Real-Time Participants & Live Chat

const DEFAULT_TRIVIA_QUESTIONS = [
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
    question: "Who was the mother of Jesus?",
    options: ["Mary Magdalene", "Martha", "Mary", "Elizabeth"],
    answerIndex: 2,
    scriptureReference: "Luke 1:30-31"
  },
  {
    question: "What did David use to defeat the giant Goliath?",
    options: ["A sword and spear", "A sling and five smooth stones", "A chariot of fire", "A golden bow"],
    answerIndex: 1,
    scriptureReference: "1 Samuel 17:40, 49"
  },
  {
    question: "On which day of Creation did God create light?",
    options: ["First Day", "Third Day", "Fourth Day", "Sixth Day"],
    answerIndex: 0,
    scriptureReference: "Genesis 1:3-5"
  },
  {
    question: "Which apostle was known for doubting Jesus' resurrection until he saw Him?",
    options: ["Peter", "Thomas", "John", "James"],
    answerIndex: 1,
    scriptureReference: "John 20:24-28"
  },
  {
    question: "What is the Fruit of the Spirit mentioned first in Galatians 5:22?",
    options: ["Joy", "Peace", "Love", "Patience"],
    answerIndex: 2,
    scriptureReference: "Galatians 5:22"
  }
];

let activeQuizId = 'daily-quick';
let activeQuizTitle = 'Daily Quick Quiz';
let activeQuizRewardPerQ = 5;
let activeQuizQuestionIndex = 0;
let activeQuizScore = 0;
let activeQuizQuestions = [];
let isQuizActive = false;

let quizzesListListener = null;
let quizParticipantsListener = null;
let quizChatListener = null;

function initQuizModule() {
  syncAdminAndLiveQuizzes();
  resetQuizState();
}

function resetQuizState() {
  activeQuizId = 'daily-quick';
  activeQuizTitle = 'Daily Quick Quiz';
  activeQuizRewardPerQ = 5;
  activeQuizQuestionIndex = 0;
  activeQuizScore = 0;
  activeQuizQuestions = [...DEFAULT_TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  isQuizActive = false;

  if (quizParticipantsListener) {
    quizParticipantsListener();
    quizParticipantsListener = null;
  }
  if (quizChatListener) {
    quizChatListener();
    quizChatListener = null;
  }

  const lobbyCard = document.getElementById('quiz-lobby-card');
  const playCard = document.getElementById('quiz-play-card');
  const resultsCard = document.getElementById('quiz-results-card');

  if (lobbyCard) lobbyCard.classList.remove('hidden');
  if (playCard) playCard.classList.add('hidden');
  if (resultsCard) resultsCard.classList.add('hidden');
}

// 1. Sync Live Quizzes created by Super Admin & Community
function syncAdminAndLiveQuizzes() {
  const container = document.getElementById('live-admin-quizzes-grid');
  if (!container) return;

  const db = window.db;
  if (!db) return;

  if (quizzesListListener) quizzesListListener();

  quizzesListListener = db.collection('custom_quizzes').orderBy('createdAt', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    
    // Always show Default Quick Quiz Card
    const dailyCard = document.createElement('div');
    dailyCard.className = "glass-panel rounded-3xl p-6 space-y-4 hover:border-blue-500/50 transition-all flex flex-col justify-between";
    dailyCard.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-black uppercase font-mono">
            ⚡ Daily Bread
          </span>
          <span class="text-xs font-mono font-bold text-amber-500">🪙 +25 KC Max</span>
        </div>
        <h4 class="font-black text-lg text-slate-900 dark:text-zinc-100 font-display">Daily Scripture Sprint</h4>
        <p class="text-xs text-slate-400">5 fast questions from the Old & New Testaments to sharpen your sword.</p>
      </div>

      <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span class="flex items-center gap-1.5 font-bold"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Worldwide</span>
          <span class="font-mono">5 Questions</span>
        </div>
        <button onclick="startDailyQuickQuiz()" class="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer transition-all">
          Play Daily Quiz 🎯
        </button>
      </div>
    `;
    container.appendChild(dailyCard);

    if (snap.empty) {
      return;
    }

    snap.forEach(doc => {
      const q = doc.data();
      const card = document.createElement('div');
      const isLive = q.status !== 'ended';
      card.className = `glass-panel rounded-3xl p-6 space-y-4 border ${isLive ? 'border-purple-500/30' : 'border-slate-200 dark:border-zinc-800'} hover:border-purple-500 transition-all flex flex-col justify-between relative overflow-hidden`;
      
      const qCount = q.questions ? q.questions.length : 5;
      const rewardPer = q.rewardPerCorrect || 10;
      const maxReward = qCount * rewardPer + (q.bonusReward || 0);

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-full ${isLive ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-100 text-slate-600'} text-[10px] font-black uppercase font-mono flex items-center gap-1">
              ${isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> SUPER ADMIN LIVE' : 'ENDED'}
            </span>
            <span class="text-xs font-mono font-bold text-amber-500">🪙 +${maxReward} KC</span>
          </div>

          <h4 class="font-black text-lg text-slate-900 dark:text-zinc-100 font-display">${q.title || 'Kingdom Champions Quiz'}</h4>
          <p class="text-xs text-slate-400 line-clamp-2">${q.description || `Created by ${q.createdByName || 'Super Admin'} • Category: ${q.category || 'General'}`}</p>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
          <!-- Real-Time Participant Counter Badge -->
          <div class="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-300">
            <span class="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <i data-lucide="users" class="w-4 h-4"></i>
              <span id="quiz-card-count-${doc.id}">${q.participantsCount || 0} Believers Participating</span>
            </span>
            <span class="font-mono text-slate-400">${qCount} Questions</span>
          </div>

          <button onclick="joinSuperAdminQuiz('${doc.id}')" class="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/25 cursor-pointer transition-all">
            Join Live Challenge 🚀
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Live quizzes error:", err));
}

// 2. Start Daily Quick Quiz
function startDailyQuickQuiz() {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to participate and earn KC!", "warning");
    return;
  }

  activeQuizId = 'daily-quick';
  activeQuizTitle = 'Daily Scripture Sprint';
  activeQuizRewardPerQ = 5;
  activeQuizQuestions = [...DEFAULT_TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  activeQuizQuestionIndex = 0;
  activeQuizScore = 0;
  isQuizActive = true;

  launchQuizRoomUI();
}

// 3. Join Super Admin Custom Live Quiz
async function joinSuperAdminQuiz(quizId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to participate in the live quiz!", "warning");
    return;
  }

  try {
    const doc = await window.db.collection('custom_quizzes').doc(quizId).get();
    if (!doc.exists) {
      window.showToast?.("Quiz not found.", "error");
      return;
    }

    const qData = doc.data();
    activeQuizId = quizId;
    activeQuizTitle = qData.title || 'Super Admin Live Quiz';
    activeQuizRewardPerQ = qData.rewardPerCorrect || 10;
    activeQuizQuestions = qData.questions && qData.questions.length > 0 ? qData.questions : DEFAULT_TRIVIA_QUESTIONS.slice(0, 5);
    activeQuizQuestionIndex = 0;
    activeQuizScore = 0;
    isQuizActive = true;

    // Register participant in Firestore
    const participantRef = window.db.collection('custom_quizzes').doc(quizId).collection('participants').doc(user.uid);
    await participantRef.set({
      userId: user.uid,
      userName: user.displayName || user.email.split('@')[0],
      userPhoto: user.photoURL || null,
      score: 0,
      status: 'playing',
      joinedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Increment participants counter
    await window.db.collection('custom_quizzes').doc(quizId).update({
      participantsCount: window.firebase.firestore.FieldValue.increment(1)
    }).catch(() => {});

    launchQuizRoomUI();
  } catch (err) {
    console.error("Error joining live quiz:", err);
    window.showToast?.("Error joining quiz: " + err.message, "error");
  }
}

function launchQuizRoomUI() {
  const lobbyCard = document.getElementById('quiz-lobby-card');
  const playCard = document.getElementById('quiz-play-card');
  const resultsCard = document.getElementById('quiz-results-card');

  if (lobbyCard) lobbyCard.classList.add('hidden');
  if (resultsCard) resultsCard.classList.add('hidden');
  if (playCard) playCard.classList.remove('hidden');

  const titleEl = document.getElementById('active-quiz-room-title');
  if (titleEl) titleEl.innerText = activeQuizTitle;

  renderCurrentTriviaQuestion();
  listenToQuizParticipants(activeQuizId);
  listenToQuizLiveChat(activeQuizId);
}

// 4. Render Current Trivia Question
function renderCurrentTriviaQuestion() {
  const q = activeQuizQuestions[activeQuizQuestionIndex];
  if (!q) {
    finishTriviaQuiz();
    return;
  }

  const progressEl = document.getElementById('quiz-progress-text');
  const questionEl = document.getElementById('quiz-question-text');
  const optionsGrid = document.getElementById('quiz-options-grid');
  const feedbackBox = document.getElementById('quiz-feedback-box');

  if (progressEl) progressEl.innerText = `Question ${activeQuizQuestionIndex + 1} of ${activeQuizQuestions.length}`;
  if (questionEl) questionEl.innerText = q.question;
  if (feedbackBox) feedbackBox.classList.add('hidden');

  if (optionsGrid) {
    optionsGrid.innerHTML = q.options.map((opt, idx) => `
      <button onclick="submitQuizAnswer(${idx})" class="quiz-option-btn p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-zinc-800 text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs flex items-center justify-between group">
        <span class="group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">${opt}</span>
        <span class="w-7 h-7 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center">${String.fromCharCode(65 + idx)}</span>
      </button>
    `).join('');
  }
}

// 5. Submit Quiz Answer
function submitQuizAnswer(selectedIndex) {
  const q = activeQuizQuestions[activeQuizQuestionIndex];
  if (!q) return;

  const buttons = document.querySelectorAll('.quiz-option-btn');
  buttons.forEach(b => b.disabled = true);

  const isCorrect = selectedIndex === q.answerIndex;
  const feedbackBox = document.getElementById('quiz-feedback-box');

  if (isCorrect) {
    activeQuizScore++;
    window.soundEngine?.playSuccess?.();
    if (buttons[selectedIndex]) {
      buttons[selectedIndex].className = "quiz-option-btn p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-left font-bold text-xs sm:text-sm transition-all";
    }
    if (feedbackBox) {
      feedbackBox.className = "p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1";
      feedbackBox.innerHTML = `<span class="font-black">✅ Correct!</span> <span class="font-mono opacity-80 block">${q.scriptureReference || q.explanation || 'Amen!'}</span>`;
      feedbackBox.classList.remove('hidden');
    }
  } else {
    window.soundEngine?.playError?.();
    if (buttons[selectedIndex]) {
      buttons[selectedIndex].className = "quiz-option-btn p-4 rounded-2xl border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-left font-bold text-xs sm:text-sm transition-all";
    }
    if (buttons[q.answerIndex]) {
      buttons[q.answerIndex].className = "quiz-option-btn p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-left font-bold text-xs sm:text-sm transition-all";
    }
    if (feedbackBox) {
      feedbackBox.className = "p-4 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1";
      feedbackBox.innerHTML = `<span class="font-black">❌ Incorrect.</span> The correct answer was: <strong class="underline">${q.options[q.answerIndex]}</strong> <span class="font-mono opacity-80 block">${q.scriptureReference || ''}</span>`;
      feedbackBox.classList.remove('hidden');
    }
  }

  // Update participant real-time score
  const user = window.auth?.currentUser;
  if (user && activeQuizId !== 'daily-quick' && window.db) {
    window.db.collection('custom_quizzes').doc(activeQuizId).collection('participants').doc(user.uid).update({
      score: activeQuizScore
    }).catch(() => {});
  }

  setTimeout(() => {
    activeQuizQuestionIndex++;
    if (activeQuizQuestionIndex < activeQuizQuestions.length) {
      renderCurrentTriviaQuestion();
    } else {
      finishTriviaQuiz();
    }
  }, 1600);
}

// 6. Finish Quiz & Award Kingdom Coins
async function finishTriviaQuiz() {
  const playCard = document.getElementById('quiz-play-card');
  const resultsCard = document.getElementById('quiz-results-card');

  if (playCard) playCard.classList.add('hidden');
  if (resultsCard) resultsCard.classList.remove('hidden');

  const total = activeQuizQuestions.length;
  const earnedKc = activeQuizScore * activeQuizRewardPerQ;

  const scoreText = document.getElementById('quiz-final-score-text');
  const kcText = document.getElementById('quiz-earned-kc-text');

  if (scoreText) scoreText.innerText = `${activeQuizScore} / ${total} Correct`;
  if (kcText) kcText.innerText = `+${earnedKc} Kingdom Coins`;

  const user = window.auth?.currentUser;
  const db = window.db;

  if (user && db) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await db.collection('quiz_scores').add({
        userUid: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL || null,
        quizId: activeQuizId,
        quizTitle: activeQuizTitle,
        score: activeQuizScore,
        totalQuestions: total,
        earnedKc: earnedKc,
        date: todayStr,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      if (activeQuizId !== 'daily-quick') {
        await db.collection('custom_quizzes').doc(activeQuizId).collection('participants').doc(user.uid).update({
          score: activeQuizScore,
          status: 'completed',
          completedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      if (earnedKc > 0) {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          const curKc = uData.kingdomCoins || 0;
          const wins = (uData.quizWinsCount || 0) + (activeQuizScore >= Math.floor(total * 0.7) ? 1 : 0);

          await userRef.update({
            kingdomCoins: curKc + earnedKc,
            totalKcEarned: (uData.totalKcEarned || curKc) + earnedKc,
            quizWinsCount: wins
          });

          window.recordKcTransaction?.('credit', earnedKc, 'Bible Trivia Challenge', `Scored ${activeQuizScore}/${total} on ${activeQuizTitle}`);
        }
      }
    } catch (e) {
      console.warn("Quiz finish error:", e);
    }
  }

  if (activeQuizScore >= Math.floor(total * 0.7)) {
    window.soundEngine?.playLevelUp?.();
    window.triggerConfetti?.();
    window.showToast?.(`🏆 Excellent! You earned +${earnedKc} Kingdom Coins!`, "success");
  } else {
    window.soundEngine?.playCoins?.();
    window.showToast?.(`You scored ${activeQuizScore}/${total}. Keep digging into Scripture!`, "info");
  }
}

// 7. Live Participants Listener & Real-Time Counter
function listenToQuizParticipants(quizId) {
  const container = document.getElementById('quiz-live-participants-avatars');
  const countEl = document.getElementById('quiz-room-participants-count');

  if (quizParticipantsListener) quizParticipantsListener();

  const db = window.db;
  if (!db) return;

  if (quizId === 'daily-quick') {
    const todayStr = new Date().toISOString().split('T')[0];
    quizParticipantsListener = db.collection('quiz_scores')
      .where('date', '==', todayStr)
      .limit(20)
      .onSnapshot(snap => {
        const total = snap.size;
        if (countEl) countEl.innerText = total > 0 ? `${total} Believer${total === 1 ? '' : 's'} Completed Today` : "Be the first to finish today's sprint!";
        
        if (container) {
          container.innerHTML = '';
          if (total === 0) {
            container.innerHTML = `<span class="text-[10px] text-slate-400 font-mono">⚡ Open to all</span>`;
            return;
          }

          const avatarRow = document.createElement('div');
          avatarRow.className = "flex items-center -space-x-2";
          let count = 0;
          snap.forEach(doc => {
            if (count < 6) {
              const p = doc.data();
              const av = document.createElement('div');
              av.className = "w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold shadow-xs";
              av.title = `${p.userName || 'Believer'} (${p.score || 0} pts)`;
              av.innerText = (p.userName || 'B')[0].toUpperCase();
              avatarRow.appendChild(av);
              count++;
            }
          });
          container.appendChild(avatarRow);
        }
      }, err => {
        if (countEl) countEl.innerText = "Daily Scripture Sprint Live";
      });
    return;
  }

  quizParticipantsListener = db.collection('custom_quizzes').doc(quizId).collection('participants').onSnapshot(snap => {
    const total = snap.size;
    if (countEl) countEl.innerText = `${total} Believers Participating`;

    if (container) {
      container.innerHTML = '';
      const avatarRow = document.createElement('div');
      avatarRow.className = "flex items-center -space-x-2";

      let count = 0;
      snap.forEach(doc => {
        if (count < 6) {
          const p = doc.data();
          const av = document.createElement('div');
          av.className = "w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 bg-slate-800 text-[10px] text-white flex items-center justify-center font-bold shadow-xs";
          av.title = `${p.userName} (Score: ${p.score || 0})`;
          av.innerHTML = p.userPhoto ? `<img src="${p.userPhoto}" class="w-full h-full object-cover" />` : (p.userName ? p.userName[0].toUpperCase() : '✝');
          avatarRow.appendChild(av);
          count++;
        }
      });

      if (total > 6) {
        const more = document.createElement('div');
        more.className = "w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-zinc-900";
        more.innerText = `+${total - 6}`;
        avatarRow.appendChild(more);
      }

      container.appendChild(avatarRow);
    }
  }, err => console.warn("Quiz participants error:", err));
}

// 8. Live Chat During Quiz
function listenToQuizLiveChat(quizId) {
  const messagesBox = document.getElementById('quiz-live-chat-messages');
  if (!messagesBox) return;

  if (quizChatListener) quizChatListener();

  const db = window.db;
  if (!db) return;

  quizChatListener = db.collection('custom_quizzes').doc(quizId).collection('chat').orderBy('createdAt', 'asc').limit(50).onSnapshot(snap => {
    messagesBox.innerHTML = '';
    if (snap.empty) {
      messagesBox.innerHTML = `<div class="text-center py-8 text-xs text-slate-400">Welcome to the Live Quiz Lounge! Say hello or praise God below 🙌</div>`;
      return;
    }

    snap.forEach(doc => {
      const msg = doc.data();
      const isMe = msg.senderId === window.auth?.currentUser?.uid;
      const div = document.createElement('div');
      div.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`;

      div.innerHTML = `
        <div class="flex items-center gap-1.5 text-[10px]">
          <span class="font-black ${msg.senderRole === 'Super Admin' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}">${msg.senderName || 'Believer'}</span>
          ${msg.senderRole === 'Super Admin' ? '<span class="px-1 py-0.2 rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-700 text-[8px] font-black">ADMIN</span>' : ''}
        </div>
        <div class="p-3 rounded-2xl text-xs max-w-[85%] ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-tl-none'} shadow-xs">
          ${msg.message}
        </div>
      `;
      messagesBox.appendChild(div);
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }, err => console.warn("Quiz chat error:", err));
}

async function sendQuizChatMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('quiz-chat-input');
  const text = input?.value?.trim();
  if (!text) return;

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to chat.", "warning");
    return;
  }

  try {
    await window.db.collection('custom_quizzes').doc(activeQuizId).collection('chat').add({
      senderId: user.uid,
      senderName: user.displayName || user.email.split('@')[0],
      senderAvatar: user.photoURL || null,
      senderRole: window.currentUserRole || 'Member',
      message: text,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    if (input) input.value = '';
  } catch (err) {
    console.error("Error sending quiz chat:", err);
  }
}

function insertQuizQuickPraise(text) {
  const input = document.getElementById('quiz-chat-input');
  if (input) {
    input.value = text;
    sendQuizChatMessage();
  }
}

window.initQuizModule = initQuizModule;
window.startDailyQuickQuiz = startDailyQuickQuiz;
window.joinSuperAdminQuiz = joinSuperAdminQuiz;
window.submitQuizAnswer = submitQuizAnswer;
window.resetQuizState = resetQuizState;
window.sendQuizChatMessage = sendQuizChatMessage;
window.insertQuizQuickPraise = insertQuizQuickPraise;
