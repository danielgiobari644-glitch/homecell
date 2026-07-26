// share-modal.js
// Defensive script to handle sharing capabilities safely without throwing null reference exceptions

(function() {
  function initShareModal() {
    // Attempt to locate any share buttons or modal trigger elements defensively
    const shareBtn = document.getElementById('share-btn') || 
                     document.getElementById('share-button') || 
                     document.querySelector('.share-btn') || 
                     document.querySelector('[data-action="share"]');

    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Try Web Share API first
        if (navigator.share) {
          navigator.share({
            title: document.title || 'Home.cell Fellowship Portal',
            text: 'Connect, study scripture, share testimonies, and do daily devotions with our cell group fellowship!',
            url: window.location.origin
          })
          .then(() => console.log('Successfully shared'))
          .catch((err) => console.warn('Error sharing:', err));
        } else {
          // Fallback to clipboard copying
          const shareUrl = window.location.origin;
          navigator.clipboard.writeText(shareUrl)
            .then(() => {
              if (window.showToast) {
                window.showToast('📋 Portal link copied to clipboard! Share it with your cell members.', 'success');
              } else {
                alert('Portal link copied to clipboard!');
              }
            })
            .catch(() => {
              if (window.showToast) {
                window.showToast('Please copy the URL from your address bar to share.', 'info');
              }
            });
        }
      });
    }

    // Defensive check for close modal buttons
    const closeBtn = document.getElementById('share-close-btn') || 
                     document.getElementById('close-share-modal') || 
                     document.querySelector('.share-close');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const modal = document.getElementById('share-modal') || document.querySelector('.share-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    }
  }

  // Bind defensively on DOM content load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShareModal);
  } else {
    initShareModal();
  }
})();
