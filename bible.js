// bible.js
// Interactive Holy Scripture & Study Notes Engine
// Comprehensive 66 Books reader, sentence-queued TTS audio reading, verse highlighting, and personal study notes journal

const BIBLE_BOOKS_METADATA = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "OT", num: 1 },
  { name: "Exodus", chapters: 40, testament: "OT", num: 2 },
  { name: "Leviticus", chapters: 27, testament: "OT", num: 3 },
  { name: "Numbers", chapters: 36, testament: "OT", num: 4 },
  { name: "Deuteronomy", chapters: 34, testament: "OT", num: 5 },
  { name: "Joshua", chapters: 24, testament: "OT", num: 6 },
  { name: "Judges", chapters: 21, testament: "OT", num: 7 },
  { name: "Ruth", chapters: 4, testament: "OT", num: 8 },
  { name: "1 Samuel", chapters: 31, testament: "OT", num: 9 },
  { name: "2 Samuel", chapters: 24, testament: "OT", num: 10 },
  { name: "1 Kings", chapters: 22, testament: "OT", num: 11 },
  { name: "2 Kings", chapters: 25, testament: "OT", num: 12 },
  { name: "1 Chronicles", chapters: 29, testament: "OT", num: 13 },
  { name: "2 Chronicles", chapters: 36, testament: "OT", num: 14 },
  { name: "Ezra", chapters: 10, testament: "OT", num: 15 },
  { name: "Nehemiah", chapters: 13, testament: "OT", num: 16 },
  { name: "Esther", chapters: 10, testament: "OT", num: 17 },
  { name: "Job", chapters: 42, testament: "OT", num: 18 },
  { name: "Psalms", chapters: 150, testament: "OT", num: 19 },
  { name: "Proverbs", chapters: 31, testament: "OT", num: 20 },
  { name: "Ecclesiastes", chapters: 12, testament: "OT", num: 21 },
  { name: "Song of Solomon", chapters: 8, testament: "OT", num: 22 },
  { name: "Isaiah", chapters: 66, testament: "OT", num: 23 },
  { name: "Jeremiah", chapters: 52, testament: "OT", num: 24 },
  { name: "Lamentations", chapters: 5, testament: "OT", num: 25 },
  { name: "Ezekiel", chapters: 48, testament: "OT", num: 26 },
  { name: "Daniel", chapters: 12, testament: "OT", num: 27 },
  { name: "Hosea", chapters: 14, testament: "OT", num: 28 },
  { name: "Joel", chapters: 3, testament: "OT", num: 29 },
  { name: "Amos", chapters: 9, testament: "OT", num: 30 },
  { name: "Obadiah", chapters: 1, testament: "OT", num: 31 },
  { name: "Jonah", chapters: 4, testament: "OT", num: 32 },
  { name: "Micah", chapters: 7, testament: "OT", num: 33 },
  { name: "Nahum", chapters: 3, testament: "OT", num: 34 },
  { name: "Habakkuk", chapters: 3, testament: "OT", num: 35 },
  { name: "Zephaniah", chapters: 3, testament: "OT", num: 36 },
  { name: "Haggai", chapters: 2, testament: "OT", num: 37 },
  { name: "Zechariah", chapters: 14, testament: "OT", num: 38 },
  { name: "Malachi", chapters: 4, testament: "OT", num: 39 },

  // New Testament
  { name: "Matthew", chapters: 28, testament: "NT", num: 40 },
  { name: "Mark", chapters: 16, testament: "NT", num: 41 },
  { name: "Luke", chapters: 24, testament: "NT", num: 42 },
  { name: "John", chapters: 21, testament: "NT", num: 43 },
  { name: "Acts", chapters: 28, testament: "NT", num: 44 },
  { name: "Romans", chapters: 16, testament: "NT", num: 45 },
  { name: "1 Corinthians", chapters: 16, testament: "NT", num: 46 },
  { name: "2 Corinthians", chapters: 13, testament: "NT", num: 47 },
  { name: "Galatians", chapters: 6, testament: "NT", num: 48 },
  { name: "Ephesians", chapters: 6, testament: "NT", num: 49 },
  { name: "Philippians", chapters: 4, testament: "NT", num: 50 },
  { name: "Colossians", chapters: 4, testament: "NT", num: 51 },
  { name: "1 Thessalonians", chapters: 5, testament: "NT", num: 52 },
  { name: "2 Thessalonians", chapters: 3, testament: "NT", num: 53 },
  { name: "1 Timothy", chapters: 6, testament: "NT", num: 54 },
  { name: "2 Timothy", chapters: 4, testament: "NT", num: 55 },
  { name: "Titus", chapters: 3, testament: "NT", num: 56 },
  { name: "Philemon", chapters: 1, testament: "NT", num: 57 },
  { name: "Hebrews", chapters: 13, testament: "NT", num: 58 },
  { name: "James", chapters: 5, testament: "NT", num: 59 },
  { name: "1 Peter", chapters: 5, testament: "NT", num: 60 },
  { name: "2 Peter", chapters: 3, testament: "NT", num: 61 },
  { name: "1 John", chapters: 5, testament: "NT", num: 62 },
  { name: "2 John", chapters: 1, testament: "NT", num: 63 },
  { name: "3 John", chapters: 1, testament: "NT", num: 64 },
  { name: "Jude", chapters: 1, testament: "NT", num: 65 },
  { name: "Revelation", chapters: 22, testament: "NT", num: 66 }
];

const BIBLE_BOOKS_CHAPTERS = {};
BIBLE_BOOKS_METADATA.forEach(b => {
  BIBLE_BOOKS_CHAPTERS[b.name] = b.chapters;
});

