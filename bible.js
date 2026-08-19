// bible.js
// Interactive Bible Study Engine with 66 books, chapter tracking, mission progress & TTS

const BIBLE_BOOKS_CHAPTERS = {
  "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
  "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150,
  "Proverbs": 31, "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66,
  "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14,
  "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3,
  "Habakkuk": 3, "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
  "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28,
  "Romans": 16, "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6,
  "Ephesians": 6, "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5,
  "2 Thessalonians": 3, "1 Timothy": 6, "2 Timothy": 4, "Titus": 3,
  "Philemon": 1, "Hebrews": 13, "James": 5, "1 Peter": 5, "2 Peter": 3,
  "1 John": 5, "2 John": 1, "3 John": 1, "Jude": 1, "Revelation": 22
};

const SCRIPTURE_DATA = {
  "Genesis": {
    1: {
      1: "In the beginning God created the heaven and the earth.",
      2: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
      3: "And God said, Let there be light: and there was light.",
      4: "And God saw the light, that it was good: and God divided the light from the darkness.",
      5: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.",
      27: "So God created man in his own image, in the image of God created he him; male and female created he them.",
      31: "And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day."
    }
  },
  "Psalms": {
    23: {
      1: "The LORD is my shepherd; I shall not want.",
      2: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
      3: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
      4: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
      5: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
      6: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever."
    }
  },
  "John": {
    1: {
      1: "In the beginning was the Word, and the Word was with God, and the Word was God.",
      2: "The same was in the beginning with God.",
      3: "All things were made by him; and without him was not any thing made that was made.",
      4: "In him was life; and the life was the light of men.",
      14: "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth."
    }
  },
  "Romans": {
    8: {
      28: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
      31: "What shall we then say to these things? If God be for us, who can be against us?",
      38: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
      39: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."
    }
  }
};

let currentSpeechUtterance = null;
window.loadedBibleChapterData = {};

function initBibleEngine() {
  const bookSelect = document.getElementById('bible-book-select');
  if (!bookSelect) return;

  bookSelect.innerHTML = '';
  Object.keys(BIBLE_BOOKS_CHAPTERS).forEach(book => {
    const opt = document.createElement('option');
    opt.value = book;
    opt.innerText = book;
    bookSelect.appendChild(opt);
  });

  loadChapters();
}

function loadChapters() {
  const bookSelect = document.getElementById('bible-book-select');
  const chapterSelect = document.getElementById('bible-chapter-select');
  if (!bookSelect || !chapterSelect) return;

  const book = bookSelect.value;
  chapterSelect.innerHTML = '';

  const totalChapters = BIBLE_BOOKS_CHAPTERS[book] || 1;
  for (let c = 1; c <= totalChapters; c++) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.innerText = `Chapter ${c}`;
    chapterSelect.appendChild(opt);
  }

  loadVerses();
}

function loadVerses() {
  stopSpeech();
  const bookSelect = document.getElementById('bible-book-select');
  const chapterSelect = document.getElementById('bible-chapter-select');
  const versesBox = document.getElementById('bible-verses-box');
  if (!bookSelect || !chapterSelect || !versesBox) return;

  const book = bookSelect.value;
  const chapter = chapterSelect.value;

  window.loadedBibleChapterData = {};

  versesBox.innerHTML = `
    <div class="text-center py-12 text-slate-400 font-medium flex flex-col items-center gap-3">
      <div class="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
      <p class="text-xs">Loading holy scriptures...</p>
    </div>
  `;

  fetch(`https://bible-api.com/${encodeURIComponent(book + ' ' + chapter)}`)
    .then(res => {
      if (!res.ok) throw new Error("API error");
      return res.json();
    })
    .then(data => {
      versesBox.innerHTML = '';
      if (!data.verses || data.verses.length === 0) {
        versesBox.innerHTML = '<p class="text-slate-400 text-center py-6">No verses found in this chapter.</p>';
        return;
      }

      // Record real chapter reading progress for missions & stats
      trackBibleChapterRead(book, chapter);

      data.verses.forEach(v => {
        const vNum = v.verse;
        const text = v.text.trim();
        window.loadedBibleChapterData[vNum] = text;

        const verseDiv = document.createElement('div');
        verseDiv.className = "p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-pointer select-none";
        verseDiv.onclick = () => copyVerseToClipboard(book, chapter, vNum, text);

        verseDiv.innerHTML = `
          <span class="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mr-2 bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">${vNum}</span>
          <span class="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">${text}</span>
        `;
        versesBox.appendChild(verseDiv);
      });
    })
    .catch(err => {
      versesBox.innerHTML = '';
      const fallbackData = SCRIPTURE_DATA[book]?.[chapter];
      if (fallbackData) {
        trackBibleChapterRead(book, chapter);

        Object.entries(fallbackData).forEach(([vNum, text]) => {
          window.loadedBibleChapterData[vNum] = text;

          const verseDiv = document.createElement('div');
          verseDiv.className = "p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-pointer select-none";
          verseDiv.onclick = () => copyVerseToClipboard(book, chapter, vNum, text);

          verseDiv.innerHTML = `
            <span class="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mr-2 bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">${vNum}</span>
            <span class="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">${text}</span>
          `;
          versesBox.appendChild(verseDiv);
        });
        window.showToast?.(`Loaded ${book} ${chapter} from offline study text.`, "info");
      } else {
        versesBox.innerHTML = `
          <div class="text-center py-12 text-slate-400 space-y-4">
            <p class="font-bold">Bible Study Text</p>
            <p class="text-xs max-w-sm mx-auto leading-relaxed">
              Connect to the internet to load all 66 books from the cloud archive. Genesis, John, Psalms, and Romans are available offline!
            </p>
            <button onclick="loadVerses()" class="bg-blue-600 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl cursor-pointer">
              Retry
            </button>
          </div>
        `;
      }
    });
}

