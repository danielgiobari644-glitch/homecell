import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { initializeFirestore, collection, addDoc, onSnapshot, query, where, getDocs, updateDoc, doc, setDoc, deleteDoc, orderBy, limit, increment, arrayUnion, arrayRemove, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyCL4siNSgWX0gH5QIbl7OtZFDvBiHH9oP0",
    authDomain: "hcell-f3797.firebaseapp.com",
    databaseURL: "https://hcell-f3797-default-rtdb.firebaseio.com",
    projectId: "hcell-f3797",
    storageBucket: "hcell-f3797.firebasestorage.app",
    messagingSenderId: "940294292200",
    appId: "1:940294292200:web:45e38c21c2ea950ba7bf5d",
    measurementId: "G-0YN4548C8Z"
};

const SUPER_ADMIN_EMAIL = "danielgiobari644@gmail.com";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit for photos/videos/documents

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const storage = getStorage(app);

let currentUser = null;
let currentProfile = null;
let isDark = false;
let isLogin = true;
let tutorialStep = 0;
let themePreference = localStorage.getItem('themePreference') || 'auto';
let customTheme = localStorage.getItem('customTheme') || 'default';
let geminiApiKey = localStorage.getItem('geminiApiKey') || '';
let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
let notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';

const UserRole = { USER: 'user', ADMIN: 'admin', SUPER_ADMIN: 'super_admin' };

const AdminPermissions = {
    DELETE_POSTS: 'delete_posts',
    APPROVE_DOCUMENTS: 'approve_documents',
    DELETE_DOCUMENTS: 'delete_documents',
    MANAGE_USERS: 'manage_users',
    VIEW_MEMBERS: 'view_members',
    SEND_ANNOUNCEMENTS: 'send_announcements',
    MODERATE_CHAT: 'moderate_chat',
    MANAGE_ADMINS: 'manage_admins'
};

// IndexedDB for local media storage
let mediaDB = null;

function initMediaDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('HomeCellMediaDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            mediaDB = request.result;
            resolve(mediaDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('media')) {
                const store = db.createObjectStore('media', { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

async function storeMediaLocally(file, id) {
    if (!mediaDB) await initMediaDB();
    
    return new Promise((resolve, reject) => {
        const transaction = mediaDB.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        
        const mediaData = {
            id: id,
            file: file,
            filename: file.name,
            type: file.type,
            size: file.size,
            timestamp: Date.now()
        };
        
        const request = store.add(mediaData);
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
}

async function getMediaLocally(id) {
    if (!mediaDB) await initMediaDB();
    
    return new Promise((resolve, reject) => {
        const transaction = mediaDB.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const request = store.get(id);
        
        request.onsuccess = () => {
            if (request.result) {
                resolve(URL.createObjectURL(request.result.file));
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

async function deleteMediaLocally(id) {
    if (!mediaDB) await initMediaDB();
    
    return new Promise((resolve, reject) => {
        const transaction = mediaDB.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Initialize media database on app start
initMediaDB().catch(console.error);

// Custom theme definitions (Modern Professional Colors)
const customThemes = {
    default: {
        name: 'Indigo',
        colors: {
            primary: '#6366f1', // Modern indigo
            secondary: '#6366f1',
            accent: '#6366f1'
        }
    },
    ocean: {
        name: 'Cyan',
        colors: {
            primary: '#06b6d4', // Modern cyan
            secondary: '#06b6d4',
            accent: '#06b6d4'
        }
    },
    sunset: {
        name: 'Rose',
        colors: {
            primary: '#f43f5e', // Modern rose
            secondary: '#f43f5e',
            accent: '#f43f5e'
        }
    },
    forest: {
        name: 'Emerald',
        colors: {
            primary: '#10b981', // Modern emerald
            secondary: '#10b981',
            accent: '#10b981'
        }
    },
    royal: {
        name: 'Purple',
        colors: {
            primary: '#a855f7', // Modern purple
            secondary: '#a855f7',
            accent: '#a855f7'
        }
    },
    crimson: {
        name: 'Orange',
        colors: {
            primary: '#f97316', // Modern orange
            secondary: '#f97316',
            accent: '#f97316'
        }
    }
};

const tutorialSteps = [
    { title: "Welcome to Home.cell!", description: "Your community social network. Share, connect, and grow together.", icon: "fa-users", color: "from-blue-600 to-blue-500" },
    { title: "Share Your Story", description: "Post photos, videos, or thoughts with beautiful backgrounds.", icon: "fa-images", color: "from-rose-600 to-rose-500" },
    { title: "Stay Connected", description: "Like, comment, and share posts with your community.", icon: "fa-heart", color: "from-emerald-600 to-emerald-500" },
    { title: "Build Your Profile", description: "Add your details so the community can know you better!", icon: "fa-user-circle", color: "from-amber-600 to-amber-500" }
];

window.firebase = { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, setDoc, orderBy, limit, increment, arrayUnion, arrayRemove, getDoc };
window.firebaseAuth = { signOut };
window.firebaseStorage = { storage, ref, uploadBytesResumable, getDownloadURL, deleteObject };
window.app = { db, auth, storage, currentUser, currentProfile, UserRole, AdminPermissions, MAX_FILE_SIZE, geminiApiKey };
window.initMediaDB = initMediaDB;
window.storeMediaLocally = storeMediaLocally;
window.getMediaLocally = getMediaLocally;
window.deleteMediaLocally = deleteMediaLocally;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
    toast.innerHTML = `<i class="fa-solid ${icons[type]} text-xl"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function showError(message) { showToast(message, 'error'); }
function showSuccess(message) { showToast(message, 'success'); }
function showWarning(message) { showToast(message, 'warning'); }

function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (show) {
            overlay.style.display = 'flex';
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
            setTimeout(() => overlay.style.display = 'none', 500);
        }
    }
}

function applyTheme() {
    // Apply custom theme colors
    const theme = customThemes[customTheme] || customThemes.default;
    const root = document.documentElement.style;
    
    // Set brand color
    root.setProperty('--brand-color', theme.colors.primary);
    
    // Calculate hover shade (10% darker)
    const brandHover = adjustColor(theme.colors.primary, -10);
    root.setProperty('--brand-hover', brandHover);
    
    // Calculate dark shade (30% darker)
    const brandDark = adjustColor(theme.colors.primary, -30);
    root.setProperty('--brand-dark', brandDark);
    
    // Set light background color for badges
    const primaryRgb = hexToRgb(theme.colors.primary);
    root.setProperty('--brand-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 24, g: 119, b: 242 };
}

// Helper function to adjust color brightness
function adjustColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// Notification System
function addNotification(title, message, type = 'info', link = null) {
    if (!notificationsEnabled) return;
    
    const notification = {
        id: Date.now(),
        title,
        message,
        type, // info, success, warning, error
        link,
        timestamp: Date.now(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Show toast for new notification
    showToast(title, type);

    // Show browser notification when permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
            if (registration && registration.showNotification) {
                registration.showNotification(title, {
                    body: message,
                    icon: '/icon.png',
                    badge: '/badge.png',
                    tag: `homecell-${notification.id}`,
                    renotify: true
                });
            }
        }).catch(() => {
            // ignore if service worker not ready yet
        });
    }
    
    // Update notification badge
    updateNotificationBadge();
}

function markNotificationAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationBadge();
    }
}

window.markAllNotificationsAsRead = function() {
    notifications.forEach(n => n.read = true);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationBadge();
    renderNotificationsList();
    showSuccess('All marked as read');
};

function getUnreadCount() {
    return notifications.filter(n => !n.read).length;
}

window.clearAllNotifications = function() {
    if (!confirm('Clear all notifications?')) return;
    notifications = [];
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationBadge();
    renderNotificationsList();
    showSuccess('All notifications cleared');
};

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const count = getUnreadCount();
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    const countText = document.getElementById('notification-count-text');
    if (countText) {
        countText.textContent = `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`;
    }
}

window.toggleMobileDropdown = function() {
    const dropdown = document.getElementById('mobile-dropdown');
    if (!dropdown) return;
    
    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('animate-fade-in');
        setTimeout(() => {
            document.addEventListener('click', closeMobileDropdownOnClickOutside);
        }, 100);
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('animate-fade-in');
        document.removeEventListener('click', closeMobileDropdownOnClickOutside);
    }
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;
    
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    
    if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    } else {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    }
};

window.toggleDesktopDropdown = function() {
    const dropdown = document.getElementById('desktop-dropdown');
    if (!dropdown) return;
    
    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('animate-scale-in');
        setTimeout(() => {
            document.addEventListener('click', closeDesktopDropdownOnClickOutside);
        }, 100);
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('animate-scale-in');
        document.removeEventListener('click', closeDesktopDropdownOnClickOutside);
    }
};

function closeMobileDropdownOnClickOutside(e) {
    const dropdown = document.getElementById('mobile-dropdown');
    const trigger = e.target.closest('button[onclick*="toggleMobileDropdown"]');
    
    if (!dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(e.target) && !trigger) {
            dropdown.classList.add('hidden');
            dropdown.classList.remove('animate-fade-in');
            document.removeEventListener('click', closeMobileDropdownOnClickOutside);
        }
    }
}

function closeDesktopDropdownOnClickOutside(e) {
    const dropdown = document.getElementById('desktop-dropdown');
    const trigger = e.target.closest('button[onclick*="toggleDesktopDropdown"]');
    
    if (!dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(e.target) && !trigger) {
            dropdown.classList.add('hidden');
            dropdown.classList.remove('animate-scale-in');
            document.removeEventListener('click', closeDesktopDropdownOnClickOutside);
        }
    }
}

function renderNotificationsList() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-solid fa-bell-slash text-4xl mb-3"></i>
                <p class="font-semibold">No notifications yet</p>
                <p class="text-sm mt-2">You'll see updates here</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map(notif => {
        const typeIcons = {
            info: 'fa-circle-info text-blue-500',
            success: 'fa-circle-check text-green-500',
            warning: 'fa-triangle-exclamation text-amber-500',
            error: 'fa-circle-xmark text-red-500'
        };
        
        const icon = typeIcons[notif.type] || typeIcons.info;
        const timeAgo = getTimeAgo(notif.timestamp);
        
        return `
            <div onclick="window.handleNotificationClick(${notif.id})" 
                class="p-4 rounded-xl ${notif.read ? 'bg-slate-50 dark:bg-slate-800/30' : 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'} hover:scale-[1.02] transition-all cursor-pointer">
                <div class="flex gap-3">
                    <div class="flex-shrink-0 mt-1">
                        <i class="fa-solid ${icon} text-lg"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2 mb-1">
                            <h4 class="font-bold text-sm dark:text-white ${!notif.read ? 'text-blue-900' : ''}">${notif.title}</h4>
                            ${!notif.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>' : ''}
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">${notif.message}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-500">${timeAgo}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    updateNotificationBadge();
}

window.handleNotificationClick = function(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    markNotificationAsRead(notificationId);
    renderNotificationsList();
    
    if (notification.link) {
        window.location.hash = notification.link;
        window.toggleNotificationCenter();
    }
};

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

// Custom Theme Functions
window.setCustomTheme = function(themeName) {
    if (customThemes[themeName]) {
        customTheme = themeName;
        localStorage.setItem('customTheme', themeName);
        applyTheme();
        showSuccess(`✨ Theme changed to ${customThemes[themeName].name}`);
        
        // Re-render settings page if we're on it
        if (window.app.currentPage === 'settings') {
            window.renderSettings();
        }
    }
};

window.toggleNotifications = function(enabled) {
    notificationsEnabled = enabled;
    localStorage.setItem('notificationsEnabled', enabled);
    showSuccess(enabled ? '🔔 Notifications enabled' : '🔕 Notifications disabled');
};

function navigateTo(path) { window.location.hash = path; }

function handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const pages = ['auth', 'feed', 'chat', 'documents', 'bible', 'members', 'admin', 'settings', 'profile'];
    pages.forEach(p => {
        const page = document.getElementById(`page-${p}`);
        if (page) page.classList.remove('active');
    });
    let targetPage = 'auth';
    if (currentUser) {
        if (hash === '/' || hash === '') targetPage = 'feed';
        else if (hash === '/chat') targetPage = 'chat';
        else if (hash === '/documents') targetPage = 'documents';
        else if (hash === '/bible') targetPage = 'bible';
        else if (hash === '/members') targetPage = 'members';
        else if (hash === '/admin') targetPage = 'admin';
        else if (hash === '/settings') targetPage = 'settings';
        else if (hash === '/profile') targetPage = 'profile';
    }
    const page = document.getElementById(`page-${targetPage}`);
    if (page) {
        page.classList.add('active');
        const renderFn = window[`render${targetPage.charAt(0).toUpperCase() + targetPage.slice(1)}`];
        if (renderFn) renderFn();
    }
    updateNavigation();
    
    // Show/hide APK download button based on page
    updateApkDownloadButton(targetPage);
}

function updateNavigation() {
    const hash = window.location.hash.slice(1) || '/';
    const links = document.querySelectorAll('[data-route]');
    links.forEach(link => {
        const route = link.getAttribute('data-route');
        link.classList.toggle('active', route === hash);
    });
}

function showTutorial() {
    const tutorial = document.getElementById('tutorial');
    if (tutorial) {
        tutorial.classList.remove('hidden');
        updateTutorialStep();
    }
}

function hideTutorial() {
    const tutorial = document.getElementById('tutorial');
    if (tutorial) tutorial.classList.add('hidden');
}

function updateTutorialStep() {
    const step = tutorialSteps[tutorialStep];
    const icon = document.getElementById('tutorial-icon');
    const title = document.getElementById('tutorial-title');
    const description = document.getElementById('tutorial-description');
    const dots = document.getElementById('tutorial-dots');
    const back = document.getElementById('tutorial-back');
    const next = document.getElementById('tutorial-next');
    const indicator = document.getElementById('tutorial-step-indicator');
    
    if (icon) {
        icon.className = `w-32 h-32 rounded-[3rem] bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-6xl shadow-2xl shadow-${step.color.split(' ')[0].split('-')[1]}-600/40 transition-all duration-500`;
        icon.innerHTML = `<i class="fa-solid ${step.icon}"></i>`;
    }
    if (title) title.textContent = step.title;
    if (description) description.textContent = step.description;
    if (indicator) indicator.textContent = `Step ${tutorialStep + 1} of ${tutorialSteps.length}`;
    if (dots) {
        dots.innerHTML = tutorialSteps.map((_, i) => 
            `<div class="w-2.5 h-2.5 rounded-full transition-all ${i === tutorialStep ? 'w-10 bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}"></div>`
        ).join('');
    }
    if (back) back.classList.toggle('hidden', tutorialStep === 0);
    if (next) next.innerHTML = tutorialStep === tutorialSteps.length - 1 ? 'Get Started! <i class="fa-solid fa-rocket ml-2"></i>' : 'Next <i class="fa-solid fa-arrow-right ml-2"></i>';
}

async function nextTutorialStep() {
    if (tutorialStep < tutorialSteps.length - 1) {
        tutorialStep++;
        updateTutorialStep();
    } else {
        await completeTutorial();
    }
}

function prevTutorialStep() {
    if (tutorialStep > 0) {
        tutorialStep--;
        updateTutorialStep();
    }
}

async function completeTutorial() {
    if (currentUser) {
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { hasSeenTutorial: true });
        } catch (error) {
            console.error('Error saving tutorial:', error);
        }
    }
    hideTutorial();
}

async function handleSignup(email, password, username, fullName, phoneNumber, gender) {
    try {
        showLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            throw new Error('Username already taken');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        let role = UserRole.USER;
        let permissions = [];
        if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
            role = UserRole.SUPER_ADMIN;
            permissions = Object.values(AdminPermissions);
        }
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            username: username.toLowerCase(),
            fullName: fullName,
            phoneNumber: phoneNumber,
            gender: gender,
            role: role,
            permissions: permissions,
            createdAt: Date.now(),
            hasSeenTutorial: false
        });
        showSuccess('Account created successfully!');
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message);
        throw error;
    } finally {
        showLoading(false);
    }
}

async function handleLogin(email, password) {
    try {
        showLoading(true);
        await signInWithEmailAndPassword(auth, email, password);
        showSuccess('Welcome back!');
    } catch (error) {
        console.error('Login error:', error);
        showError('Invalid email or password');
        throw error;
    } finally {
        showLoading(false);
    }
}

async function handleSignOut() {
    try {
        await signOut(auth);
        currentUser = null;
        currentProfile = null;
        navigateTo('/');
        showSuccess('Signed out successfully');
    } catch (error) {
        console.error('Sign out error:', error);
        showError('Failed to sign out');
    }
}

async function loadUserProfile(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            currentProfile = userDocSnap.data();
            window.app.currentProfile = currentProfile;
            console.log('✅ Profile loaded:', currentProfile);
            updateNavProfile();
            if (!currentProfile.hasSeenTutorial) {
                setTimeout(() => showTutorial(), 500);
            }
        } else {
            console.error('❌ No profile document found for user:', user.uid);
            showError('Profile not found. Please contact support.');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
    }
}

function updateNavProfile() {
    const avatar = document.getElementById('nav-profile-avatar');
    const name = document.getElementById('nav-profile-name');
    
    if (avatar && currentProfile) {
        if (currentProfile.photoURL) {
            avatar.innerHTML = `<img src="${currentProfile.photoURL}" alt="Profile" class="w-full h-full object-cover rounded-2xl">`;
        } else {
            const initial = (currentProfile.fullName || currentProfile.username || currentProfile.email || 'U')[0].toUpperCase();
            avatar.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-xl">${initial}</div>`;
        }
    }
    
    if (name && currentProfile) {
        const displayName = currentProfile.fullName || currentProfile.username || currentProfile.email || 'User';
        name.textContent = displayName;
    }
}

function hasPermission(permission) {
    if (!currentProfile) return false;
    if (currentProfile.role === UserRole.SUPER_ADMIN) return true;
    return currentProfile.permissions && currentProfile.permissions.includes(permission);
}

function setupNavigation() {
    const routes = [
        { path: '/', icon: 'fa-house', label: 'Feed', admin: false },
        { path: '/chat', icon: 'fa-comments', label: 'Chat', admin: false },
        { path: '/documents', icon: 'fa-folder-open', label: 'Resources', admin: false },
        { path: '/bible', icon: 'fa-book-bible', label: 'Bible', admin: false },
        { path: '/members', icon: 'fa-users', label: 'Members', admin: true, permission: AdminPermissions.VIEW_MEMBERS },
        { path: '/admin', icon: 'fa-user-shield', label: 'Admin Panel', admin: true, permission: AdminPermissions.MANAGE_ADMINS },
        { path: '/settings', icon: 'fa-gear', label: 'Settings', admin: false }
    ];
    
    const sidebarNav = document.getElementById('sidebar-nav-links');
    
    const filteredRoutes = routes.filter(r => {
        if (!r.admin) return true;
        if (currentProfile?.role === UserRole.SUPER_ADMIN) return true;
        if (r.permission) return hasPermission(r.permission);
        return currentProfile?.role === UserRole.ADMIN;
    });
    
    if (sidebarNav) {
        sidebarNav.innerHTML = filteredRoutes.map(route => `
            <a href="#${route.path}" data-route="${route.path}" onclick="window.toggleSidebar()" class="sidebar-nav-link flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
                <i class="fa-solid ${route.icon} text-lg"></i>
                <span>${route.label}</span>
            </a>
        `).join('');
    }
    
    updateNavigation();
}

// APK Download Button Management
// Initialize app update system
async function initApkDownloadButton() {
    const apkDoc = await getDoc(doc(db, 'app_settings', 'android_apk'));
    
    if (apkDoc.exists() && apkDoc.data().downloadUrl) {
        const apkData = apkDoc.data();
        const installedVersion = localStorage.getItem('installed_app_version') || null;
        const dismissedVersion = localStorage.getItem('dismissed_update_version') || null;
        
        // Show update if it's a new version and not dismissed
        if (apkData.version !== installedVersion && apkData.version !== dismissedVersion) {
            showAppUpdateNotification(apkData, installedVersion);
        }
    }
}

function showAppUpdateNotification(apkData, installedVersion) {
    const container = document.getElementById('apk-download-container');
    if (!container) return;
    
    const isUpdate = installedVersion !== null;
    const title = isUpdate ? '🎉 New Update Available!' : '📱 App Available';
    const actionText = isUpdate ? 'Update Now' : 'Install App';
    
    container.innerHTML = `
        <div class="glass-card p-6 animate-slide-up border-l-4 border-emerald-500">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <i class="fa-brands fa-android text-white text-3xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-lg dark:text-white mb-1">${title}</h4>
                        <p class="text-sm text-slate-600 dark:text-slate-400">
                            Version ${apkData.version}
                            ${isUpdate ? `<span class="text-xs text-slate-500"> • Current: ${installedVersion}</span>` : ''}
                        </p>
                    </div>
                </div>
                <button onclick="window.dismissUpdate('${apkData.version}')" 
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2">
                    <i class="fa-solid fa-times text-lg"></i>
                </button>
            </div>
            
            ${apkData.changelog ? `
                <div class="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <h5 class="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <i class="fa-solid fa-sparkles text-emerald-500"></i>
                        What's New
                    </h5>
                    <p class="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">${apkData.changelog}</p>
                </div>
            ` : ''}
            
            <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <span class="flex items-center gap-1">
                    <i class="fa-solid fa-box"></i>
                    ${(apkData.size / (1024 * 1024)).toFixed(1)} MB
                </span>
                <span class="flex items-center gap-1">
                    <i class="fa-solid fa-calendar"></i>
                    ${new Date(apkData.uploadedAt).toLocaleDateString()}
                </span>
            </div>
            
            <div class="flex gap-3">
                <button onclick="window.installUpdate('${apkData.downloadUrl}', '${apkData.version}')" 
                    class="flex-1 btn btn-primary hover-grow">
                    <i class="fa-solid fa-download mr-2"></i>
                    ${actionText}
                </button>
                ${isUpdate ? `
                    <button onclick="window.dismissUpdate('${apkData.version}')" 
                        class="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-semibold">
                        Later
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    container.classList.remove('hidden');
}

function updateApkDownloadButton(currentPage) {
    const container = document.getElementById('apk-download-container');
    if (!container) return;
    
    // Hide on admin and settings pages
    if (currentPage === 'admin' || currentPage === 'settings' || currentPage === 'auth') {
        container.classList.add('hidden');
    } else {
        // Check if should show based on version
        const hasContent = container.innerHTML.trim();
        if (hasContent) {
            container.classList.remove('hidden');
        }
    }
}

window.installUpdate = async function(url, version) {
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `HomeCellApp_v${version}.apk`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Mark version as installed
        localStorage.setItem('installed_app_version', version);
        localStorage.removeItem('dismissed_update_version');
        
        // Hide the notification
        const container = document.getElementById('apk-download-container');
        if (container) {
            container.classList.add('hidden');
        }
        
        showSuccess('✅ Update downloaded! Install the APK to complete the update.');
    } catch (error) {
        console.error('Update download error:', error);
        showError('Failed to download update');
    }
};

window.dismissUpdate = function(version) {
    localStorage.setItem('dismissed_update_version', version);
    const container = document.getElementById('apk-download-container');
    if (container) {
        container.classList.add('hidden');
    }
};

window.renderAuth = function() {
    const container = document.getElementById('page-auth');
    container.innerHTML = `
        <div class="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-950">
            <div class="w-full max-w-lg">
                <div class="text-center mb-12">
                    <div class="inline-flex items-center gap-4 mb-6">
                        <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/40">
                            <i class="fa-solid fa-users text-3xl"></i>
                        </div>
                        <h1 class="text-5xl font-black tracking-tight dark:text-white">Home.cell</h1>
                    </div>
                    <p class="text-slate-600 dark:text-slate-400 font-medium text-xl">Your community social network</p>
                </div>
                
                <div class="bg-white dark:bg-slate-900 rounded-[4rem] p-10 shadow-2xl border-2 border-slate-200 dark:border-slate-800">
                    <div class="flex gap-3 mb-8">
                        <button id="tab-login" class="flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all ${isLogin ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}">
                            Sign In
                        </button>
                        <button id="tab-signup" class="flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all ${!isLogin ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}">
                            Sign Up
                        </button>
                    </div>
                    
                    <form id="auth-form" class="space-y-6">
                        ${!isLogin ? `
                            <div>
                                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name *</label>
                                <input type="text" id="auth-fullname" required class="form-input" placeholder="John Doe">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Username *</label>
                                <input type="text" id="auth-username" required class="form-input" placeholder="johndoe">
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Phone Number *</label>
                                    <input type="tel" id="auth-phone" required class="form-input" placeholder="+234 801 234 5678">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Gender *</label>
                                    <select id="auth-gender" required class="form-input">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div>
                            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email *</label>
                            <input type="email" id="auth-email" required class="form-input" placeholder="you@example.com">
                        </div>
                        
                        <div>
                            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password *</label>
                            <input type="password" id="auth-password" required class="form-input" placeholder="••••••••" minlength="6">
                        </div>
                        
                        <button type="submit" class="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black rounded-[2rem] shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-105 active:scale-95 uppercase tracking-wider text-sm transition-all">
                            ${isLogin ? '<i class="fa-solid fa-right-to-bracket mr-2"></i>Sign In' : '<i class="fa-solid fa-user-plus mr-2"></i>Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('tab-login')?.addEventListener('click', () => { isLogin = true; renderAuth(); });
    document.getElementById('tab-signup')?.addEventListener('click', () => { isLogin = false; renderAuth(); });
    
    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        
        try {
            if (isLogin) {
                await handleLogin(email, password);
            } else {
                const fullName = document.getElementById('auth-fullname').value.trim();
                const username = document.getElementById('auth-username').value.trim();
                const phoneNumber = document.getElementById('auth-phone').value.trim();
                const gender = document.getElementById('auth-gender').value;
                
                if (!fullName || !username || !phoneNumber || !gender) {
                    showError('Please fill in all required fields');
                    return;
                }
                
                await handleSignup(email, password, username, fullName, phoneNumber, gender);
            }
        } catch (error) {
            // Error already handled in functions
        }
    });
};

/* ============================================
   PUSH NOTIFICATIONS SYSTEM
   ============================================ */
async function initPushNotifications(user) {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.warn('Push notifications not supported');
        return;
    }

    try {
        // Request notification permission
        if (Notification.permission === 'granted') {
            await registerServiceWorker(user);
            console.log('✅ Push notifications enabled');
        } else if (Notification.permission !== 'denied') {
            // Ask for permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await registerServiceWorker(user);
                addNotification('🔔 Notifications', 'You\'ve enabled push notifications!', 'success');
            }
        }
    } catch (error) {
        console.error('Push notification setup error:', error);
    }
}

async function registerServiceWorker(user) {
    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('sw.js', { scope: '/' });
            console.log('Service Worker registered:', registration);
            
            // Store user ID for service worker
            localStorage.setItem('pushedUserId', user.uid);
            
            // Listen for messages from service worker
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'INIT',
                    userId: user.uid
                });
            }
        }
    } catch (error) {
        console.warn('Service Worker registration failed:', error);
    }
}