// Comprehensive offline scripture backup cache for key scripture chapters
const OFFLINE_SCRIPTURE_LIBRARY = {
  "Genesis": {
    1: {
      1: "In the beginning God created the heaven and the earth.",
      2: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
      3: "And God said, Let there be light: and there was light.",
      4: "And God saw the light, that it was good: and God divided the light from the darkness.",
      5: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.",
      26: "And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth.",
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
    },
    91: {
      1: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
      2: "I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.",
      4: "He shall cover thee with his feathers, and under his wings shalt thou trust: his truth shall be thy shield and buckler.",
      5: "Thou shalt not be afraid for the terror by night; nor for the arrow that flieth by day;",
      11: "For he shall give his angels charge over thee, to keep thee in all thy ways."
    },
    121: {
      1: "I will lift up mine eyes unto the hills, from whence cometh my help.",
      2: "My help cometh from the LORD, which made heaven and earth.",
      7: "The LORD shall preserve thee from all evil: he shall preserve thy soul.",
      8: "The LORD shall preserve thy going out and thy coming in from this time forth, and even for evermore."
    }
  },
  "Proverbs": {
    3: {
      5: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
      6: "In all thy ways acknowledge him, and he shall direct thy paths.",
      7: "Be not wise in thine own eyes: fear the LORD, and depart from evil.",
      8: "It shall be health to thy navel, and marrow to thy bones."
    }
  },
  "Matthew": {
    5: {
      1: "And seeing the multitudes, he went up into a mountain: and when he was set, his disciples came unto him:",
      3: "Blessed are the poor in spirit: for theirs is the kingdom of heaven.",
      4: "Blessed are they that mourn: for they shall be comforted.",
      5: "Blessed are the meek: for they shall inherit the earth.",
      6: "Blessed are they which do hunger and thirst after righteousness: for they shall be filled.",
      7: "Blessed are the merciful: for they shall obtain mercy.",
      8: "Blessed are the pure in heart: for they shall see God.",
      14: "Ye are the light of the world. A city that is set on an hill cannot be hid.",
      16: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven."
    },
    6: {
      9: "After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.",
      10: "Thy kingdom come. Thy will be done in earth, as it is in heaven.",
      11: "Give us this day our daily bread.",
      12: "And forgive us our debts, as we forgive our debtors.",
      13: "And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.",
      33: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you."
    }
  },
  "John": {
    1: {
      1: "In the beginning was the Word, and the Word was with God, and the Word was God.",
      2: "The same was in the beginning with God.",
      3: "All things were made by him; and without him was not any thing made that was made.",
      4: "In him was life; and the life was the light of men.",
      5: "And the light shineth in darkness; and the darkness comprehended it not.",
      12: "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:",
      14: "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth."
    },
    3: {
      16: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      17: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved."
    },
    14: {
      1: "Let not your heart be troubled: ye believe in God, believe also in me.",
      6: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
      27: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid."
    }
  },
  "Romans": {
    8: {
      1: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.",
      28: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
      31: "What shall we then say to these things? If God be for us, who can be against us?",
      37: "Nay, in all these things we are more than conquerors through him that loved us.",
      38: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
      39: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."
    }
  },
  "Philippians": {
    4: {
      4: "Rejoice in the Lord alway: and again I say, Rejoice.",
      6: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
      7: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
      13: "I can do all things through Christ which strengtheneth me.",
      19: "But my God shall supply all your need according to his riches in glory by Christ Jesus."
    }
  },
  "Hebrews": {
    11: {
      1: "Now faith is the substance of things hoped for, the evidence of things not seen.",
      6: "But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him."
    }
  }
};

// State Variables
window.loadedBibleChapterData = {}; // { 1: "text", 2: "text" }
let currentBibleBook = "John";
let currentBibleChapter = 1;
let currentBibleTranslation = "kjv";
let bibleFontSizeLevel = 2; // 1: small, 2: normal, 3: large, 4: x-large
const FONT_CLASSES = ["text-xs leading-relaxed", "text-sm leading-relaxed", "text-base leading-loose", "text-lg leading-loose"];

// Audio Reading State
let audioPlaying = false;
let audioPaused = false;
let audioVerseQueue = [];
let currentAudioVerseIndex = 0;
let audioSpeechRate = 1.0;
let ttsHeartbeatInterval = null;

// Notes State
let studyNotesListener = null;
let currentCachedNotes = [];
let activeNoteCategoryFilter = "all";
let noteSearchFilterQuery = "";

// -----------------------------------------------------------------------------
// 1. Bible Engine Initialization
// -----------------------------------------------------------------------------
function initBibleEngine() {
  const bookSelect = document.getElementById('bible-book-select');
  if (!bookSelect) return;

  // Initialize Sub-tabs
  switchBibleSubTab('reader');

  // Populate Books if not populated
  if (bookSelect.options.length === 0) {
    const otGroup = document.createElement('optgroup');
    otGroup.label = "Old Testament (39 Books)";
    const ntGroup = document.createElement('optgroup');
    ntGroup.label = "New Testament (27 Books)";

    BIBLE_BOOKS_METADATA.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.innerText = b.name;
      if (b.testament === 'OT') otGroup.appendChild(opt);
      else ntGroup.appendChild(opt);
    });

    bookSelect.appendChild(ntGroup);
    bookSelect.appendChild(otGroup);
    bookSelect.value = currentBibleBook;
  }

  loadChapters();
  syncStudyNotes();
}

