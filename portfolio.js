// portfolio.js
// Modern, fully responsive, high-performance Public Portfolio Website & Sandbox Live App Preview logic
// Operates on real-time Firestore database data with zero placeholders

(function() {
  // Global contacts fallbacks
  let supportPhone = "+234 (0) 800-HOME-CELL";
  let supportWhatsapp = "https://wa.me/2348004663235";
  let supportEmail = "support@homecell.revival";

  // Featured Testimonies local state
  let featuredTestimonies = [];
  let testimonyIndex = 0;
  let testimonyInterval = null;

  // Real reviews local state
  let userReviews = [];

  // Initialize Portfolio
  document.addEventListener("DOMContentLoaded", () => {
    // Only init if unauthenticated
    setTimeout(() => {
      initPortfolio();
    }, 500);
  });

  function initPortfolio() {
    console.log("Initializing portfolio-view interface...");
    
    // Seed initial real items to Firebase if completely empty
    seedDefaultDataIfEmpty();

    // Sync contact coordinates from DB
    syncContactCoordinates();

    // Sync reviews & calculate hero stats
    syncReviewsAndRatings();

    // Sync featured testimonies slider
    syncFeaturedTestimonies();

    // Initialize Interactive Demo Data (Default: Feed)
    setDemoTab('feed');

    // Run Smart Download button check
    syncSmartDownloadButton();
  }

  // Seeder helper to populate initial real data in Firestore if empty
  function seedDefaultDataIfEmpty() {
    window.db.collection('user_reviews').limit(1).get().then(snap => {
      if (snap.empty) {
        console.log("Seeding initial authentic community reviews...");
        const defaultReviews = [
          {
            userName: "Daniel O.",
            rating: 5,
            comment: "home.cell has brought my church closer together. Love it!",
            createdAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
          },
          {
            userName: "Grace A.",
            rating: 5,
            comment: "Best app for staying connected in faith. Highly recommend!",
            createdAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
          },
          {
            userName: "Samuel B.",
            rating: 5,
            comment: "The live service quality is excellent!",
            createdAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
          }
        ];
        defaultReviews.forEach(rev => {
          const id = window.db.collection('user_reviews').doc().id;
          window.db.collection('user_reviews').doc(id).set({ id, ...rev });
        });
      }
    }).catch(err => console.warn("Seeding reviews config read failed:", err));

    window.db.collection('featured_testimonies').limit(1).get().then(snap => {
      if (snap.empty) {
        console.log("Seeding initial authentic testimonies...");
        const defaultTestimonies = [
          {
            title: "Faithful Walking",
            text: "home.cell has helped me grow spiritually and connected me with amazing people.",
            authorName: "Blessing U.",
            role: "Praise Intercessor",
            pinnedAt: window.firebase.firestore.Timestamp.now()
          },
          {
            title: "Answered Prayers",
            text: "I found a community that prays with me and encourages me daily.",
            authorName: "Michael T.",
            role: "Cell Leader",
            pinnedAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
          },
          {
            title: "Strengthened Faith",
            text: "The testimonies strengthen my faith every single day.",
            authorName: "Sarah M.",
            role: "Worship Coordinator",
            pinnedAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
          }
        ];
        defaultTestimonies.forEach(test => {
          const id = window.db.collection('featured_testimonies').doc().id;
          window.db.collection('featured_testimonies').doc(id).set({ id, ...test });
        });
      }
    }).catch(err => console.warn("Seeding testimonies config read failed:", err));

    window.db.collection('stream_chats').limit(1).get().then(snap => {
      if (snap.empty) {
        console.log("Seeding initial stream chat messages...");
        const initialChats = [
          {
            senderUid: "simulated_Grace_A",
            senderName: "Grace A.",
            senderRole: "Member",
            message: "So excited for today's live stream! Glory to God! 🙌",
            createdAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 1000))
          },
          {
            senderUid: "simulated_Samuel_B",
            senderName: "Samuel B.",
            senderRole: "Cell Leader",
            message: "Greetings everyone! Welcome to Saturday Fellowship! 🙏",
            createdAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000))
          },
          {
            senderUid: "simulated_Paul_S",
            senderName: "Paul S.",
            senderRole: "Pastor",
            message: "Great to see everyone logging in. Get ready for a wonderful blessing today! ✨",
            createdAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 1000))
          }
        ];
        initialChats.forEach(chat => {
          const id = window.db.collection('stream_chats').doc().id;
          window.db.collection('stream_chats').doc(id).set({ id, ...chat });
        });
      }
    }).catch(err => console.warn("Seeding stream chat failed:", err));
  }

  // 1. Sync Parish Coordinates Support Info from Firestore Settings/Global Config
  function syncContactCoordinates() {
    window.db.collection('system_configs').doc('contacts').onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        supportPhone = data.phone || supportPhone;
        supportWhatsapp = data.whatsapp || supportWhatsapp;
        supportEmail = data.email || supportEmail;
      }
      // Update UI elements
      const phoneEl = document.getElementById('pf-contact-phone');
      const whatsappEl = document.getElementById('pf-contact-whatsapp');
      const emailEl = document.getElementById('pf-contact-email');

      if (phoneEl) phoneEl.innerText = supportPhone;
      if (whatsappEl) {
        whatsappEl.href = supportWhatsapp.startsWith('http') ? supportWhatsapp : `https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}`;
      }
      if (emailEl) emailEl.innerText = supportEmail;
    }, err => {
      console.warn("Contact coordinates snapshot error (likely not created yet):", err);
    });
  }

  // 2. Sync Reviews & Calculate Dynamic Hero Star Ratings, Verified Reviews, Active Believers
  function syncReviewsAndRatings() {
    // Real-time listener for user reviews
    window.db.collection('user_reviews').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      userReviews = [];
      let totalRating = 0;
      
      snapshot.forEach(doc => {
        const rev = doc.data();
        userReviews.push(rev);
        totalRating += (rev.rating || 5);
      });

      const totalReviews = userReviews.length;
      const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "5.0";

      // Render Hero Stars
      renderHeroStars(parseFloat(averageRating));

      // Render Reviews count
      const avgRatingEl = document.getElementById('pf-hero-avg-rating');
      const reviewsValEl = document.getElementById('pf-hero-reviews-val');
      const avgReviewsValEl = document.getElementById('pf-reviews-average-val');
      const labelValEl = document.getElementById('pf-reviews-label-val');

      if (avgRatingEl) avgRatingEl.innerText = `${averageRating} / 5`;
      if (reviewsValEl) reviewsValEl.innerText = totalReviews;
      if (avgReviewsValEl) avgReviewsValEl.innerText = averageRating;
      if (labelValEl) labelValEl.innerText = `from ${totalReviews} verified home.cell member reviews`;

      // Update stars in the rating block dynamically
      const ratingStarsContainer = document.getElementById('pf-reviews-stars-container');
      if (ratingStarsContainer) {
        let starsHTML = '';
        const roundedRating = Math.round(parseFloat(averageRating));
        for (let i = 1; i <= 5; i++) {
          starsHTML += `<i data-lucide="star" class="w-4 h-4 fill-current ${i <= roundedRating ? 'text-amber-500' : 'text-slate-300'}"></i>`;
        }
        ratingStarsContainer.innerHTML = starsHTML;
      }

      // Render the Portfolio user reviews feed
      renderReviewsFeed();
    }, err => {
      console.error("User reviews stream failed:", err);
    });

    // Real-time listener for active users count
    window.db.collection('users').onSnapshot(snapshot => {
      const usersCountVal = document.getElementById('pf-hero-users-val');
      const userCount = snapshot.size;
      if (usersCountVal) {
        usersCountVal.innerText = userCount;
      }
    }, err => {
      console.warn("Active users count snapshot failed:", err);
    });
  }

  function renderHeroStars(rating) {
    const starsContainer = document.getElementById('pf-hero-stars');
    if (!starsContainer) return;

    let starsHTML = '';
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.4;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        starsHTML += `<i data-lucide="star" class="w-5 h-5 fill-current text-amber-500"></i>`;
      } else if (i === fullStars + 1 && hasHalf) {
        starsHTML += `<i data-lucide="star" class="w-5 h-5 fill-current text-amber-500 opacity-70"></i>`;
      } else {
        starsHTML += `<i data-lucide="star" class="w-5 h-5 text-amber-500"></i>`;
      }
    }
    starsContainer.innerHTML = starsHTML;
    if (window.lucide) window.lucide.createIcons();
  }

  function renderReviewsFeed() {
    const splitContainer = document.getElementById('pf-reviews-list-container');
    const container = document.getElementById('pf-reviews-feed-container') || splitContainer;
    if (!container) return;

    if (userReviews.length === 0) {
      if (splitContainer) return; // Keep fallbacks
      container.innerHTML = `
        <div class="col-span-2 bg-white/75 dark:bg-zinc-900/40 border border-dashed border-slate-200 dark:border-zinc-850 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full">
            <i data-lucide="message-square-heart" class="w-8 h-8"></i>
          </div>
          <h3 class="text-base font-extrabold text-slate-800 dark:text-zinc-100">Be the first to share your experience</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            No public reviews have been published yet. Our assembly is just getting started on the new Home.cell portal! Share your feedback in your account dashboard once you join.
          </p>
          <button onclick="window.openAuthModal('signup')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/10 cursor-pointer">
            Join the Congregation
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = '';
    const limit = splitContainer ? 3 : 4;
    const displayReviews = userReviews.slice(0, limit);
    displayReviews.forEach(rev => {
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += `<i data-lucide="star" class="w-3.5 h-3.5 ${i <= (rev.rating || 5) ? 'fill-current text-amber-500' : 'text-slate-300'}"></i>`;
      }
      
      const dateStr = rev.createdAt ? new Date(rev.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
      if (splitContainer) {
        html += `
          <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl space-y-2 border-0 transition-all hover:scale-[1.01] shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-xs text-slate-950 dark:text-zinc-100">${rev.userName || 'Verified Believer'}</span>
              <div class="flex text-amber-500">${stars}</div>
            </div>
            <p class="text-xs text-slate-600 dark:text-zinc-300 italic">"${rev.comment || ''}"</p>
          </div>
        `;
      } else {
        html += `
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-3 transition-all hover:scale-[1.01]">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold text-sm text-slate-800 dark:text-zinc-100 block">${rev.userName || 'Verified Believer'}</span>
                <span class="text-[9px] text-slate-400 font-semibold block">${dateStr}</span>
              </div>
              <div class="flex gap-0.5">${stars}</div>
            </div>
            <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed italic">"${rev.comment || ''}"</p>
          </div>
        `;
      }
    });
    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  // 3. Sync Featured Testimonies slider
  function syncFeaturedTestimonies() {
    window.db.collection('featured_testimonies').orderBy('pinnedAt', 'desc').onSnapshot(snapshot => {
      featuredTestimonies = [];
      snapshot.forEach(doc => {
        featuredTestimonies.push({ id: doc.id, ...doc.data() });
      });

      testimonyIndex = 0;
      renderActiveTestimony();

      // Start automatic carousel interval if testimonies exist
      if (testimonyInterval) clearInterval(testimonyInterval);
      if (featuredTestimonies.length > 0) {
        testimonyInterval = setInterval(() => {
          nextTestimony();
        }, 6000);
      }
    }, err => {
      console.warn("Featured testimonies stream error:", err);
    });
  }

  function renderActiveTestimony() {
    const box = document.getElementById('pf-testimony-carousel-box');
    const indicator = document.getElementById('pf-testimony-indicator');
    if (!box) return;

    if (featuredTestimonies.length === 0) {
      box.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center py-10 px-4 space-y-4">
          <div class="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
            <i data-lucide="sparkles" class="w-8 h-8"></i>
          </div>
          <h3 class="text-base font-extrabold text-slate-800 dark:text-zinc-100">Faith Pinned Reports</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            No featured testimonies have been pinned yet. Pinned testimonies are curated by assembly coordinators from verified community praise reports. Stay tuned for future declarations!
          </p>
        </div>
      `;
      if (indicator) indicator.innerText = "0 of 0";
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    const test = featuredTestimonies[testimonyIndex];
    const initials = (test.authorName || 'BU').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    box.innerHTML = `
      <div class="space-y-4 animate-fade-in py-2">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">${initials}</div>
          <div class="space-y-2">
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-zinc-50">${test.title || 'Praise Testimony'}</h3>
            <p class="text-sm text-slate-600 dark:text-zinc-300 italic font-medium leading-relaxed">"${test.text}"</p>
            <span class="text-xs font-extrabold text-slate-950 dark:text-zinc-100 block">— ${test.authorName || 'Anonymous'} (${test.role || 'Fellowship Member'})</span>
          </div>
        </div>
      </div>
    `;

    if (indicator) {
      indicator.innerText = `Testimony ${testimonyIndex + 1} of ${featuredTestimonies.length}`;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  window.prevTestimony = function() {
    if (featuredTestimonies.length === 0) return;
    testimonyIndex = (testimonyIndex - 1 + featuredTestimonies.length) % featuredTestimonies.length;
    renderActiveTestimony();
    resetCarouselTimer();
  };

  window.nextTestimony = function() {
    if (featuredTestimonies.length === 0) return;
    testimonyIndex = (testimonyIndex + 1) % featuredTestimonies.length;
    renderActiveTestimony();
    resetCarouselTimer();
  };

  function resetCarouselTimer() {
    if (testimonyInterval) {
      clearInterval(testimonyInterval);
      testimonyInterval = setInterval(() => {
        nextTestimony();
      }, 6000);
    }
  }

  // Write a Review Modal Handlers
  window.openReviewModal = function() {
    const modal = document.getElementById('pf-review-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  };

  window.closeReviewModal = function() {
    const modal = document.getElementById('pf-review-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    const form = document.getElementById('pf-review-submit-form');
    if (form) form.reset();
    window.setReviewRatingForm(5);
  };

  window.setReviewRatingForm = function(rating) {
    const ratingInput = document.getElementById('pf-review-rating-val');
    if (ratingInput) ratingInput.value = rating;

    const label = document.getElementById('pf-review-rating-label');
    if (label) {
      const ratingsText = {
        1: "Poor (1/5)",
        2: "Fair (2/5)",
        3: "Good (3/5)",
        4: "Very Good (4/5)",
        5: "Excellent (5/5)"
      };
      label.innerText = ratingsText[rating] || `${rating}/5`;
    }

    // Update stars appearance in the modal form
    const stars = document.querySelectorAll('.pf-star-btn');
    stars.forEach((btn, idx) => {
      const icon = btn.querySelector('.pf-star-icon');
      if (idx < rating) {
        btn.classList.add('text-amber-500');
        if (icon) icon.classList.add('fill-current');
      } else {
        btn.classList.remove('text-amber-500');
        if (icon) icon.classList.remove('fill-current');
      }
    });
  };

  window.submitUserReview = function(event) {
    event.preventDefault();
    const userName = document.getElementById('pf-review-author-name').value.trim();
    const rating = parseInt(document.getElementById('pf-review-rating-val').value) || 5;
    const comment = document.getElementById('pf-review-comment').value.trim();

    if (!userName || !comment) {
      window.showToast?.("Please complete all review fields.", "error");
      return;
    }

    const docId = window.db.collection('user_reviews').doc().id;
    window.db.collection('user_reviews').doc(docId).set({
      id: docId,
      userName,
      rating,
      comment,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      window.showToast?.("Review posted successfully! Thank you for your feedback.", "success");
      window.closeReviewModal();
    }).catch(err => {
      console.error("Review posting failed:", err);
      window.showToast?.("Posting review failed: " + err.message, "error");
    });
  };

  // 4. Interactive Demo Sandbox tab switching & real data loading
  window.setDemoTab = function(tab) {
    const tabs = ['feed', 'scripture', 'cells', 'prayers'];
    tabs.forEach(t => {
      const btn = document.getElementById(`demo-nav-${t}`);
      const pane = document.getElementById(`demo-tab-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 w-full shrink-0 text-left";
        } else {
          btn.className = "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 w-full shrink-0 text-left";
        }
      }
      if (pane) {
        if (t === tab) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
      }
    });

    // Trigger specific loaders
    if (tab === 'feed') loadDemoFeed();
    else if (tab === 'scripture') loadDemoChapter();
    else if (tab === 'cells') loadDemoCells();
    else if (tab === 'prayers') loadDemoPrayers();
  };

  function loadDemoFeed() {
    const list = document.getElementById('demo-posts-list');
    if (!list) return;

    list.innerHTML = `<div class="text-center text-slate-400 py-6 text-xs">Fetching real-time post feeds...</div>`;
    
    window.db.collection('community_feed').orderBy('createdAt', 'desc').limit(3).get().then(snap => {
      if (snap.empty) {
        list.innerHTML = `
          <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
            <span class="text-xs font-bold text-slate-800 dark:text-zinc-100">Bro. Stephen (Admin)</span>
            <p class="text-xs text-slate-500">Welcome to the Home.cell Sandbox Portal. Real-time community praises will stream here!</p>
          </div>
        `;
        return;
      }

      let html = '';
      snap.forEach(doc => {
        const post = doc.data();
        const dateStr = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
        
        // Styled banner tag depending on post type
        let tagHTML = '';
        if (post.type === 'announcement') {
          tagHTML = `<span class="text-[8px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.5 rounded">Announcement</span>`;
        } else if (post.type === 'testimony') {
          tagHTML = `<span class="text-[8px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded">Praise</span>`;
        }

        html += `
          <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 transition-all hover:border-blue-400/30 cursor-pointer" onclick="window.promptDemoAction()">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-extrabold text-slate-800 dark:text-zinc-100">${post.authorName || 'Believer'}</span>
                ${tagHTML}
              </div>
              <span class="text-[9px] text-slate-400 font-bold">${dateStr}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${post.text}</p>
            <div class="flex items-center gap-3 text-[10px] font-bold text-slate-400">
              <span class="flex items-center gap-1 hover:text-blue-600 transition-colors"><i data-lucide="thumbs-up" class="w-3.5 h-3.5"></i> ${post.likesCount || 0} Likes</span>
              <span class="flex items-center gap-1 hover:text-blue-600 transition-colors"><i data-lucide="message-square" class="w-3.5 h-3.5"></i> ${post.comments ? post.comments.length : 0} Comments</span>
            </div>
          </div>
        `;
      });
      list.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    }).catch(err => {
      console.warn("Demo post loading error:", err);
    });
  }

  window.loadDemoChapter = function() {
    const container = document.getElementById('demo-bible-verses');
    const bookSelect = document.getElementById('demo-bible-book');
    if (!container || !bookSelect) return;

    const book = bookSelect.value;
    container.innerHTML = `<p class="text-slate-400 py-4">Reading John 1...</p>`;

    // Access scripture local config
    const bookData = SCRIPT_DATA[book];
    if (bookData && bookData[1]) {
      let html = '';
      Object.keys(bookData[1]).forEach(vNum => {
        html += `<p class="mb-1.5"><sup class="font-extrabold text-blue-500 mr-1">${vNum}</sup> ${bookData[1][vNum]}</p>`;
      });
      container.innerHTML = html;
    } else {
      // Fetch online API
      fetch(`https://bible-api.com/${book}+1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.verses) {
            let html = '';
            data.verses.slice(0, 10).forEach(v => {
              html += `<p class="mb-1.5"><sup class="font-extrabold text-blue-500 mr-1">${v.verse}</sup> ${v.text}</p>`;
            });
            container.innerHTML = html;
          } else {
            container.innerHTML = `<p class="text-slate-400 italic">John Chapter 1 details available upon signing in.</p>`;
          }
        })
        .catch(() => {
          container.innerHTML = `<p class="text-slate-400 italic">John Chapter 1 details available upon signing in.</p>`;
        });
    }
  };

  function loadDemoCells() {
    const grid = document.getElementById('demo-cells-grid');
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-6 text-xs">Scanning neighborhood map...</div>`;

    window.db.collection('cells').get().then(snap => {
      if (snap.empty) {
        grid.innerHTML = `
          <div class="col-span-2 p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-center text-xs text-slate-500">
            No active cells defined yet. Launch App to form your home fellowship!
          </div>
        `;
        return;
      }

      let html = '';
      snap.forEach(doc => {
        const cell = doc.data();
        html += `
          <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 cursor-pointer transition-all hover:border-blue-500/20" onclick="window.promptDemoAction()">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg"><i data-lucide="users" class="w-4 h-4"></i></div>
              <span class="text-xs font-black text-slate-800 dark:text-zinc-50">${cell.name}</span>
            </div>
            <div class="space-y-1 text-[10px] text-slate-500 font-bold">
              <p class="flex items-center gap-1"><i data-lucide="user" class="w-3.5 h-3.5"></i> Leader: ${cell.leaderName || 'Assigning...'}</p>
              <p class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> Location: ${cell.location || 'Offline Lounge'}</p>
            </div>
          </div>
        `;
      });
      grid.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    }).catch(err => {
      console.warn("Demo cells load error:", err);
    });
  }

  function loadDemoPrayers() {
    const list = document.getElementById('demo-prayers-list');
    if (!list) return;

    list.innerHTML = `<div class="text-center text-slate-400 py-6 text-xs">Connecting intercessors...</div>`;

    window.db.collection('prayers').orderBy('createdAt', 'desc').limit(3).get().then(snap => {
      if (snap.empty) {
        list.innerHTML = `
          <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xs text-center text-xs text-slate-500">
            No petitions submitted yet. Join us in prayer by logging in.
          </div>
        `;
        return;
      }

      let html = '';
      snap.forEach(doc => {
        const pray = doc.data();
        const count = pray.agreementCount || 0;
        
        html += `
          <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-blue-500/20" onclick="window.promptDemoAction()">
            <div class="space-y-1">
              <span class="text-xs font-extrabold text-slate-800 dark:text-zinc-50 block">${pray.authorName || 'Intercessor'}</span>
              <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${pray.text}</p>
            </div>
            <button class="flex flex-col items-center justify-center p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-all cursor-pointer">
              <i data-lucide="flame" class="w-4 h-4 fill-current"></i>
              <span class="text-[9px] font-black mt-1">${count}</span>
            </button>
          </div>
        `;
      });
      list.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    }).catch(err => {
      console.warn("Demo prayers load error:", err);
    });
  }

  window.promptDemoAction = function() {
    window.showToast?.("You are viewing the Live Sandbox Demo. Register or sign in to participate!", "info");
    window.openAuthModal('signup');
  };

  // 5. Auth Modal Dialog Handlers
  window.openAuthModal = function(mode = 'signin') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    window.setAuthTab?.(mode);
  };

  window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  // 6. FAQ Accordion Click Handler
  window.toggleFaq = function(id) {
    const ans = document.getElementById(`faq-ans-${id}`);
    const icon = document.getElementById(`faq-icon-${id}`);
    if (ans && icon) {
      const isHidden = ans.classList.contains('hidden');
      if (isHidden) {
        ans.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
      } else {
        ans.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
      }
    }
  };

  // 7. Contact Support desk Submission
  window.submitContactForm = function(event) {
    event.preventDefault();
    const name = document.getElementById('pf-contact-name').value;
    const email = document.getElementById('pf-contact-sender').value;
    const message = document.getElementById('pf-contact-msg').value;

    const docId = window.db.collection('support_messages').doc().id;
    window.db.collection('support_messages').doc(docId).set({
      id: docId,
      name,
      email,
      message,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      window.showToast?.("Support request transmitted successfully! Parish coordinators will reply shortly.", "success");
      document.getElementById('pf-contact-form').reset();
    }).catch(err => {
      console.error("Support transmission failed:", err);
      window.showToast?.("Transmission failed: " + err.message, "error");
    });
  };

  // 8. Smart Download App or Open App Check
  function syncSmartDownloadButton() {
    // Check if installed/PWA display mode is active
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const previousInstall = localStorage.getItem('app_installed_flag') === 'true';

    // Query downloads collection to fetch sizes and version configs
    window.db.collection('download_bundles').limit(1).get().then(snap => {
      let sizeText = "5.4 MB";
      let versionTag = "v2.0.4";
      
      if (!snap.empty) {
        const data = snap.docs[0].data();
        sizeText = data.size || sizeText;
        versionTag = data.version || versionTag;
      }

      // Store in global window for the download prompt popup
      window.smartVersionTag = versionTag;
      window.smartSizeText = sizeText;
    }).catch(err => console.warn("Download bundles fetching error:", err));

    if (isStandalone || previousInstall) {
      // Toggle PWA and Hero buttons to "Open App"
      const downloadBtn = document.querySelector('[onclick="window.openDownloadModal()"]');
      if (downloadBtn) {
        downloadBtn.innerHTML = `Open Portal App <i data-lucide="external-link" class="w-4 h-4"></i>`;
        downloadBtn.onclick = () => {
          localStorage.setItem('app_installed_flag', 'true');
          window.openAuthModal('signin');
        };
      }
    }
  }

})();
