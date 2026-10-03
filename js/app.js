/**
 * ==============================================================================
 * R & L STUDIO - APPLICATION & MODAL LIGHTBOX SCRIPT (js/app.js)
 * ==============================================================================
 * Clean project details modal gallery script.
 * Displays ONLY the clean app screenshot image tag (<img>) without applying
 * any background frame image (hero.jpg) or mock desktop container behind it.
 * ==============================================================================
 */

import { projectsData } from './projects-data.js';

class ProjectModalGallery {
  constructor() {
    this.projects = window.RL_PROJECTS_DATA || projectsData || [];
    this.modal = null;
    this.currentProject = null;
    this.currentIndex = 0;
    this.activeScreenshots = [];
    
    // Bind methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
    this.renderSlide = this.renderSlide.bind(this);
    this.renderThumbnails = this.renderThumbnails.bind(this);

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.modal = document.getElementById('carouselModal');
    if (!this.modal) return;

    // Cache elements
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

    // Event listeners
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

    // Attach card click handlers
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

    // Load active screenshots: ONLY the clean project screenshots, NO background frame or fallback hero.jpg!
    if (Array.isArray(project.screenshots) && project.screenshots.length > 0) {
      this.activeScreenshots = project.screenshots;
    } else if (project.image) {
      this.activeScreenshots = [project.image];
    } else {
      this.activeScreenshots = [];
    }

    // Populate header details
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

    // Tech stack
    if (this.techEl) {
      this.techEl.innerHTML = (project.techStack || []).map((t) => `
        <span class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
          ${t}
        </span>
      `).join('');
    }

    // Render clean screenshot slide and thumbnail bar
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

  /**
   * Directly displays ONLY the clean app screenshot image tag (<img>)
   * without applying any background frame image or mock desktop container behind it.
   */
  renderSlide() {
    if (!this.mediaContainer || !this.activeScreenshots.length) return;

    const currentSrc = this.activeScreenshots[this.currentIndex];
    const screenName = currentSrc.split('/').pop().replace('.jpg', '').replace('.png', '');
    const encodedSrc = encodeURI(currentSrc);

    // Clean slide without any background frame or desktop template
    this.mediaContainer.innerHTML = `
      <div class="clean-screenshot-wrapper w-full h-full flex items-center justify-center p-2">
        <img
          src="${encodedSrc}"
          alt="${screenName}"
          class="clean-screenshot-img max-h-[62vh] max-w-full h-auto w-auto object-contain mx-auto rounded-lg shadow-xl block"
          loading="eager"
          onerror="if(!this.dataset.retried){this.dataset.retried='1'; this.src='/' + '${encodedSrc}'.replace(/^\\//,'');}"
        />
      </div>
    `;

    if (this.captionEl) this.captionEl.textContent = screenName;
    if (this.counterEl) this.counterEl.textContent = `${this.currentIndex + 1} / ${this.activeScreenshots.length}`;

    // Highlight active thumbnail and scroll into view
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
      if (this.activeScreenshots.length === 1) {
        this.thumbsContainer.innerHTML = `
          <div class="thumb-item active" data-index="0">
            <img src="${encodeURI(this.activeScreenshots[0])}" alt="Screenshot Thumbnail" loading="eager" />
          </div>
        `;
      } else {
        this.thumbsContainer.innerHTML = '';
      }
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

// Instantiate and expose globally
export const galleryInstance = new ProjectModalGallery();
if (typeof window !== 'undefined') {
  window.RL_GALLERY = galleryInstance;
}