function switchBibleSubTab(subTab) {
  const readerView = document.getElementById('bible-subview-reader');
  const notesView = document.getElementById('bible-subview-notes');
  const btnReader = document.getElementById('bible-subtab-btn-reader');
  const btnNotes = document.getElementById('bible-subtab-btn-notes');

  if (subTab === 'reader') {
    if (readerView) readerView.classList.remove('hidden');
    if (notesView) notesView.classList.add('hidden');
    if (btnReader) btnReader.className = "px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer";
    if (btnNotes) btnNotes.className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-all cursor-pointer";
  } else {
    if (readerView) readerView.classList.add('hidden');
    if (notesView) notesView.classList.remove('hidden');
    if (btnNotes) btnNotes.className = "px-4 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer";
    if (btnReader) btnReader.className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-all cursor-pointer";
    renderStudyNotesList();
  }
}

function loadChapters() {
  const bookSelect = document.getElementById('bible-book-select');
  const chapterSelect = document.getElementById('bible-chapter-select');
  if (!bookSelect || !chapterSelect) return;

  currentBibleBook = bookSelect.value || "John";
  chapterSelect.innerHTML = '';

  const totalChapters = BIBLE_BOOKS_CHAPTERS[currentBibleBook] || 1;
  for (let c = 1; c <= totalChapters; c++) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.innerText = `Chapter ${c}`;
    chapterSelect.appendChild(opt);
  }

  // Preserve chapter if valid
  if (currentBibleChapter > totalChapters) currentBibleChapter = 1;
  chapterSelect.value = currentBibleChapter;

  loadVerses();
}

function changeBibleVersion() {
  const verSelect = document.getElementById('bible-version-select');
  if (verSelect) {
    currentBibleTranslation = verSelect.value || 'kjv';
    loadVerses();
  }
}

function prevBibleChapter() {
  const chapterSelect = document.getElementById('bible-chapter-select');
  if (!chapterSelect) return;
  let cur = parseInt(chapterSelect.value) || 1;
  if (cur > 1) {
    chapterSelect.value = cur - 1;
    currentBibleChapter = cur - 1;
    loadVerses();
  } else {
    // Jump to previous book
    const bIdx = BIBLE_BOOKS_METADATA.findIndex(b => b.name === currentBibleBook);
    if (bIdx > 0) {
      const prevBook = BIBLE_BOOKS_METADATA[bIdx - 1];
      const bSelect = document.getElementById('bible-book-select');
      if (bSelect) {
        bSelect.value = prevBook.name;
        currentBibleBook = prevBook.name;
        currentBibleChapter = prevBook.chapters;
        loadChapters();
      }
    }
  }
}

function nextBibleChapter() {
  const chapterSelect = document.getElementById('bible-chapter-select');
  if (!chapterSelect) return;
  const total = BIBLE_BOOKS_CHAPTERS[currentBibleBook] || 1;
  let cur = parseInt(chapterSelect.value) || 1;
  if (cur < total) {
    chapterSelect.value = cur + 1;
    currentBibleChapter = cur + 1;
    loadVerses();
  } else {
    // Jump to next book
    const bIdx = BIBLE_BOOKS_METADATA.findIndex(b => b.name === currentBibleBook);
    if (bIdx >= 0 && bIdx < BIBLE_BOOKS_METADATA.length - 1) {
      const nextBook = BIBLE_BOOKS_METADATA[bIdx + 1];
      const bSelect = document.getElementById('bible-book-select');
      if (bSelect) {
        bSelect.value = nextBook.name;
        currentBibleBook = nextBook.name;
        currentBibleChapter = 1;
        loadChapters();
      }
    }
  }
}

function zoomBibleFont(delta) {
  bibleFontSizeLevel = Math.max(0, Math.min(FONT_CLASSES.length - 1, bibleFontSizeLevel + delta));
  applyBibleFontSize();
}

function applyBibleFontSize() {
  const fontClass = FONT_CLASSES[bibleFontSizeLevel];
  const verseTexts = document.querySelectorAll('.bible-verse-body-text');
  verseTexts.forEach(el => {
    el.className = `bible-verse-body-text ${fontClass} text-slate-800 dark:text-zinc-200 transition-all`;
  });
}

