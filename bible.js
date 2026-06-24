// js/bible.js
// Interactive Bible Study Engine with multi-book selectors, keyword search, copy trigger, and Speech Synthesis (TTS)

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
      31: "What shall we then say to these things? If God be for us, who can be against us?",
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

function initBibleEngine() {
  const bookSelect = document.getElementById('bible-book-select');
  if (!bookSelect) return;

  bookSelect.innerHTML = '';
  Object.keys(SCRIPTURE_DATA).forEach(book => {
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

  if (SCRIPTURE_DATA[book]) {
    Object.keys(SCRIPTURE_DATA[book]).forEach(chap => {
      const opt = document.createElement('option');
      opt.value = chap;
      opt.innerText = `Chapter ${chap}`;
      chapterSelect.appendChild(opt);
    });
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

  versesBox.innerHTML = '';

  const chapterData = SCRIPTURE_DATA[book]?.[chapter];
  if (!chapterData) {
    versesBox.innerHTML = '<p class="text-slate-400 text-center py-6">No verses available.</p>';
    return;
  }

  Object.entries(chapterData).forEach(([vNum, text]) => {
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
}

function filterVerses() {
  const searchInput = document.getElementById('bible-search-input');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();

  const bookSelect = document.getElementById('bible-book-select');
  const chapterSelect = document.getElementById('bible-chapter-select');
  const book = bookSelect.value;
  const chapter = chapterSelect.value;
  const chapterData = SCRIPTURE_DATA[book]?.[chapter];

  const versesBox = document.getElementById('bible-verses-box');
  if (!versesBox || !chapterData) return;

  versesBox.innerHTML = '';

  Object.entries(chapterData).forEach(([vNum, text]) => {
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
  const chapterData = SCRIPTURE_DATA[book]?.[chapter];

  if (!chapterData) return;

  let textToSpeak = `${book} Chapter ${chapter}. `;
  Object.entries(chapterData).forEach(([vNum, text]) => {
    textToSpeak += `Verse ${vNum}: ${text}. `;
  });

  if ('speechSynthesis' in window) {
    currentSpeechUtterance = new SpeechSynthesisUtterance(textToSpeak);
    currentSpeechUtterance.rate = 0.95; // Slightly slower for clear pronunciation
    
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