window.sendPushNotification = async function(userId, title, message, type = 'info', data = {}) {
    try {
        // Save to Firebase for persistence
        await addDoc(collection(db, 'push_notifications'), {
            userId,
            title,
            message,
            type,
            data,
            timestamp: Date.now(),
            read: false
        });
        
        // Add local notification
        addNotification(title, message, type);
        
        // Send browser notification if permission granted
        if (Notification.permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.showNotification) {
                registration.showNotification(title, {
                    body: message,
                    icon: '/icon.png',
                    badge: '/badge.png',
                    tag: 'home-cell',
                    requireInteraction: type === 'error' || type === 'warning'
                });
            }
        }
    } catch (error) {
        console.error('Send push notification error:', error);
    }
};

window.requestNotificationPermission = async function() {
    if (!('Notification' in window)) {
        showError('Notifications not supported in your browser');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await initPushNotifications(currentUser);
            showSuccess('Notifications enabled!');
            return true;
        } else {
            showWarning('Notification permission denied');
            return false;
        }
    } catch (error) {
        showError('Failed to enable notifications');
        return false;
    }
};

function init() {
    applyTheme(); // Apply saved custom theme
    
    const tutorialNext = document.getElementById('tutorial-next');
    const tutorialBack = document.getElementById('tutorial-back');
    const tutorialSkip = document.getElementById('tutorial-skip');
    if (tutorialNext) tutorialNext.addEventListener('click', nextTutorialStep);
    if (tutorialBack) tutorialBack.addEventListener('click', prevTutorialStep);
    if (tutorialSkip) tutorialSkip.addEventListener('click', completeTutorial);
    
    onAuthStateChanged(auth, async (user) => {
        console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        
        if (user) {
            currentUser = user;
            window.app.currentUser = currentUser;
            console.log('👤 Loading profile for:', user.uid);
            await loadUserProfile(user);
            
            if (currentProfile) {
                console.log('✅ Profile loaded successfully');
                console.log('Role:', currentProfile.role);
                console.log('Permissions:', currentProfile.permissions);
                setupNavigation();
                
                // Initialize APK download button
                await initApkDownloadButton();
                
                // Initialize Push Notifications
                await initPushNotifications(user);
            } else {
                console.error('❌ Profile failed to load');
            }
            
            document.getElementById('app').classList.remove('hidden');
            navigateTo(window.location.hash.slice(1) || '/');
        } else {
            currentUser = null;
            currentProfile = null;
            console.log('👋 User signed out');
            document.getElementById('app').classList.remove('hidden');
            navigateTo('/');
        }
        showLoading(false);
    });
    
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

showLoading(true);
init();

import('./pages.js').then(() => {
    console.log('✅ All pages loaded successfully');
}).catch(err => {
    console.error('❌ Failed to load pages:', err);
    showError('Failed to load app components');
});

window.handleSignOut = handleSignOut;
window.showToast = showToast;
window.showError = showError;
window.showSuccess = showSuccess;
window.showWarning = showWarning;
window.hasPermission = hasPermission;

window.updateGeminiKey = function(key) {
    geminiApiKey = key;
    localStorage.setItem('geminiApiKey', key);
    window.app.geminiApiKey = key;
    showSuccess('Gemini API key saved successfully!');
};