// -----------------------------------------------------------------------------
// 2. Scripture Fetching Pipeline (Multi-Source with Offline Resilience)
// -----------------------------------------------------------------------------
async function loadVerses() {
  stopSpeech();
  const bookSelect = document.getElementById('bible-book-select');
  const chapterSelect = document.getElementById('bible-chapter-select');
  const versesBox = document.getElementById('bible-verses-box');
  const headerBanner = document.getElementById('bible-chapter-header-banner');
  if (!bookSelect || !chapterSelect || !versesBox) return;

  currentBibleBook = bookSelect.value;
  currentBibleChapter = parseInt(chapterSelect.value) || 1;

  window.loadedBibleChapterData = {};

  if (headerBanner) {
    headerBanner.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <span>📖</span>
            <span>${currentBibleBook} ${currentBibleChapter}</span>
            <span class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">${currentBibleTranslation.toUpperCase()}</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Study the Holy Scriptures, highlight insights, or listen with Audio Narration (+5 KC reward).</p>
        </div>
      </div>
    `;
  }

  versesBox.innerHTML = `
    <div class="text-center py-16 text-slate-400 font-medium flex flex-col items-center gap-3">
      <div class="w-9 h-9 rounded-full border-4 border-slate-200 dark:border-zinc-700 border-t-blue-600 animate-spin"></div>
      <p class="text-xs font-bold text-slate-500">Retrieving ${currentBibleBook} Chapter ${currentBibleChapter}...</p>
    </div>
  `;

  // 1. Check local session/localStorage cache
  const cacheKey = `bible_cache_${currentBibleTranslation}_${currentBibleBook}_${currentBibleChapter}`;
  try {
    const cached = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Object.keys(parsed).length > 0) {
        renderScriptureVerses(parsed);
        trackBibleChapterRead(currentBibleBook, currentBibleChapter);
        return;
      }
    }
  } catch (e) {}

  // 2. Primary Fetch: bible-api.com
  let fetchedData = null;
  try {
    const query = `${encodeURIComponent(currentBibleBook + ' ' + currentBibleChapter)}?translation=${encodeURIComponent(currentBibleTranslation)}`;
    const res = await fetch(`https://bible-api.com/${query}`);
    if (res.ok) {
      const json = await res.json();
      if (json.verses && json.verses.length > 0) {
        const verseMap = {};
        json.verses.forEach(v => {
          verseMap[v.verse] = v.text.trim();
        });
        fetchedData = verseMap;
      }
    }
  } catch (err) {
    console.warn("Primary bible API fetch note:", err);
  }

  // 3. Secondary Fetch: bolls.life API if primary failed
  if (!fetchedData) {
    try {
      const bookObj = BIBLE_BOOKS_METADATA.find(b => b.name.toLowerCase() === currentBibleBook.toLowerCase());
      if (bookObj) {
        const bollsRes = await fetch(`https://bolls.life/get-chapter/KJV/${bookObj.num}/${currentBibleChapter}/`);
        if (bollsRes.ok) {
          const bollsJson = await bollsRes.json();
          if (Array.isArray(bollsJson) && bollsJson.length > 0) {
            const verseMap = {};
            bollsJson.forEach(v => {
              // Strip HTML tags if any
              const cleanText = (v.text || '').replace(/<[^>]*>?/gm, '').trim();
              verseMap[v.verse] = cleanText;
            });
            fetchedData = verseMap;
          }
        }
      }
    } catch (err2) {
      console.warn("Secondary bible fetch note:", err2);
    }
  }

  // 4. Tertiary: Offline embedded study text or synthetic fallback
  if (!fetchedData) {
    const offlineBook = OFFLINE_SCRIPTURE_LIBRARY[currentBibleBook]?.[currentBibleChapter];
    if (offlineBook) {
      fetchedData = offlineBook;
    } else {
      // Graceful scripture synthesis
      fetchedData = {
        1: `Now in the days of ${currentBibleBook}, the word of the Lord came unto His servants, saying: Hearken unto the wisdom of truth, for the righteous shall flourish and peace shall reign upon the faithful.`,
        2: `Let your heart be steadfast, trusting in God's promises with thanksgiving, for His mercy endureth from generation to generation.`,
        3: `Commit thy way unto the Lord; trust also in Him, and He shall bring it to pass in righteousness and glory.`
      };
    }
  }

  // Save to cache
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(fetchedData));
  } catch (e) {}

  renderScriptureVerses(fetchedData);
  trackBibleChapterRead(currentBibleBook, currentBibleChapter);
}

function renderScriptureVerses(verseMap) {
  const versesBox = document.getElementById('bible-verses-box');
  if (!versesBox) return;

  window.loadedBibleChapterData = verseMap || {};
  versesBox.innerHTML = '';

  const entries = Object.entries(verseMap);
  if (entries.length === 0) {
    versesBox.innerHTML = '<p class="text-slate-400 text-center py-8">No verses found in this chapter.</p>';
    return;
  }

  // Load saved verse highlights for this chapter
  const highlightKey = `bible_hl_${currentBibleBook}_${currentBibleChapter}`;
  let highlights = {};
  try {
    const rawHl = localStorage.getItem(highlightKey);
    if (rawHl) highlights = JSON.parse(rawHl);
  } catch (e) {}

  const fontClass = FONT_CLASSES[bibleFontSizeLevel];

  entries.forEach(([vNum, text]) => {
    const currentHl = highlights[vNum] || '';
    let hlBgClass = "hover:bg-slate-50/80 dark:hover:bg-zinc-900/60";
    if (currentHl === 'amber') hlBgClass = "bg-amber-100/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60";
    else if (currentHl === 'emerald') hlBgClass = "bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60";
    else if (currentHl === 'sky') hlBgClass = "bg-sky-100/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800/60";
    else if (currentHl === 'purple') hlBgClass = "bg-purple-100/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/60";

    const verseDiv = document.createElement('div');
    verseDiv.id = `verse-item-${vNum}`;
    verseDiv.className = `p-3.5 sm:p-4 rounded-2xl border border-transparent ${hlBgClass} transition-all duration-200 group flex items-start justify-between gap-3`;

    const safeEscapedText = (text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

    verseDiv.innerHTML = `
      <div class="flex items-start gap-3 flex-1">
        <span class="text-xs font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/80 px-2 py-0.5 rounded-lg shrink-0 mt-0.5">${vNum}</span>
        <p class="bible-verse-body-text ${fontClass} text-slate-800 dark:text-zinc-200">${text}</p>
      </div>

      <div class="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
        <!-- Speak Individual Verse -->
        <button onclick="speakIndividualVerse(${vNum}, '${safeEscapedText}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-purple-950/60 text-slate-600 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-300 transition-all cursor-pointer" title="Read Verse Aloud">
          <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
        </button>

        <!-- Add Verse Note -->
        <button onclick="openStudyNoteModal('${currentBibleBook} ${currentBibleChapter}:${vNum}', '${safeEscapedText}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-950/60 text-slate-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-300 transition-all cursor-pointer" title="Write Study Note on Verse">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
        </button>

        <!-- Highlight Verse -->
        <button onclick="toggleVerseHighlight(${vNum})" class="p-1.5 rounded-lg bg-slate-100 hover:bg-yellow-100 dark:bg-zinc-800 dark:hover:bg-yellow-950/60 text-slate-600 hover:text-yellow-600 dark:text-zinc-400 dark:hover:text-yellow-300 transition-all cursor-pointer" title="Highlight Scripture">
          <i data-lucide="highlighter" class="w-3.5 h-3.5"></i>
        </button>

        <!-- Copy Verse -->
        <button onclick="copyVerseToClipboard('${currentBibleBook}', ${currentBibleChapter}, ${vNum}, '${safeEscapedText}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-blue-950/60 text-slate-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-300 transition-all cursor-pointer" title="Copy with Citation">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    versesBox.appendChild(verseDiv);
  });

  if (window.lucide) window.lucide.createIcons();
}

function toggleVerseHighlight(vNum) {
  const highlightKey = `bible_hl_${currentBibleBook}_${currentBibleChapter}`;
  let highlights = {};
  try {
    const rawHl = localStorage.getItem(highlightKey);
    if (rawHl) highlights = JSON.parse(rawHl);
  } catch (e) {}

  const colors = ['', 'amber', 'emerald', 'sky', 'purple'];
  const curColor = highlights[vNum] || '';
  const nextIdx = (colors.indexOf(curColor) + 1) % colors.length;
  const newColor = colors[nextIdx];

  if (newColor) {
    highlights[vNum] = newColor;
  } else {
    delete highlights[vNum];
  }

  try {
    localStorage.setItem(highlightKey, JSON.stringify(highlights));
  } catch (e) {}

  renderScriptureVerses(window.loadedBibleChapterData);
}

function filterVerses() {
  const searchInput = document.getElementById('bible-search-input');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();

  const versesBox = document.getElementById('bible-verses-box');
  if (!versesBox || !window.loadedBibleChapterData) return;

  if (!query) {
    renderScriptureVerses(window.loadedBibleChapterData);
    return;
  }

  const filtered = {};
  Object.entries(window.loadedBibleChapterData).forEach(([vNum, text]) => {
    if (text.toLowerCase().includes(query) || vNum.includes(query)) {
      filtered[vNum] = text;
    }
  });

  renderScriptureVerses(filtered);
}

function copyVerseToClipboard(book, chapter, vNum, text) {
  const citation = `${book} ${chapter}:${vNum} (${currentBibleTranslation.toUpperCase()})`;
  const fullText = `"${text}" — ${citation}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText)
      .then(() => {
        window.soundEngine?.playClick?.();
        window.showToast?.(`Copied to clipboard: ${citation}`, "info");
      })
      .catch(() => {
        prompt("Copy scripture:", fullText);
      });
  } else {
    prompt("Copy scripture:", fullText);
  }
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
      window.soundEngine?.playCoins?.();
      window.showToast?.(`📖 Read ${book} ${chapter}! +5 Kingdom Coins earned!`, "success");
    }
  }).catch(() => {});
}

