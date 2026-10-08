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
import { liveWidgets } from './weather-clock.js';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPasswordForEmail,
  updateUser,
  signOutUser,
  getSession,
  onAuthStateChange
} from './supabase.js';

/* ==========================================================================
   1. SPLASH SCREEN / PRELOADER CONTROLLER
   ========================================================================== */
export function initSplashScreen(onComplete) {
  const splash = document.getElementById('rlSplashScreen');
  let dismissed = false;

  const dismissSplash = () => {
    if (dismissed) return;
    dismissed = true;
    if (splash && !splash.classList.contains('fade-out')) {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        if (typeof onComplete === 'function') onComplete();
      }, 350);
    } else {
      if (typeof onComplete === 'function') onComplete();
    }
  };

  if (!splash) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  // Dismiss when window load fires or if DOM is ready
  if (document.readyState === 'complete') {
    setTimeout(dismissSplash, 80);
  } else {
    window.addEventListener('load', () => setTimeout(dismissSplash, 100));
  }

  // Safety fallback: Ensure splash screen never traps the user if network slows down
  setTimeout(dismissSplash, 750);
}

/* ==========================================================================
   2. SUPABASE AUTH MODAL & HEADER CONTROLLER (WITH MANDATORY AUTH GATE)
   ========================================================================== */
