/**
 * ==============================================================================
 * R & L STUDIO - APPLICATION & INTERACTION SCRIPT (js/app.js)
 * ==============================================================================
 * 1. Dark-Themed Splash Screen / Preloader Controller (Smooth fade out)
 * 2. Supabase Authentication Modal (Google OAuth & Email/Password Sign-In)
 * 3. Project Details Lightbox Modal Gallery (Clean <img> without background frames)
 * ==============================================================================
 */

import { projectsData } from './projects-data.js';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getSession,
  onAuthStateChange
} from './supabase.js';

/* ==========================================================================
   1. SPLASH SCREEN / PRELOADER CONTROLLER
   ========================================================================== */
export function initSplashScreen() {
  const splash = document.getElementById('rlSplashScreen');
  if (!splash) return;

  const dismissSplash = () => {
    if (!splash.classList.contains('fade-out')) {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 500);
    }
  };

  // Dismiss when window load fires
  if (document.readyState === 'complete') {
    setTimeout(dismissSplash, 150);
  } else {
    window.addEventListener('load', () => setTimeout(dismissSplash, 200));
  }

  // Safety fallback: Ensure splash screen never traps the user if network slows down
  setTimeout(dismissSplash, 1500);
}

/* ==========================================================================
   2. SUPABASE AUTH MODAL & HEADER CONTROLLER
   ========================================================================== */
class AuthModalController {
  constructor() {
    this.modal = null;
    this.currentUser = null;
    this.mode = 'signin'; // 'signin' | 'signup' | 'profile'

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    this.modal = document.getElementById('authModal');
    this.authBtns = document.querySelectorAll('.auth-trigger-btn');
    this.closeBtn = document.getElementById('closeAuthBtn');
    this.googleBtn = document.getElementById('googleSignInBtn');
    this.authForm = document.getElementById('authEmailForm');
    this.emailInput = document.getElementById('authEmailInput');
    this.passwordInput = document.getElementById('authPasswordInput');
    this.submitBtn = document.getElementById('authSubmitBtn');
    this.tabSignIn = document.getElementById('tabSignIn');
    this.tabSignUp = document.getElementById('tabSignUp');
    this.authFeedback = document.getElementById('authFeedback');
    this.profileSection = document.getElementById('authProfileSection');
    this.formSection = document.getElementById('authFormSection');
    this.userEmailDisplay = document.getElementById('authUserEmail');
    this.signOutBtn = document.getElementById('authSignOutBtn');

    // Attach trigger clicks to all header Sign In buttons
    this.authBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    this.closeBtn?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        this.close();
      }
    });

    // Tab switching
    this.tabSignIn?.addEventListener('click', () => this.setMode('signin'));
    this.tabSignUp?.addEventListener('click', () => this.setMode('signup'));

    // Google Sign-In
    this.googleBtn?.addEventListener('click', async () => {
      try {
        this.showFeedback('Connecting to Google OAuth...', 'info');
        await signInWithGoogle();
      } catch (err) {
        console.error('[Google OAuth Error]', err);
        this.showFeedback(err.message || 'Failed to authenticate with Google.', 'error');
      }
    });

    // Email/Password submit
    this.authForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = this.emailInput?.value?.trim();
      const password = this.passwordInput?.value;

      if (!email || !password) {
        this.showFeedback('Please provide both email and password.', 'error');
        return;
      }

      if (password.length < 6) {
        this.showFeedback('Password must be at least 6 characters.', 'error');
        return;
      }

      try {
        this.setLoading(true);
        if (this.mode === 'signup') {
          this.showFeedback('Creating account with Supabase...', 'info');
          const data = await signUpWithEmail(email, password);
          if (data?.user && !data.session) {
            this.showFeedback('Verification email sent! Please check your inbox to confirm.', 'success');
          } else {
            this.showFeedback('Account created and signed in successfully!', 'success');
            setTimeout(() => this.close(), 1200);
          }
        } else {
          this.showFeedback('Authenticating...', 'info');
          await signInWithEmail(email, password);
          this.showFeedback('Signed in successfully!', 'success');
          setTimeout(() => this.close(), 1000);
        }
      } catch (err) {
        console.error('[Supabase Auth Error]', err);
        this.showFeedback(err.message || 'Authentication failed. Please verify credentials.', 'error');
      } finally {
        this.setLoading(false);
      }
    });

    // Sign out button inside profile modal
    this.signOutBtn?.addEventListener('click', async () => {
      try {
        await signOutUser();
        this.showFeedback('Signed out successfully.', 'info');
        setTimeout(() => this.close(), 800);
      } catch (err) {
        this.showFeedback(err.message || 'Error signing out.', 'error');
      }
    });

    // Check initial active session
    try {
      const session = await getSession();
      if (session?.user) {
        this.updateUserState(session.user);
      }
    } catch {
      // Ignored
    }

    // Subscribe to auth state updates
    onAuthStateChange((event, session) => {
      this.updateUserState(session?.user || null);
    });
  }

  setMode(mode) {
    this.mode = mode;
    this.clearFeedback();

    if (mode === 'signup') {
      this.tabSignUp?.classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignUp?.classList.remove('border-transparent', 'text-slate-500');
      this.tabSignIn?.classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignIn?.classList.add('border-transparent', 'text-slate-500');
      if (this.submitBtn) this.submitBtn.textContent = 'Create Studio Account';
    } else {
      this.tabSignIn?.classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignIn?.classList.remove('border-transparent', 'text-slate-500');
      this.tabSignUp?.classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignUp?.classList.add('border-transparent', 'text-slate-500');
      if (this.submitBtn) this.submitBtn.textContent = 'Sign In to Studio';
    }
  }

  updateUserState(user) {
    this.currentUser = user;

    this.authBtns.forEach(btn => {
      if (user) {
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Studio User';
        btn.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="truncate max-w-[110px] sm:max-w-[140px]">${displayName}</span>
        `;
        btn.classList.add('border-emerald-500/40', 'bg-emerald-500/10', 'text-emerald-600', 'dark:text-emerald-400');
        btn.classList.remove('text-slate-700', 'dark:text-slate-200');
      } else {
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>Sign In</span>
        `;
        btn.classList.remove('border-emerald-500/40', 'bg-emerald-500/10', 'text-emerald-600', 'dark:text-emerald-400');
        btn.classList.add('text-slate-700', 'dark:text-slate-200');
      }
    });

    if (user && this.userEmailDisplay) {
      this.userEmailDisplay.textContent = user.email || 'Authenticated User';
    }
  }

  open() {
    if (!this.modal) return;
    this.clearFeedback();

    if (this.currentUser) {
      // User is logged in: show profile summary
      if (this.profileSection) this.profileSection.classList.remove('hidden');
      if (this.formSection) this.formSection.classList.add('hidden');
    } else {
      // User is not logged in: show login form
      if (this.profileSection) this.profileSection.classList.add('hidden');
      if (this.formSection) this.formSection.classList.remove('hidden');
      this.setMode('signin');
    }

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isLoading;
    if (isLoading) {
      this.submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
      this.submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
  }

  showFeedback(message, type = 'info') {
    if (!this.authFeedback) return;
    this.authFeedback.textContent = message;
    this.authFeedback.classList.remove('hidden', 'text-red-500', 'text-emerald-500', 'text-blue-500');

    if (type === 'error') {
      this.authFeedback.classList.add('text-red-500');
    } else if (type === 'success') {
      this.authFeedback.classList.add('text-emerald-500');
    } else {
      this.authFeedback.classList.add('text-blue-500');
    }
  }

  clearFeedback() {
    if (!this.authFeedback) return;
    this.authFeedback.textContent = '';
    this.authFeedback.classList.add('hidden');
  }
}