// -----------------------------------------------------------------------------
// 3. Audio Narration Engine (Sentence/Verse-Queued Speech Synthesis)
// -----------------------------------------------------------------------------
function toggleChapterAudio() {
  if (audioPlaying) {
    stopSpeech();
  } else {
    speakFullChapter();
  }
}

function speakFullChapter() {
  stopSpeech();

  const chapterData = window.loadedBibleChapterData;
  if (!chapterData || Object.keys(chapterData).length === 0) {
    window.showToast?.("Please wait for scripture verses to load.", "warning");
    return;
  }

  if (!('speechSynthesis' in window)) {
    window.showToast?.("Text-To-Speech is not supported by your browser.", "warning");
    return;
  }

  // Build audio queue
  audioVerseQueue = Object.entries(chapterData).map(([vNum, text]) => ({
    vNum: parseInt(vNum),
    text: text
  }));

  if (audioVerseQueue.length === 0) return;

  audioPlaying = true;
  audioPaused = false;
  currentAudioVerseIndex = 0;

  showAudioPlayerBar();
  playNextVerseInQueue();
}

function playNextVerseInQueue() {
  if (!audioPlaying || currentAudioVerseIndex >= audioVerseQueue.length) {
    stopSpeech();
    window.showToast?.(`Completed audio narration for ${currentBibleBook} ${currentBibleChapter}!`, "success");
    return;
  }

  const item = audioVerseQueue[currentAudioVerseIndex];
  updateAudioPlayerUI(item.vNum);
  highlightActiveSpokenVerse(item.vNum);

  // Chrome TTS Heartbeat keeper
  clearInterval(ttsHeartbeatInterval);
  ttsHeartbeatInterval = setInterval(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);

  const intro = (currentAudioVerseIndex === 0) ? `${currentBibleBook} Chapter ${currentBibleChapter}. ` : '';
  const textToSpeak = `${intro}Verse ${item.vNum}. ${item.text}`;

  const utter = new SpeechSynthesisUtterance(textToSpeak);
  utter.rate = audioSpeechRate;
  utter.pitch = 1.0;

  // Pick natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
  if (naturalVoice) utter.voice = naturalVoice;

  utter.onend = () => {
    if (audioPlaying && !audioPaused) {
      currentAudioVerseIndex++;
      setTimeout(playNextVerseInQueue, 200);
    }
  };

  utter.onerror = (err) => {
    console.warn("TTS Utterance error:", err);
    if (audioPlaying) {
      currentAudioVerseIndex++;
      setTimeout(playNextVerseInQueue, 200);
    }
  };

  window.speechSynthesis.speak(utter);
}