class AuthModalController {
  constructor() {
    this.modal = null;
    this.currentUser = null;
    this.mode = 'signin'; // 'signin' | 'signup' | 'profile'
    this.isLockedGate = false;
    this.hasCheckedAuth = false;

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
    this.togglePasswordBtn = document.getElementById('togglePasswordBtn');
    this.eyeIcon = document.getElementById('eyeIcon');
    this.eyeOffIcon = document.getElementById('eyeOffIcon');
    this.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    this.lockBanner = document.getElementById('authLockBanner');
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
        this.open(false);
      });
    });

    // Close button (only active when not locked or when authenticated)
    this.closeBtn?.addEventListener('click', () => {
      if (!this.isLockedGate || this.currentUser) {
        this.close();
      }
    });

    // Backdrop click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        if (!this.isLockedGate || this.currentUser) {
          this.close();
        }
      }
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        if (!this.isLockedGate || this.currentUser) {
          this.close();
        }
      }
    });

    // Password Eye Toggle
    this.togglePasswordBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.passwordInput) return;
      if (this.passwordInput.type === 'password') {
        this.passwordInput.type = 'text';
        this.eyeIcon?.classList.add('hidden');
        this.eyeOffIcon?.classList.remove('hidden');
      } else {
        this.passwordInput.type = 'password';
        this.eyeIcon?.classList.remove('hidden');
        this.eyeOffIcon?.classList.add('hidden');
      }
    });

    // Forgot Password Flow
    this.forgotPasswordBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = this.emailInput?.value?.trim();
      if (!email) {
        this.showFeedback('Please enter your email address above to receive a password reset link.', 'info');
        this.emailInput?.focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showFeedback('Please enter a valid email address.', 'error');
        this.emailInput?.focus();
        return;
      }
      try {
        this.setLoading(true);
        this.showFeedback('Sending password reset email...', 'info');
        await resetPasswordForEmail(email, {
          redirectTo: 'https://rl-studio90.github.io/rlstudio.github.io/'
        });
        this.showFeedback(`Password reset email sent to ${email}! Check your inbox.`, 'success');
        this.showToast(`Password reset link sent to ${email}`, 'success');
      } catch (err) {
        console.error('[Reset Password Error]', err);
        console.log(err?.message || err);
        const actualError = err?.message || (typeof err === 'string' ? err : 'Error sending recovery email');
        this.showFeedback(actualError, 'error');
        this.showToast(actualError, 'error');
      } finally {
        this.setLoading(false);
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
            this.showToast('Verification email sent! Check your inbox.', 'info');
          } else {
            this.showFeedback('Account created and signed in successfully!', 'success');
            this.showToast('Studio Account created & signed in!', 'success');
            this.unlockGate();
            setTimeout(() => this.close(), 1000);
          }
        } else {
          this.showFeedback('Authenticating...', 'info');
          await signInWithEmail(email, password);
          this.showFeedback('Signed in successfully!', 'success');
          this.showToast('Welcome to R & L Studio!', 'success');
          this.unlockGate();
          setTimeout(() => this.close(), 800);
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
        this.currentUser = null;
        this.updateUserState(null);
        this.showFeedback('Signed out successfully.', 'info');
        this.showToast('Signed out of Studio.', 'info');
        setTimeout(() => {
          this.lockGate();
        }, 400);
      } catch (err) {
        this.showFeedback(err.message || 'Error signing out.', 'error');
      }
    });

    // Subscribe to auth state updates
    onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Open the "Set New Password" modal automatically
        showNewPasswordModal();
        return;
      }

      const user = session?.user || null;
      this.updateUserState(user);
      if (user) {
        this.unlockGate();
        if (this.modal?.classList.contains('active') && this.isLockedGate) {
          this.close();
        }
      } else if (this.hasCheckedAuth) {
        this.lockGate();
      }
    });

    // Check if URL hash or search params indicate password recovery mode or access_token upon load
    if (typeof window !== 'undefined') {
      const checkRecoveryUrl = () => {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const isRecovery =
          hash.includes('access_token') ||
          hash.includes('type=recovery') ||
          hash.includes('recovery') ||
          search.includes('type=recovery') ||
          search.includes('recovery');

        if (isRecovery) {
          showNewPasswordModal();
        }
      };

      // Check immediately and after potential async routing / SDK hash parsing
      setTimeout(checkRecoveryUrl, 100);
      setTimeout(checkRecoveryUrl, 600);
      window.addEventListener('hashchange', checkRecoveryUrl);
    }
  }

  async checkAuthGate() {
    this.hasCheckedAuth = true;
    try {
      const session = await getSession();
      if (session?.user) {
        this.updateUserState(session.user);
        this.unlockGate();
      } else {
        this.updateUserState(null);
        this.lockGate();
      }
    } catch (err) {
      console.warn('[Auth Gate Check Failed]', err);
      this.lockGate();
    }
  }

  lockGate() {
    this.isLockedGate = true;
    document.body.classList.add('auth-locked');
    document.documentElement.classList.add('auth-locked');
    if (this.modal) this.modal.classList.add('locked');
    if (this.closeBtn) this.closeBtn.style.display = 'none';
    if (this.lockBanner) this.lockBanner.classList.remove('hidden');

    this.open(true);
  }

  unlockGate() {
    this.isLockedGate = false;
    document.body.classList.remove('auth-locked');
    document.documentElement.classList.remove('auth-locked');
    if (this.modal) this.modal.classList.remove('locked');
    if (this.closeBtn) this.closeBtn.style.display = '';
    if (this.lockBanner) this.lockBanner.classList.add('hidden');
  }

  setMode(mode) {
    this.mode = mode;
    this.clearFeedback();

    if (this.passwordInput) {
      this.passwordInput.type = 'password';
      this.eyeIcon?.classList.remove('hidden');
      this.eyeOffIcon?.classList.add('hidden');
    }

    if (mode === 'signup') {
      this.tabSignUp?.classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignUp?.classList.remove('border-transparent', 'text-slate-500');
      this.tabSignIn?.classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignIn?.classList.add('border-transparent', 'text-slate-500');
      if (this.submitBtn) this.submitBtn.textContent = 'Create Studio Account';
      if (this.forgotPasswordBtn) this.forgotPasswordBtn.style.display = 'none';
    } else {
      this.tabSignIn?.classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignIn?.classList.remove('border-transparent', 'text-slate-500');
      this.tabSignUp?.classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      this.tabSignUp?.classList.add('border-transparent', 'text-slate-500');
      if (this.submitBtn) this.submitBtn.textContent = 'Sign In to Studio';
      if (this.forgotPasswordBtn) this.forgotPasswordBtn.style.display = '';
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

  open(forceLocked = false) {
    if (!this.modal) return;
    this.clearFeedback();

    if (this.currentUser && !forceLocked) {
      // User is logged in: show profile summary
      if (this.profileSection) this.profileSection.classList.remove('hidden');
      if (this.formSection) this.formSection.classList.add('hidden');
      if (this.closeBtn) this.closeBtn.style.display = '';
    } else {
      // User is not logged in: show login form
      if (this.profileSection) this.profileSection.classList.add('hidden');
      if (this.formSection) this.formSection.classList.remove('hidden');
      this.setMode('signin');
      if (this.isLockedGate && this.closeBtn) {
        this.closeBtn.style.display = 'none';
      }
    }

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (this.isLockedGate && !this.currentUser) return; // Cannot close if locked
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

  showToast(message, type = 'info') {
    const existing = document.querySelector('.auth-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `auth-toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

/* ==========================================================================
   PASSWORD RECOVERY & "SET NEW PASSWORD" MODAL CONTROLLER
   ========================================================================== */
export function showNewPasswordModal() {
  let modal = document.getElementById('newPasswordModal');
  if (!modal) {
    // If not found in static DOM, dynamically generate and append it
    modal = document.createElement('div');
    modal.id = 'newPasswordModal';
    modal.className = 'auth-modal-backdrop active';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'newPasswordModalTitle');
    modal.innerHTML = `
      <div class="auth-modal-card p-6 sm:p-8">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <div>
              <h2 id="newPasswordModalTitle" class="text-lg font-bold font-display text-slate-900 dark:text-white">
                Set New Password
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Secure your R &amp; L Studio account
              </p>
            </div>
          </div>
          <button id="closeNewPasswordModalBtn" type="button" aria-label="Close" class="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div id="newPasswordFeedback" class="hidden p-3 rounded-xl text-xs font-medium mb-4"></div>

        <form id="newPasswordForm" class="space-y-4">
          <div>
            <label for="newPasswordInput" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <div class="relative">
              <input
                id="newPasswordInput"
                type="password"
                required
                minlength="6"
                placeholder="At least 6 characters"
                class="form-input text-xs pr-10 w-full"
                autocomplete="new-password"
              />
              <button
                id="toggleNewPassModalBtn"
                type="button"
                aria-label="Toggle password visibility"
                class="password-toggle-btn absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg id="eyeIconNewPass" class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg id="eyeOffIconNewPass" class="w-4 h-4 text-slate-400 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <button
            id="saveNewPasswordBtn"
            type="submit"
            class="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            Save New Password
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    bindNewPasswordModalEvents(modal);
  } else {
    modal.classList.remove('hidden');
    modal.classList.add('active');
  }

  // Ensure standard auth modal is closed
  const standardAuth = document.getElementById('authModal');
  if (standardAuth) standardAuth.classList.remove('active');
  document.body.style.overflow = 'hidden';

  const input = modal.querySelector('#newPasswordInput');
  if (input) {
    setTimeout(() => input.focus(), 100);
  }
}

export function hideNewPasswordModal() {
  const modal = document.getElementById('newPasswordModal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
  }
  document.body.style.overflow = '';
}

function bindNewPasswordModalEvents(modal) {
  const closeBtn = modal.querySelector('#closeNewPasswordModalBtn');
  const form = modal.querySelector('#newPasswordForm');
  const input = modal.querySelector('#newPasswordInput');
  const toggleBtn = modal.querySelector('#toggleNewPassModalBtn');
  const eyeIcon = modal.querySelector('#eyeIconNewPass');
  const eyeOffIcon = modal.querySelector('#eyeOffIconNewPass');
  const feedbackEl = modal.querySelector('#newPasswordFeedback');
  const submitBtn = modal.querySelector('#saveNewPasswordBtn');

  // Close handlers
  closeBtn?.addEventListener('click', hideNewPasswordModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideNewPasswordModal();
  });

  // Password visibility toggle
  toggleBtn?.addEventListener('click', () => {
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      eyeIcon?.classList.add('hidden');
      eyeOffIcon?.classList.remove('hidden');
    } else {
      input.type = 'password';
      eyeIcon?.classList.remove('hidden');
      eyeOffIcon?.classList.add('hidden');
    }
  });

  // Form Submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = input?.value?.trim();

    if (!newPassword || newPassword.length < 6) {
      showModalFeedback('Password must be at least 6 characters.', 'error');
      input?.focus();
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving New Password...';
      showModalFeedback('Updating your password in Supabase...', 'info');

      const { data, error } = await updateUser({ password: newPassword });

      if (error) {
        console.error('[Update Password Error]', error);
        console.log(error.message);
        showModalFeedback(error.message || 'Failed to update password.', 'error');
        return;
      }

      showModalFeedback('Password updated successfully! Directing to studio...', 'success');
      if (window.RL_APP?.auth) {
        window.RL_APP.auth.showToast('Password updated successfully!', 'success');
        window.RL_APP.auth.unlockGate();
      }

      setTimeout(() => {
        hideNewPasswordModal();
        if (window.RL_APP?.auth) {
          window.RL_APP.auth.close();
        }
      }, 1500);
    } catch (err) {
      console.error('[Update Password Exception]', err);
      console.log(err?.message || err);
      showModalFeedback(err?.message || 'Error updating password.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save New Password';
    }
  });

  function showModalFeedback(msg, type = 'info') {
    if (!feedbackEl) return;
    feedbackEl.textContent = msg;
    feedbackEl.className = 'p-3 rounded-xl text-xs font-medium mb-4';
    if (type === 'error') {
      feedbackEl.classList.add('bg-red-500/10', 'text-red-600', 'dark:text-red-400', 'border', 'border-red-500/20');
    } else if (type === 'success') {
      feedbackEl.classList.add('bg-emerald-500/10', 'text-emerald-600', 'dark:text-emerald-400', 'border', 'border-emerald-500/20');
    } else {
      feedbackEl.classList.add('bg-blue-500/10', 'text-blue-600', 'dark:text-blue-400', 'border', 'border-blue-500/20');
    }
    feedbackEl.classList.remove('hidden');
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
export const authController = new AuthModalController();
export const galleryInstance = new ProjectModalGallery();

// Trigger Auth Wall check immediately after preloader finishes
initSplashScreen(() => {
  authController.checkAuthGate();
});

if (typeof window !== 'undefined') {
  window.RL_APP = {
    auth: authController,
    gallery: galleryInstance,
    weatherClock: liveWidgets,
    initSplashScreen,
    showNewPasswordModal,
    hideNewPasswordModal
  };
  window.showNewPasswordModal = showNewPasswordModal;
}
