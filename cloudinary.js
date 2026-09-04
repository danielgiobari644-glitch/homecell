// cloudinary.js
// Home.cell - Real Unsigned Cloudinary Media Storage & Delivery
// Cloud Name: dhi61h6ea
// Unsigned Upload Preset: homecell_uploads

const CLOUDINARY_CLOUD_NAME = 'dhi61h6ea';
const CLOUDINARY_UPLOAD_PRESET = 'homecell_uploads';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

/**
 * Upload a media file (image or video) directly to Cloudinary using unsigned preset.
 * @param {File|Blob} file - The file object from input or drop
 * @param {string} folder - Destination folder: 'homecell/profiles' | 'homecell/feed' | 'homecell/fellowships' | 'homecell/events' | 'homecell/quizzes'
 * @param {function} onProgress - Callback with percent progress (0-100)
 * @returns {Promise<{url: string, publicId: string, resourceType: string, format: string, bytes: number}>}
 */
async function uploadToCloudinary(file, folder = 'homecell/feed', onProgress = null) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Media Validation
  const maxImageSize = 25 * 1024 * 1024; // 25MB
  const maxVideoSize = 100 * 1024 * 1024; // 100MB
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isImage && !isVideo) {
    throw new Error('Invalid file format. Please select an image (JPG, PNG, WebP, GIF) or video (MP4, WebM, MOV).');
  }

  if (isImage && file.size > maxImageSize) {
    throw new Error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 25MB.`);
  }

  if (isVideo && file.size > maxVideoSize) {
    throw new Error(`Video is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 100MB.`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_API_URL, true);

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const secureUrl = data.secure_url || data.url;
          const publicId = data.public_id;
          const resourceType = data.resource_type || (isVideo ? 'video' : 'image');

          // Persist media metadata to Firestore collection 'media'
          try {
            const user = window.auth?.currentUser;
            if (window.db && user) {
              await window.db.collection('media').add({
                url: secureUrl,
                publicId: publicId || '',
                type: resourceType,
                bytes: data.bytes || file.size || 0,
                format: data.format || '',
                uploadedBy: user.uid,
                uploadedByName: window.currentUserProfile?.displayName || user.displayName || 'Believer',
                purpose: folder,
                createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
              });
            }
          } catch (metaErr) {
            console.warn('Media metadata record error:', metaErr);
          }

          resolve({
            url: secureUrl,
            publicId: publicId,
            resourceType: resourceType,
            format: data.format,
            bytes: data.bytes
          });
        } catch (parseErr) {
          reject(new Error('Failed to parse Cloudinary response: ' + parseErr.message));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          const message = errRes?.error?.message || `Cloudinary upload failed with status ${xhr.status}`;
          reject(new Error(message));
        } catch (_) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during media upload. Please check your internet connection.'));
    };

    xhr.send(formData);
  });
}

window.uploadToCloudinary = uploadToCloudinary;
window.CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
window.CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET;