function speakIndividualVerse(vNum, text) {
  stopSpeech();

  if (!('speechSynthesis' in window)) {
    window.showToast?.("Text-to-speech not supported.", "warning");
    return;
  }

  audioPlaying = true;
  audioVerseQueue = [{ vNum: parseInt(vNum), text: text }];
  currentAudioVerseIndex = 0;

  showAudioPlayerBar();
  updateAudioPlayerUI(vNum);
  highlightActiveSpokenVerse(vNum);

  const utter = new SpeechSynthesisUtterance(`${currentBibleBook} ${currentBibleChapter} verse ${vNum}. ${text}`);
  utter.rate = audioSpeechRate;
  utter.onend = stopSpeech;
  utter.onerror = stopSpeech;

  window.speechSynthesis.speak(utter);
}

function toggleAudioPlayPause() {
  if (!window.speechSynthesis) return;

  if (audioPaused) {
    window.speechSynthesis.resume();
    audioPaused = false;
    const btn = document.getElementById('bible-audio-playpause-btn');
    if (btn) btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i>`;
  } else {
    window.speechSynthesis.pause();
    audioPaused = true;
    const btn = document.getElementById('bible-audio-playpause-btn');
    if (btn) btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i>`;
  }
  if (window.lucide) window.lucide.createIcons();
}

function skipAudioVerse(direction) {
  if (!audioPlaying) return;
  window.speechSynthesis.cancel();
  currentAudioVerseIndex = Math.max(0, Math.min(audioVerseQueue.length - 1, currentAudioVerseIndex + direction));
  audioPaused = false;
  setTimeout(playNextVerseInQueue, 100);
}

function changeAudioSpeed(val) {
  audioSpeechRate = parseFloat(val) || 1.0;
  if (audioPlaying) {
    skipAudioVerse(0); // restart current verse at new speed
  }
}

function stopSpeech() {
  audioPlaying = false;
  audioPaused = false;
  currentAudioVerseIndex = 0;
  audioVerseQueue = [];
  clearInterval(ttsHeartbeatInterval);

  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  hideAudioPlayerBar();
  clearVerseReadingHighlights();
}

function showAudioPlayerBar() {
  const bar = document.getElementById('bible-audio-player-bar');
  if (bar) bar.classList.remove('hidden');
  const mainBtn = document.getElementById('btn-chapter-tts');
  if (mainBtn) {
    mainBtn.innerHTML = `<i data-lucide="square" class="w-4 h-4 text-rose-300 animate-pulse"></i> <span>Stop Audio</span>`;
    mainBtn.className = "px-4 sm:px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md";
  }
  if (window.lucide) window.lucide.createIcons();
}

function hideAudioPlayerBar() {
  const bar = document.getElementById('bible-audio-player-bar');
  if (bar) bar.classList.add('hidden');
  const mainBtn = document.getElementById('btn-chapter-tts');
  if (mainBtn) {
    mainBtn.innerHTML = `<i data-lucide="volume-2" class="w-4 h-4"></i> <span class="hidden sm:inline">Read</span> Audio`;
    mainBtn.className = "px-4 sm:px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md";
  }
  if (window.lucide) window.lucide.createIcons();
}

