import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { initializeFirestore, collection, addDoc, onSnapshot, query, where, getDocs, updateDoc, doc, setDoc, deleteDoc, orderBy, limit, increment, arrayUnion, arrayRemove, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

let currentUser = null;
let currentProfile = null;
let isDark = false;
let isLogin = true;
let tutorialStep = 0;
let themePreference = localStorage.getItem('themePreference') || 'auto';
let geminiApiKey = localStorage.getItem('geminiApiKey') || '';

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

const tutorialSteps = [
    { title: "Welcome to Home.cell!", description: "Your community social network. Share, connect, and grow together.", icon: "fa-users", color: "from-blue-600 to-blue-500" },
    { title: "Share Your Story", description: "Post photos, videos, or thoughts with beautiful backgrounds.", icon: "fa-images", color: "from-rose-600 to-rose-500" },
    { title: "Stay Connected", description: "Like, comment, and share posts with your community.", icon: "fa-heart", color: "from-emerald-600 to-emerald-500" },
    { title: "Build Your Profile", description: "Add your details so the community can know you better!", icon: "fa-user-circle", color: "from-amber-600 to-amber-500" }
];

window.firebase = { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, setDoc, orderBy, limit, increment, arrayUnion, arrayRemove, getDoc };
window.firebaseAuth = { signOut };
window.app = { db, auth, currentUser, currentProfile, UserRole, AdminPermissions, MAX_FILE_SIZE, geminiApiKey };

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

function checkTimeBasedTheme() {
    if (themePreference === 'auto') {
        const hour = new Date().getHours();
        isDark = hour >= 18 || hour < 6;
    } else {
        isDark = themePreference === 'dark';
    }
    applyTheme();
}

function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('#theme-toggle i');
    const label = document.querySelector('#theme-toggle span');
    if (!icon || !label) return;
    if (themePreference === 'auto') {
        icon.className = 'fa-solid fa-clock text-xl group-hover:scale-110 transition-transform';
        label.textContent = 'Auto Theme';
    } else if (isDark) {
        icon.className = 'fa-solid fa-sun text-xl group-hover:scale-110 transition-transform';
        label.textContent = 'Light Mode';
    } else {
        icon.className = 'fa-solid fa-moon text-xl group-hover:scale-110 transition-transform';
        label.textContent = 'Dark Mode';
    }
}

function toggleTheme() {
    if (themePreference === 'auto') {
        themePreference = 'light';
        isDark = false;
    } else if (themePreference === 'light') {
        themePreference = 'dark';
        isDark = true;
    } else {
        themePreference = 'auto';
        checkTimeBasedTheme();
        localStorage.setItem('themePreference', themePreference);
        return;
    }
    localStorage.setItem('themePreference', themePreference);
    applyTheme();
}

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
}

function updateNavigation() {
    const hash = window.location.hash.slice(1) || '/';
    const links = document.querySelectorAll('[data-route]');
    links.forEach(link => {
        const route = link.getAttribute('data-route');
        if (route === hash) {
            link.classList.add('bg-blue-100', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400');
        } else {
            link.classList.remove('bg-blue-100', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400');
        }
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
    
    const desktopNav = document.getElementById('nav-links');
    const mobileNav = document.getElementById('mobile-nav-links');
    
    const filteredRoutes = routes.filter(r => {
        if (!r.admin) return true;
        if (currentProfile?.role === UserRole.SUPER_ADMIN) return true;
        if (r.permission) return hasPermission(r.permission);
        return currentProfile?.role === UserRole.ADMIN;
    });
    
    if (desktopNav) {
        desktopNav.innerHTML = filteredRoutes.map(route => `
            <a href="#${route.path}" data-route="${route.path}" class="flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium group">
                <i class="fa-solid ${route.icon} text-xl group-hover:scale-110 transition-transform"></i>
                <span class="hidden lg:block font-semibold">${route.label}</span>
            </a>
        `).join('');
    }
    
    if (mobileNav) {
        mobileNav.innerHTML = filteredRoutes.slice(0, 5).map(route => `
            <a href="#${route.path}" data-route="${route.path}" class="flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400 transition-all">
                <i class="fa-solid ${route.icon} text-xl"></i>
                <span class="text-[10px] font-bold uppercase tracking-wide">${route.label}</span>
            </a>
        `).join('');
    }
    
    updateNavigation();
}

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

function init() {
    checkTimeBasedTheme();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
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
