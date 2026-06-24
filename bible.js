// bible.js
// Interactive Bible Study Engine with all 66 books, live API chapter fetches, search, and Text-To-Speech (TTS)

const BIBLE_BOOKS_CHAPTERS = {
  // Old Testament
  "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
  "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150,
  "Proverbs": 31, "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66,
  "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14,
  "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3,
  "Habakkuk": 3, "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
  // New Testament
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
    },
    12: {
      1: "Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will shew thee:",
      2: "And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing:",
      3: "And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed."
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
      3: "Surely he shall deliver thee from the snare of the fowler, and from the noisome pestilence.",
      11: "For he shall give his angels charge over thee, to keep thee in all thy ways."
    }
  },
  "Proverbs": {
    3: {
      5: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
      6: "In all thy ways acknowledge him, and he shall direct thy paths.",
      7: "Be not wise in thine own eyes: fear the LORD, and depart from evil."
    },
    4: {
      23: "Keep thy heart with all diligence; for out of it are the issues of life.",
      24: "Put away from thee a froward mouth, and perverse lips put far from thee."
    }
  },
  "John": {
    1: {
      1: "In the beginning was the Word, and the Word was with God, and the Word was God.",
      2: "The same was in the beginning with God.",
      3: "All things were made by him; and without him was not any thing made that was made.",
      4: "In him was life; and the life was the light of men.",
      14: "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth."
    },
    3: {
      16: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      17: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved."
    },
    14: {
      6: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
      27: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid."
    }
  },
  "Romans": {
    8: {
      28: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
      31: "What shall we then say to things? If God be for us, who can be against us?",
      38: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
      39: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."
    },
    12: {
      1: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.",
      2: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God."
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
      <p class="text-xs">Retrieving holy scriptures from study archive...</p>
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

      data.verses.forEach(v => {
        const vNum = v.verse;
        const text = v.text.trim();
        window.loadedBibleChapterData[vNum] = text;

        const verseDiv = document.createElement('div');
        verseDiv.className = "p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-pointer select-none";
        verseDiv.setAttribute('id', `verse-${book}-${chapter}-${vNum}`);
        verseDiv.onclick = () => copyVerseToClipboard(book, chapter, vNum, text);

        verseDiv.innerHTML = `
          <span class="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mr-2 bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">${vNum}</span>
          <span class="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">${text}</span>
        `;
        versesBox.appendChild(verseDiv);
      });
    })
    .catch(err => {
      console.warn("Bible API query failed or offline, loading fallback local chapter data:", err);
      versesBox.innerHTML = '';
      const fallbackData = SCRIPTURE_DATA[book]?.[chapter];
      if (fallbackData) {
        Object.entries(fallbackData).forEach(([vNum, text]) => {
          window.loadedBibleChapterData[vNum] = text;

          const verseDiv = document.createElement('div');
          verseDiv.className = "p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-pointer select-none";
          verseDiv.setAttribute('id', `verse-${book}-${chapter}-${vNum}`);
          verseDiv.onclick = () => copyVerseToClipboard(book, chapter, vNum, text);

          verseDiv.innerHTML = `
            <span class="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mr-2 bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">${vNum}</span>
            <span class="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">${text}</span>
          `;
          versesBox.appendChild(verseDiv);
        });
        window.showToast?.(`Offline local study text loaded.`, "info");
      } else {
        versesBox.innerHTML = `
          <div class="text-center py-12 text-slate-400 space-y-4">
            <p class="font-bold">Bible Study Text Unavailable Offline</p>
            <p class="text-xs max-w-sm mx-auto leading-relaxed">
              To read this chapter offline, please connect to the internet. Genesis, John, Psalms, Proverbs, and Romans contain rich preloaded local sample chapters!
            </p>
            <button onclick="loadVerses()" class="bg-blue-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-blue-700 cursor-pointer">
              Try Again
            </button>
          </div>
        `;
      }
    });
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
      window.showToast?.(`Copied to clipboard: ${citation}`);
    })
    .catch(err => {
      console.error("Clipboard write error:", err);
    });
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
      btn.innerHTML = `<i data-lucide="square" class="w-5 h-5 animate-pulse"></i> Stop Reading`;
      if (window.lucide) window.lucide.createIcons();
      btn.onclick = stopSpeech;
    }

    currentSpeechUtterance.onend = () => {
      resetSpeechButton();
    };

    currentSpeechUtterance.onerror = () => {
      resetSpeechButton();
    };

    window.speechSynthesis.speak(currentSpeechUtterance);
  } else {
    window.showToast?.("Text-To-Speech is not supported by your browser.", "error");
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
    btn.innerHTML = `<i data-lucide="volume-2" class="w-5 h-5"></i> Read Chapter`;
    if (window.lucide) window.lucide.createIcons();
    btn.onclick = speakFullChapter;
  }
}

// Expose globally
window.initBibleEngine = initBibleEngine;
window.loadChapters = loadChapters;
window.loadVerses = loadVerses;
window.filterVerses = filterVerses;
window.speakFullChapter = speakFullChapter;
window.stopSpeech = stopSpeech;