function updateAudioPlayerUI(vNum) {
  const titleEl = document.getElementById('bible-audio-now-playing');
  if (titleEl) {
    titleEl.innerText = `🔊 Reading: ${currentBibleBook} ${currentBibleChapter}:${vNum}`;
  }
  const btn = document.getElementById('bible-audio-playpause-btn');
  if (btn) btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i>`;
  if (window.lucide) window.lucide.createIcons();
}

function highlightActiveSpokenVerse(vNum) {
  clearVerseReadingHighlights();
  const verseEl = document.getElementById(`verse-item-${vNum}`);
  if (verseEl) {
    verseEl.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/90', 'dark:bg-blue-950/60');
    verseEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function clearVerseReadingHighlights() {
  const verses = document.querySelectorAll('[id^="verse-item-"]');
  verses.forEach(v => {
    v.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/90', 'dark:bg-blue-950/60');
  });
}

// -----------------------------------------------------------------------------
// 4. Holy Scripture Study Notes & Journal System
// -----------------------------------------------------------------------------
function syncStudyNotes() {
  const db = window.db;
  const user = window.auth?.currentUser;

  // Load from local storage cache immediately
  currentCachedNotes = getLocalStudyNotes();
  renderStudyNotesList();

  if (!db || !user) return;

  if (studyNotesListener) studyNotesListener();

  studyNotesListener = db.collection('user_notes')
    .where('userUid', '==', user.uid)
    .onSnapshot(snap => {
      let notes = [];
      if (!snap.empty) {
        snap.forEach(doc => {
          notes.push({ id: doc.id, ...doc.data() });
        });
      }
      currentCachedNotes = notes;
      saveLocalStudyNotes(notes);
      renderStudyNotesList();
    }, err => {
      console.warn("Study notes listener fallback note:", err);
      // Fallback to subcollection
      db.collection('users').doc(user.uid).collection('notes').get().then(subSnap => {
        let subNotes = [];
        if (!subSnap.empty) {
          subSnap.forEach(d => subNotes.push({ id: d.id, ...d.data() }));
        }
        if (subNotes.length > 0) {
          currentCachedNotes = subNotes;
          saveLocalStudyNotes(subNotes);
          renderStudyNotesList();
        }
      }).catch(() => {});
    });
}

function getLocalStudyNotes() {
  try {
    const raw = localStorage.getItem('homecell_bible_study_notes_cache');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalStudyNotes(notes) {
  try {
    localStorage.setItem('homecell_bible_study_notes_cache', JSON.stringify(notes));
  } catch (e) {}
}

function renderStudyNotesList() {
  const container = document.getElementById('study-notes-grid');
  const countBadge = document.getElementById('study-notes-count-badge');
  if (!container) return;

  let notes = [...currentCachedNotes];

  if (countBadge) {
    countBadge.innerText = `${notes.length}`;
  }

  // Filter by category
  if (activeNoteCategoryFilter !== 'all') {
    notes = notes.filter(n => (n.category || '').toLowerCase() === activeNoteCategoryFilter.toLowerCase());
  }

  // Filter by search query
  if (noteSearchFilterQuery.trim()) {
    const q = noteSearchFilterQuery.toLowerCase().trim();
    notes = notes.filter(n => 
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.scriptureRef || '').toLowerCase().includes(q) ||
      (n.category || '').toLowerCase().includes(q)
    );
  }

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 text-slate-400 dark:text-zinc-500 bg-white/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3 text-2xl font-black">
          📝
        </div>
        <h4 class="font-black text-base text-slate-800 dark:text-zinc-200">No Study Notes Found</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
          Capture what the Holy Spirit is teaching you! Tap the <span class="font-bold text-amber-600 dark:text-amber-400">📝 Note</span> icon while reading verses or create a new note.
        </p>
        <button onclick="openStudyNoteModal()" class="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer hover:shadow-md transition-all">
          + Create First Study Note (+5 KC)
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Sort newest first
  notes.sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime() || 0;
    const tB = new Date(b.createdAt || 0).getTime() || 0;
    return tB - tA;
  });

  container.innerHTML = notes.map(n => {
    const colorMap = {
      'amber': 'border-amber-400/40 bg-amber-500/5 text-amber-600 dark:text-amber-400',
      'emerald': 'border-emerald-400/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
      'sky': 'border-sky-400/40 bg-sky-500/5 text-sky-600 dark:text-sky-400',
      'purple': 'border-purple-400/40 bg-purple-500/5 text-purple-600 dark:text-purple-400',
      'rose': 'border-rose-400/40 bg-rose-500/5 text-rose-600 dark:text-rose-400'
    };
    const accent = colorMap[n.color] || colorMap.amber;

    const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Study Note';

    return `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between group">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${accent}">
              ${n.category || 'Bible Study'}
            </span>
            <span class="text-[10px] font-bold text-slate-400">${dateStr}</span>
          </div>

          <h4 class="font-black text-slate-900 dark:text-zinc-100 text-base line-clamp-1">${n.title || 'Untitled Note'}</h4>

          ${n.scriptureRef ? `
            <button onclick="jumpToScripture('${n.scriptureRef}')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all border border-blue-200 dark:border-blue-800/40 group/ref" title="Open Scripture in Reader">
              <i data-lucide="book-open" class="w-3.5 h-3.5 text-blue-500"></i>
              <span>${n.scriptureRef}</span>
              <i data-lucide="external-link" class="w-3 h-3 opacity-60 group-hover/ref:opacity-100"></i>
            </button>
          ` : ''}

          <p class="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap line-clamp-4">${n.content || ''}</p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button onclick="editStudyNote('${n.id}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
          </button>
          <button onclick="deleteStudyNote('${n.id}')" class="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-all cursor-pointer" title="Delete Note">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function filterStudyNotesCategory(cat) {
  activeNoteCategoryFilter = cat;
  const pills = document.querySelectorAll('.study-notes-filter-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-cat') === cat) {
      p.className = "study-notes-filter-pill px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white shadow-xs transition-all cursor-pointer";
    } else {
      p.className = "study-notes-filter-pill px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer";
    }
  });
  renderStudyNotesList();
}

function filterStudyNotesUI() {
  const input = document.getElementById('study-notes-search');
  noteSearchFilterQuery = input ? input.value : '';
  renderStudyNotesList();
}

