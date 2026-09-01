// file-chunk-manager.js
// Universal Base64 Chunking Engine for HomeCell Feed Media & Kingdom Store Digital Resources
// Prevents Firestore 1MB document limit truncation and ensures zero shortening for files, pics, videos & audio.

const CHUNK_SIZE_CHARS = 350 * 1024; // ~350 KB per chunk slice (well within Firestore 1MB doc limit)
const chunkMemoryCache = new Map();

/**
 * Split and save a Base64 string into chunk documents in Firestore file_chunks collection
 * @param {Object} options
 * @param {string} options.fileId - Unique identifier for the chunked file
 * @param {string} options.base64Data - Full Base64 Data URL or string
 * @param {string} [options.mimeType] - MIME type (e.g. image/jpeg, video/mp4, application/pdf)
 * @param {string} [options.fileName] - Original file name
 * @param {number} [options.fileSize] - Original byte size
 * @param {string} [options.uploaderUid] - User UID
 * @param {Function} [options.onProgress] - Optional progress callback (percent: number, current: number, total: number)
 * @returns {Promise<{fileId: string, totalChunks: number, fileSize: number, mimeType: string, fileName: string}>}
 */
async function saveBase64InChunks({ fileId, base64Data, mimeType, fileName, fileSize, uploaderUid, onProgress }) {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error("Invalid base64 data provided for chunking.");
  }

  const generatedFileId = fileId || `fc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const totalLength = base64Data.length;
  const totalChunks = Math.max(1, Math.ceil(totalLength / CHUNK_SIZE_CHARS));
  const effectiveMime = mimeType || (base64Data.startsWith('data:') ? base64Data.substring(5, base64Data.indexOf(';')) : 'application/octet-stream');
  const effectiveFileName = fileName || `file_${Date.now()}`;
  const effectiveSize = fileSize || Math.round(totalLength * 0.75);

  // Store in memory cache immediately for instant local retrieval
  chunkMemoryCache.set(generatedFileId, base64Data);

  // Save to local storage cache if reasonably sized for instant multi-tab reactivity
  try {
    if (totalLength < 4 * 1024 * 1024) {
      sessionStorage.setItem(`cached_chunk_file_${generatedFileId}`, base64Data);
    }
  } catch (e) {}

  const db = window.db;
  if (!db) {
    console.warn("Firestore not initialized, cached in-memory only.");
    return {
      fileId: generatedFileId,
      totalChunks,
      fileSize: effectiveSize,
      mimeType: effectiveMime,
      fileName: effectiveFileName
    };
  }

  const chunksCollection = db.collection('file_chunks');
  const FieldValue = window.firebase?.firestore?.FieldValue;

  // Firestore batch limit is 500 operations. We chunk into batches of 350.
  const BATCH_LIMIT = 350;
  for (let startIdx = 0; startIdx < totalChunks; startIdx += BATCH_LIMIT) {
    const endIdx = Math.min(totalChunks, startIdx + BATCH_LIMIT);
    const batch = db.batch();

    for (let i = startIdx; i < endIdx; i++) {
      const sliceStart = i * CHUNK_SIZE_CHARS;
      const sliceEnd = Math.min(totalLength, (i + 1) * CHUNK_SIZE_CHARS);
      const chunkData = base64Data.substring(sliceStart, sliceEnd);
      const chunkDocId = `${generatedFileId}_chunk_${i}`;
      const docRef = chunksCollection.doc(chunkDocId);

      batch.set(docRef, {
        id: chunkDocId,
        fileId: generatedFileId,
        chunkIndex: i,
        totalChunks: totalChunks,
        data: chunkData,
        mimeType: effectiveMime,
        fileName: effectiveFileName,
        fileSize: effectiveSize,
        uploaderUid: uploaderUid || window.auth?.currentUser?.uid || 'danielgiobari644@gmail.com',
        createdAt: FieldValue ? FieldValue.serverTimestamp() : new Date()
      });
    }

    await batch.commit();

    if (onProgress) {
      const percent = Math.round((endIdx / totalChunks) * 100);
      onProgress(percent, endIdx, totalChunks);
    }
  }

  return {
    fileId: generatedFileId,
    totalChunks,
    fileSize: effectiveSize,
    mimeType: effectiveMime,
    fileName: effectiveFileName
  };
}

/**
 * Reassemble and load a Base64 string from chunk documents in Firestore
 * @param {Object} options
 * @param {string} options.fileId - The chunked file ID
 * @param {number} [options.totalChunks] - Optional total chunks count if known
 * @param {Function} [options.onProgress] - Optional progress callback
 * @returns {Promise<string|null>} Full reconstructed Base64 string
 */
async function loadBase64FromChunks({ fileId, totalChunks, onProgress }) {
  if (!fileId) return null;

  // 1. Check in-memory cache
  if (chunkMemoryCache.has(fileId)) {
    if (onProgress) onProgress(100, totalChunks || 1, totalChunks || 1);
    return chunkMemoryCache.get(fileId);
  }

  // 2. Check session storage cache
  try {
    const cached = sessionStorage.getItem(`cached_chunk_file_${fileId}`);
    if (cached) {
      chunkMemoryCache.set(fileId, cached);
      if (onProgress) onProgress(100, totalChunks || 1, totalChunks || 1);
      return cached;
    }
  } catch (e) {}

  const db = window.db;
  if (!db) {
    console.warn("Firestore not available to load chunks for file:", fileId);
    return null;
  }

  try {
    let chunks = [];

    // If totalChunks is known and small (< 50), fetch in parallel
    if (totalChunks && totalChunks <= 50) {
      const fetchPromises = [];
      for (let i = 0; i < totalChunks; i++) {
        fetchPromises.push(
          db.collection('file_chunks').doc(`${fileId}_chunk_${i}`).get()
        );
      }

      const snapshots = await Promise.all(fetchPromises);
      snapshots.forEach((snap, idx) => {
        if (snap.exists) {
          chunks.push({ index: idx, data: snap.data().data });
        }
      });
    } else {
      // Otherwise query by fileId
      const snap = await db.collection('file_chunks')
        .where('fileId', '==', fileId)
        .get();

      snap.forEach(doc => {
        const d = doc.data();
        chunks.push({ index: d.chunkIndex !== undefined ? d.chunkIndex : 0, data: d.data });
      });
    }

    if (chunks.length === 0) {
      console.warn("No chunks found in Firestore for fileId:", fileId);
      return null;
    }

    // Sort strictly by chunkIndex to assemble without corruption
    chunks.sort((a, b) => a.index - b.index);

    const fullBase64 = chunks.map(c => c.data).join('');

    // Cache in memory for fast subsequent access
    chunkMemoryCache.set(fileId, fullBase64);

    try {
      if (fullBase64.length < 4 * 1024 * 1024) {
        sessionStorage.setItem(`cached_chunk_file_${fileId}`, fullBase64);
      }
    } catch (e) {}

    if (onProgress) onProgress(100, chunks.length, totalChunks || chunks.length);

    return fullBase64;
  } catch (err) {
    console.error("Error reassembling chunks for file:", fileId, err);
    return null;
  }
}

/**
 * Delete all chunk documents belonging to a fileId
 * @param {Object} options
 * @param {string} options.fileId
 * @param {number} [options.totalChunks]
 */
async function deleteBase64Chunks({ fileId, totalChunks }) {
  if (!fileId) return;

  chunkMemoryCache.delete(fileId);
  try {
    sessionStorage.removeItem(`cached_chunk_file_${fileId}`);
  } catch (e) {}

  const db = window.db;
  if (!db) return;

  try {
    if (totalChunks && totalChunks <= 100) {
      const batch = db.batch();
      for (let i = 0; i < totalChunks; i++) {
        batch.delete(db.collection('file_chunks').doc(`${fileId}_chunk_${i}`));
      }
      await batch.commit().catch(() => {});
    } else {
      const snap = await db.collection('file_chunks').where('fileId', '==', fileId).get();
      const batch = db.batch();
      snap.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit().catch(() => {});
    }
  } catch (e) {
    console.warn("Delete chunks note:", e);
  }
}

/**
 * Convert a File or Blob into a full Base64 Data URL string without loss
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Safely convert a Base64 Data URL into a Blob (handles large files)
 * @param {string} dataUrl
 * @returns {Blob|null}
 */
function chunkedDataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  try {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(parts[1]);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return new Blob([buffer], { type: mime });
  } catch (e) {
    console.warn("chunkedDataUrlToBlob error:", e);
    return null;
  }
}

// Expose on window object
window.saveBase64InChunks = saveBase64InChunks;
window.loadBase64FromChunks = loadBase64FromChunks;
window.deleteBase64Chunks = deleteBase64Chunks;
window.fileToBase64 = fileToBase64;
window.chunkedDataUrlToBlob = chunkedDataUrlToBlob;
window.CHUNK_SIZE_CHARS = CHUNK_SIZE_CHARS;

/**
 * Safely resolves a product's cover image url without ever producing an invalid `chunk:` URL scheme.
 * Returns an object with safe `src`, `isChunked`, `chunkId`, and `totalChunks`.
 * @param {Object} product
 * @returns {{ src: string, isChunked: boolean, chunkId: string, totalChunks: number }}
 */
function getSafeProductCoverData(product) {
  const DEFAULT_COVER = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80';
  if (!product) {
    return {
      src: DEFAULT_COVER,
      isChunked: false,
      chunkId: '',
      totalChunks: 1
    };
  }

  const rawCover = product.coverUrl || '';
  const rawImage = product.imageUrl || '';
  const rawFile = product.fileUrl || product.downloadUrl || '';

  let chunkId = product.coverChunkId || '';

  if (!chunkId && typeof rawCover === 'string' && rawCover.startsWith('chunk:')) {
    chunkId = rawCover.replace('chunk:', '');
  }
  if (!chunkId && typeof rawImage === 'string' && rawImage.startsWith('chunk:')) {
    chunkId = rawImage.replace('chunk:', '');
  }
  if (!chunkId && product.fileChunkId && (!rawCover || rawCover.startsWith('chunk:') || rawCover === rawFile)) {
    chunkId = product.fileChunkId;
  }

  const isChunked = Boolean(chunkId);
  const totalChunks = parseInt(product.coverTotalChunks || product.fileTotalChunks || 1) || 1;

  let safeSrc = DEFAULT_COVER;
  if (isChunked) {
    // Return an inline SVG placeholder so the browser NEVER queries an unknown protocol `chunk:`
    safeSrc = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%25' height='100%25' fill='%2318181b'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23f59e0b' font-family='sans-serif' font-weight='bold' font-size='14'>✨ Base64 Chunked Resource</text></svg>`;
  } else if (rawCover && !rawCover.startsWith('chunk:')) {
    safeSrc = rawCover;
  } else if (rawImage && !rawImage.startsWith('chunk:')) {
    safeSrc = rawImage;
  }

  return {
    src: safeSrc,
    isChunked: isChunked,
    chunkId: chunkId,
    totalChunks: totalChunks
  };
}

window.getSafeProductCoverData = getSafeProductCoverData;