/* ==========================================================================
   3. PROJECT DETAILS LIGHTBOX MODAL GALLERY
   ========================================================================== */
class ProjectModalGallery {
  constructor() {
    this.projects = window.RL_PROJECTS_DATA || projectsData || [];
    this.modal = null;
    this.currentProject = null;
    this.currentIndex = 0;
    this.activeScreenshots = [];

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
    this.renderSlide = this.renderSlide.bind(this);
    this.renderThumbnails = this.renderThumbnails.bind(this);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.modal = document.getElementById('carouselModal');
    if (!this.modal) return;

    this.closeBtn = document.getElementById('closeCarouselBtn');
    this.closeBottomBtn = document.getElementById('closeCarouselBottomBtn');
    this.prevBtn = document.getElementById('prevSlideBtn');
    this.nextBtn = document.getElementById('nextSlideBtn');
    this.titleEl = document.getElementById('modalAppTitle');
    this.taglineEl = document.getElementById('modalAppTagline');
    this.statusEl = document.getElementById('modalAppStatus');
    this.descEl = document.getElementById('modalAppDescription');
    this.techEl = document.getElementById('modalAppTechStack');
    this.mediaContainer = document.getElementById('carouselMediaContainer');
    this.thumbsContainer = document.getElementById('carouselThumbnails');
    this.captionEl = document.getElementById('screenshotCaption');
    this.counterEl = document.getElementById('screenshotCounter');
    this.actionBtn = document.getElementById('modalActionBtn');

    this.closeBtn?.addEventListener('click', this.close);
    this.closeBottomBtn?.addEventListener('click', this.close);
    this.prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.prev();
    });
    this.nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.next();
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (!this.modal || !this.modal.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'Escape') this.close();
    });

    this.bindCardTriggers();
  }

  bindCardTriggers() {
    document.querySelectorAll('.btn-open-modal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = btn.getAttribute('data-project-id');
        const project = this.projects.find((p) => p.id === pId);
        if (project) this.open(project);
      });
    });
  }

  open(project, initialIndex = 0) {
    if (!this.modal || !project) return;
    this.currentProject = project;
    this.currentIndex = initialIndex;

    // Load active screenshots: ONLY genuine screenshots, never hero.jpg fallback
    if (Array.isArray(project.screenshots) && project.screenshots.length > 0) {
      this.activeScreenshots = project.screenshots;
    } else if (project.image) {
      this.activeScreenshots = [project.image];
    } else {
      this.activeScreenshots = [];
    }

    if (this.titleEl) this.titleEl.textContent = project.title;
    if (this.taglineEl) this.taglineEl.textContent = project.tagline || project.category;
    if (this.statusEl) {
      this.statusEl.textContent = project.status;
      this.statusEl.className = project.status === 'Live' ? 'status-pill live' : (project.status === 'Beta Testing' ? 'status-pill beta' : 'status-pill dev');
    }
    if (this.descEl) this.descEl.textContent = project.fullDescription || project.shortDescription || '';
    if (this.actionBtn) {
      this.actionBtn.href = project.downloadUrl || `https://wa.me/97430854376?text=Inquiry%20regarding%20${encodeURIComponent(project.title)}`;
    }

    if (this.techEl) {
      this.techEl.innerHTML = (project.techStack || []).map((t) => `
        <span class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
          ${t}
        </span>
      `).join('');
    }

    this.renderSlide();
    this.renderThumbnails();

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  prev() {
    if (!this.activeScreenshots.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.activeScreenshots.length) % this.activeScreenshots.length;
    this.renderSlide();
  }

  next() {
    if (!this.activeScreenshots.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.activeScreenshots.length;
    this.renderSlide();
  }

  renderSlide() {
    if (!this.mediaContainer || !this.activeScreenshots.length) return;

    const currentSrc = this.activeScreenshots[this.currentIndex];
    const screenName = currentSrc.split('/').pop().replace('.jpg', '').replace('.png', '');
    const encodedSrc = encodeURI(currentSrc);

    this.mediaContainer.innerHTML = `
      <div class="clean-screenshot-wrapper w-full flex items-center justify-center p-2">
        <img
          src="${encodedSrc}"
          alt="${screenName}"
          class="clean-screenshot-img max-h-[65vh] max-w-full h-auto w-auto object-contain mx-auto rounded-lg shadow-xl block"
          loading="eager"
          onerror="if(!this.dataset.retried){this.dataset.retried='1'; this.src='/' + '${encodedSrc}'.replace(/^\\//,'');}"
        />
      </div>
    `;

    if (this.captionEl) this.captionEl.textContent = screenName;
    if (this.counterEl) this.counterEl.textContent = `${this.currentIndex + 1} / ${this.activeScreenshots.length}`;

    if (this.thumbsContainer) {
      this.thumbsContainer.querySelectorAll('.thumb-item').forEach((thumb, idx) => {
        if (idx === this.currentIndex) {
          thumb.classList.add('active');
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          thumb.classList.remove('active');
        }
      });
    }
  }

  renderThumbnails() {
    if (!this.thumbsContainer) return;

    if (this.activeScreenshots.length <= 1) {
      this.thumbsContainer.innerHTML = this.activeScreenshots.length === 1 ? `
        <div class="thumb-item active" data-index="0">
          <img src="${encodeURI(this.activeScreenshots[0])}" alt="Screenshot Thumbnail" loading="eager" />
        </div>
      ` : '';
      if (this.prevBtn) this.prevBtn.style.display = 'none';
      if (this.nextBtn) this.nextBtn.style.display = 'none';
      return;
    }

    if (this.prevBtn) this.prevBtn.style.display = 'flex';
    if (this.nextBtn) this.nextBtn.style.display = 'flex';

    this.thumbsContainer.innerHTML = this.activeScreenshots.map((src, idx) => `
      <div class="thumb-item ${idx === this.currentIndex ? 'active' : ''}" data-index="${idx}">
        <img src="${encodeURI(src)}" alt="Thumb ${idx + 1}" loading="eager" />
      </div>
    `).join('');

    this.thumbsContainer.querySelectorAll('.thumb-item').forEach((item) => {
      item.addEventListener('click', () => {
        this.currentIndex = parseInt(item.getAttribute('data-index'), 10);
        this.renderSlide();
      });
    });
  }
}

// Auto-initialize controllers
initSplashScreen();
export const authController = new AuthModalController();
export const galleryInstance = new ProjectModalGallery();

if (typeof window !== 'undefined') {
  window.RL_APP = {
    auth: authController,
    gallery: galleryInstance,
    initSplashScreen
  };
}