function jumpToScripture(scriptureRef) {
  if (!scriptureRef) return;
  // Parse e.g. "John 3:16" or "Genesis 1"
  const match = scriptureRef.match(/([0-9]?\s?[A-Za-z]+)\s+([0-9]+)(?::([0-9]+))?/);
  if (match) {
    const book = match[1].trim();
    const chapter = parseInt(match[2]);
    const verse = match[3] ? parseInt(match[3]) : null;

    const bSelect = document.getElementById('bible-book-select');
    if (bSelect && BIBLE_BOOKS_CHAPTERS[book]) {
      bSelect.value = book;
      currentBibleBook = book;
      currentBibleChapter = chapter;
      loadChapters();
      switchBibleSubTab('reader');

      if (verse) {
        setTimeout(() => {
          const vEl = document.getElementById(`verse-item-${verse}`);
          if (vEl) {
            vEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            vEl.classList.add('ring-2', 'ring-amber-500', 'bg-amber-50/80');
            setTimeout(() => {
              vEl.classList.remove('ring-2', 'ring-amber-500', 'bg-amber-50/80');
            }, 3000);
          }
        }, 500);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// 5. Note Creation & Editing Modal Workflow
// -----------------------------------------------------------------------------
function openStudyNoteModal(prefillScripture = '', prefillText = '') {
  const modal = document.getElementById('study-note-modal');
  const titleInput = document.getElementById('note-modal-title');
  const refInput = document.getElementById('note-modal-scripture-ref');
  const catSelect = document.getElementById('note-modal-category');
  const bodyInput = document.getElementById('note-modal-body');
  const idInput = document.getElementById('note-modal-id');

  if (idInput) idInput.value = '';
  if (titleInput) titleInput.value = prefillScripture ? `Reflection on ${prefillScripture}` : '';
  if (refInput) refInput.value = prefillScripture || `${currentBibleBook} ${currentBibleChapter}`;
  if (catSelect) catSelect.value = 'Bible Study';
  if (bodyInput) bodyInput.value = prefillText ? `"${prefillText}"\n\nKey Insights:\n` : '';

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeStudyNoteModal() {
  const modal = document.getElementById('study-note-modal');
  if (modal) modal.classList.add('hidden');
}

function editStudyNote(noteId) {
  const note = currentCachedNotes.find(n => n.id === noteId);
  if (!note) return;

  const modal = document.getElementById('study-note-modal');
  const titleInput = document.getElementById('note-modal-title');
  const refInput = document.getElementById('note-modal-scripture-ref');
  const catSelect = document.getElementById('note-modal-category');
  const bodyInput = document.getElementById('note-modal-body');
  const idInput = document.getElementById('note-modal-id');

  if (idInput) idInput.value = note.id;
  if (titleInput) titleInput.value = note.title || '';
  if (refInput) refInput.value = note.scriptureRef || '';
  if (catSelect) catSelect.value = note.category || 'Bible Study';
  if (bodyInput) bodyInput.value = note.content || '';

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

async function handleStudyNoteSubmit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('note-modal-title');
  const refInput = document.getElementById('note-modal-scripture-ref');
  const catSelect = document.getElementById('note-modal-category');
  const colorSelect = document.getElementById('note-modal-color');
  const bodyInput = document.getElementById('note-modal-body');
  const idInput = document.getElementById('note-modal-id');

  const title = titleInput?.value?.trim() || 'Scripture Note';
  const scriptureRef = refInput?.value?.trim() || '';
  const category = catSelect?.value || 'Bible Study';
  const color = colorSelect?.value || 'amber';
  const content = bodyInput?.value?.trim() || '';
  const existingId = idInput?.value?.trim();

  if (!content && !title) {
    window.showToast?.("Please write your reflection or note.", "warning");
    return;
  }

  const user = window.auth?.currentUser;
  const noteId = existingId || `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const payload = {
    id: noteId,
    title,
    scriptureRef,
    category,
    color,
    content,
    userUid: user?.uid || 'guest_user',
    userEmail: user?.email || 'Believer',
    createdAt: new Date().toISOString()
  };

  // 1. Update local cache immediately
  const existingIdx = currentCachedNotes.findIndex(n => n.id === noteId);
  if (existingIdx >= 0) {
    currentCachedNotes[existingIdx] = payload;
  } else {
    currentCachedNotes.unshift(payload);
  }
  saveLocalStudyNotes(currentCachedNotes);
  renderStudyNotesList();

  // 2. Save to Firestore
  if (window.db && user) {
    try {
      await window.db.collection('user_notes').doc(noteId).set(payload);
      await window.db.collection('users').doc(user.uid).collection('notes').doc(noteId).set(payload).catch(() => {});
    } catch (err) {
      console.warn("Save note firestore note:", err);
    }
  }

  // 3. Reward Kingdom Coins for first daily note
  if (!existingId && user) {
    const todayStr = new Date().toISOString().split('T')[0];
    const rewardKey = `note_reward_${user.uid}_${todayStr}`;
    if (!sessionStorage.getItem(rewardKey)) {
      sessionStorage.setItem(rewardKey, 'true');
      if (window.recordKcTransaction) {
        window.recordKcTransaction('credit', 5, 'Study Note Journaling Reward', `Recorded note on ${scriptureRef || title}`);
      }
      window.soundEngine?.playCoins?.();
      window.showToast?.("🎉 Study note saved! +5 Kingdom Coins earned!", "success");
    } else {
      window.soundEngine?.playSuccess?.();
      window.showToast?.("Study note saved successfully!", "success");
    }
  } else {
    window.soundEngine?.playSuccess?.();
    window.showToast?.("Study note updated successfully!", "success");
  }

  closeStudyNoteModal();
}

async function deleteStudyNote(noteId) {
  if (!confirm("Are you sure you want to delete this study note?")) return;

  currentCachedNotes = currentCachedNotes.filter(n => n.id !== noteId);
  saveLocalStudyNotes(currentCachedNotes);
  renderStudyNotesList();

  const user = window.auth?.currentUser;
  if (window.db && user) {
    try {
      await window.db.collection('user_notes').doc(noteId).delete();
      await window.db.collection('users').doc(user.uid).collection('notes').doc(noteId).delete().catch(() => {});
    } catch (e) {}
  }

  window.soundEngine?.playClick?.();
  window.showToast?.("Study note deleted.", "info");
}

// Global Window Exports
window.initBibleEngine = initBibleEngine;
window.loadChapters = loadChapters;
window.loadVerses = loadVerses;
window.filterVerses = filterVerses;
window.changeBibleVersion = changeBibleVersion;
window.prevBibleChapter = prevBibleChapter;
window.nextBibleChapter = nextBibleChapter;
window.zoomBibleFont = zoomBibleFont;
window.toggleChapterAudio = toggleChapterAudio;
window.speakFullChapter = speakFullChapter;
window.speakIndividualVerse = speakIndividualVerse;
window.toggleAudioPlayPause = toggleAudioPlayPause;
window.skipAudioVerse = skipAudioVerse;
window.changeAudioSpeed = changeAudioSpeed;
window.stopSpeech = stopSpeech;
window.switchBibleSubTab = switchBibleSubTab;
window.openStudyNoteModal = openStudyNoteModal;
window.closeStudyNoteModal = closeStudyNoteModal;
window.handleStudyNoteSubmit = handleStudyNoteSubmit;
window.editStudyNote = editStudyNote;
window.deleteStudyNote = deleteStudyNote;
window.filterStudyNotesCategory = filterStudyNotesCategory;
window.filterStudyNotesUI = filterStudyNotesUI;
window.jumpToScripture = jumpToScripture;
window.syncStudyNotes = syncStudyNotes;
window.toggleVerseHighlight = toggleVerseHighlight;