function trackBibleChapterRead(book, chapter) {
  const user = window.auth?.currentUser;
  const db = window.db;
  if (!user || !db) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const readKey = `read_${user.uid}_${book}_${chapter}_${todayStr}`;
  if (sessionStorage.getItem(readKey)) return;
  sessionStorage.setItem(readKey, 'true');

  db.collection('users').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const uData = doc.data();
      const totalChapters = (uData.chaptersReadCount || 0) + 1;
      const todayChapters = (uData.chaptersReadToday || 0) + 1;
      const curKc = uData.kingdomCoins || 0;

      doc.ref.update({
        chaptersReadCount: totalChapters,
        chaptersReadToday: todayChapters,
        kingdomCoins: curKc + 5,
        totalKcEarned: (uData.totalKcEarned || curKc) + 5
      });

      if (window.currentUserProfile) {
        window.currentUserProfile.chaptersReadCount = totalChapters;
        window.currentUserProfile.chaptersReadToday = todayChapters;
        window.currentUserProfile.kingdomCoins = curKc + 5;
      }

      window.recordKcTransaction?.('credit', 5, 'Bible Study Reward', `Studied ${book} Chapter ${chapter}`);
      window.showToast?.(`📖 Read ${book} ${chapter}! +5 Kingdom Coins earned!`, "success");
    }
  }).catch(() => {});
}

function filterVerses() {
  const searchInput = document.getElementById('bible-search-input');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();

  const bookSelect = document.getElementById('bible-book-select');
  const chapterSelect = document.getElementById('bible-chapter-select');
  const book = bookSelect.value;
  const chapter = chapterSelect.value;

  const versesBox = document.getElementById('bible-verses-box');
  if (!versesBox || !window.loadedBibleChapterData) return;

  versesBox.innerHTML = '';

  Object.entries(window.loadedBibleChapterData).forEach(([vNum, text]) => {
    if (text.toLowerCase().includes(query) || vNum.includes(query)) {
      const verseDiv = document.createElement('div');
      verseDiv.className = "p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-pointer select-none";
      verseDiv.onclick = () => copyVerseToClipboard(book, chapter, vNum, text);

      verseDiv.innerHTML = `
        <span class="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mr-2 bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">${vNum}</span>
        <span class="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">${text}</span>
      `;
      versesBox.appendChild(verseDiv);
    }
  });

  if (versesBox.children.length === 0) {
    versesBox.innerHTML = '<p class="text-slate-400 text-center py-6">No matching verses found in this chapter.</p>';
  }
}

function copyVerseToClipboard(book, chapter, vNum, text) {
  const citation = `${book} ${chapter}:${vNum} (KJV)`;
  const fullText = `"${text}" - ${citation}`;
  
  navigator.clipboard.writeText(fullText)
    .then(() => {
      window.showToast?.(`Copied to clipboard: ${citation}`, "info");
    })
    .catch(() => {});
}

function speakFullChapter() {
  stopSpeech();

  const bookSelect = document.getElementById('bible-book-select');
  const chapterSelect = document.getElementById('bible-chapter-select');
  if (!bookSelect || !chapterSelect) return;

  const book = bookSelect.value;
  const chapter = chapterSelect.value;
  const chapterData = window.loadedBibleChapterData;

  if (!chapterData || Object.keys(chapterData).length === 0) return;

  let textToSpeak = `${book} Chapter ${chapter}. `;
  Object.entries(chapterData).forEach(([vNum, text]) => {
    textToSpeak += `Verse ${vNum}: ${text}. `;
  });

  if ('speechSynthesis' in window) {
    currentSpeechUtterance = new SpeechSynthesisUtterance(textToSpeak);
    currentSpeechUtterance.rate = 0.95;
    
    const btn = document.getElementById('btn-chapter-tts');
    if (btn) {
      btn.innerHTML = `<i data-lucide="square" class="w-4 h-4 animate-pulse"></i> Stop Reading`;
      if (window.lucide) window.lucide.createIcons();
      btn.onclick = stopSpeech;
    }

    currentSpeechUtterance.onend = resetSpeechButton;
    currentSpeechUtterance.onerror = resetSpeechButton;

    window.speechSynthesis.speak(currentSpeechUtterance);
  } else {
    window.showToast?.("Text-To-Speech is not supported by your browser.", "warning");
  }
}

function stopSpeech() {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  resetSpeechButton();
}

function resetSpeechButton() {
  const btn = document.getElementById('btn-chapter-tts');
  if (btn) {
    btn.innerHTML = `<i data-lucide="volume-2" class="w-4 h-4"></i> Read Chapter`;
    if (window.lucide) window.lucide.createIcons();
    btn.onclick = speakFullChapter;
  }
}

window.initBibleEngine = initBibleEngine;
window.loadChapters = loadChapters;
window.loadVerses = loadVerses;
window.filterVerses = filterVerses;
window.speakFullChapter = speakFullChapter;
window.stopSpeech = stopSpeech;
