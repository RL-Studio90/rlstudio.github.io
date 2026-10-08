import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Server,
  MapPin,
  Shield,
  Zap,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  Globe,
  Mail,
  Clock,
  Code,
  Download,
  Copy,
  Check,
  ChevronRight,
  Moon,
  Sun,
  Menu,
  X,
  Database,
  Calculator,
  Compass,
  FileText,
  LogIn,
  User,
  LogOut,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import {
  submitContactForm,
  getSupabaseConfig,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPasswordForEmail,
  updateUser,
  signOutUser,
  getSession,
  onAuthStateChange,
  supabase
} from '../js/supabase.js';
import { projectsData } from '../js/projects-data.js';

// Types
type PageRoute = 'home' | 'about' | 'portfolio' | 'contact' | 'privacy' | 'terms' | 'deployment-guide';

export interface ProjectItem {
  id: string;
  title: string;
  tagline?: string;
  category: string;
  app_category?: string;
  description?: string;
  status: string;
  shortDescription: string;
  fullDescription: string;
  techStack: string[];
  image: string;
  downloadUrl?: string;
  featured: boolean;
}

// Resilient Image Card with gradient UI fallback if image fails to load
function ProjectImageCard({
  image,
  title,
  category,
  className
}: {
  image: string;
  title: string;
  category: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const initials = title
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();

  if (hasError || !image) {
    return (
      <div className={`w-full h-full bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-6 text-center select-none ${className || ''}`}>
        <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-xl font-display mb-2 shadow-inner">
          {initials}
        </div>
        <div className="text-white font-bold font-display text-base tracking-wide">{title}</div>
        <div className="text-[11px] text-blue-300/80 font-mono mt-0.5">{category}</div>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={title}
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${className || ''}`}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [supabaseConfigModalOpen, setSupabaseConfigModalOpen] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Splash Screen State
  const [splashVisible, setSplashVisible] = useState<boolean>(true);

  // Supabase Authentication Modal State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // New Password Recovery Modal State (PASSWORD_RECOVERY event)
  const [newPasswordModalOpen, setNewPasswordModalOpen] = useState<boolean>(false);
  const [newPasswordValue, setNewPasswordValue] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [newPasswordLoading, setNewPasswordLoading] = useState<boolean>(false);
  const [newPasswordFeedback, setNewPasswordFeedback] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Live Time Zone Clock & Weather State (Doha, Qatar)
  const [dohaTime, setDohaTime] = useState<string>('--:--:--');
  const [dohaWeather, setDohaWeather] = useState<{ temp: number; icon: string; desc: string }>({
    temp: 32,
    icon: '☀️',
    desc: 'Clear'
  });

  // Quote Calculator State
  const [quotePlatforms, setQuotePlatforms] = useState<string[]>(['iOS', 'Android']);
  const [quoteFeatures, setQuoteFeatures] = useState<string[]>([
    'Supabase Database & Auth',
    'Interactive Maps & Geolocation'
  ]);
  const [quoteUrgency, setQuoteUrgency] = useState<string>('standard');
  const [quoteContactName, setQuoteContactName] = useState<string>('');
  const [quoteContactEmail, setQuoteContactEmail] = useState<string>('');
  const [quoteSubmitting, setQuoteSubmitting] = useState<boolean>(false);
  const [quoteStatusMessage, setQuoteStatusMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactProjectType, setContactProjectType] = useState<string>('Flutter Mobile App (iOS & Android)');
  const [contactSubject, setContactSubject] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSubmitting, setContactSubmitting] = useState<boolean>(false);
  const [contactStatus, setContactStatus] = useState<{ success: boolean; text: string } | null>(null);

  // Dynamic Supabase Config State (for live testing in browser)
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState<string>('');
  const [customSupabaseKey, setCustomSupabaseKey] = useState<string>('');
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // Portfolio filter state
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'live' | 'dev'>('all');

  // Initialize theme and hash navigation
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Sync from URL hash
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageRoute;
      if (['home', 'about', 'portfolio', 'contact', 'privacy', 'terms', 'deployment-guide'].includes(hash)) {
        setCurrentPage(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    // Load saved Supabase keys if any
    const savedUrl = localStorage.getItem('rl_supabase_url');
    const savedKey = localStorage.getItem('rl_supabase_key');
    if (savedUrl) setCustomSupabaseUrl(savedUrl);
    if (savedKey) setCustomSupabaseKey(savedKey);

    // Auto-dismiss splash screen & check mandatory auth gate
    const splashTimer = setTimeout(() => {
      setSplashVisible(false);
      getSession().then((session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          setAuthModalOpen(false);
        } else {
          setCurrentUser(null);
          setAuthModalOpen(true);
        }
      }).catch(() => {
        setAuthModalOpen(true);
      });
    }, 600);

    // Initial Supabase session check
    getSession().then((session) => {
      if (session?.user) setCurrentUser(session.user);
    }).catch(() => {});

    // Subscribe to auth state updates
    const sub = onAuthStateChange((event: any, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Open the "Set New Password" modal automatically
        setNewPasswordModalOpen(true);
        setAuthModalOpen(false);
        return;
      }

      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        setAuthModalOpen(false);
      }
    });

    // Check if URL hash or search params indicate password recovery mode or access_token upon initial load
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
          setNewPasswordModalOpen(true);
          setAuthModalOpen(false);
        }
      };

      setTimeout(checkRecoveryUrl, 100);
      setTimeout(checkRecoveryUrl, 600);
      window.addEventListener('hashchange', checkRecoveryUrl);
    }

    // 1. Live Time Zone Clock (Doha, Qatar AST / UTC+3)
    const updateTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Qatar',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        setDohaTime(formatter.format(new Date()));
      } catch {
        setDohaTime(new Date().toLocaleTimeString('en-US'));
      }
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    // 2. Dynamic Weather Widget (Open-Meteo API)
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.2854&longitude=51.5310&current_weather=true');
        if (res.ok) {
          const data = await res.json();
          if (data?.current_weather) {
            const w = data.current_weather;
            let icon = w.is_day ? '☀️' : '🌙';
            let desc = 'Clear';
            if (w.weathercode === 1 || w.weathercode === 2) { icon = '🌤️'; desc = 'Partly Cloudy'; }
            else if (w.weathercode === 3) { icon = '☁️'; desc = 'Overcast'; }
            else if (w.weathercode >= 51 && w.weathercode <= 67) { icon = '🌧️'; desc = 'Rain'; }
            else if (w.weathercode >= 95) { icon = '⛈️'; desc = 'Thunderstorm'; }
            setDohaWeather({
              temp: Math.round(w.temperature),
              icon,
              desc
            });
          }
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      }
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('hashchange', handleHashChange);
      if (sub?.unsubscribe) sub.unsubscribe();
      clearInterval(clockInterval);
      clearInterval(weatherInterval);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setAuthFeedback({ type: 'info', text: 'Redirecting to Google OAuth...' });
      await signInWithGoogle();
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: err.message || 'Google Sign-In failed.' });
    }
  };

  const handleForgotPassword = async () => {
    if (!authEmail) {
      setAuthFeedback({ type: 'info', text: 'Please enter your email above to receive a password reset link.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) {
      setAuthFeedback({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    try {
      setAuthLoading(true);
      setAuthFeedback({ type: 'info', text: 'Sending password reset email...' });
      await resetPasswordForEmail(authEmail, {
        redirectTo: 'https://rl-studio90.github.io/rlstudio.github.io/'
      });
      setAuthFeedback({ type: 'success', text: `Password reset link sent to ${authEmail}! Please check your inbox.` });
    } catch (err: any) {
      console.error('[Reset Password Error]', err);
      console.log(err?.message || err);
      const actualError = err?.message || 'Failed to send password reset email.';
      setAuthFeedback({ type: 'error', text: actualError });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthFeedback({ type: 'error', text: 'Please fill in both email and password.' });
      return;
    }
    if (authPassword.length < 6) {
      setAuthFeedback({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setAuthLoading(true);
    setAuthFeedback({ type: 'info', text: 'Connecting to Supabase...' });

    try {
      if (authMode === 'signup') {
        const res = await signUpWithEmail(authEmail, authPassword);
        if (res?.user && !res.session) {
          setAuthFeedback({ type: 'success', text: 'Account created! Please check your email for confirmation.' });
        } else {
          setAuthFeedback({ type: 'success', text: 'Account registered and signed in!' });
          setTimeout(() => setAuthModalOpen(false), 1200);
        }
      } else {
        await signInWithEmail(authEmail, authPassword);
        setAuthFeedback({ type: 'success', text: 'Signed in successfully!' });
        setTimeout(() => setAuthModalOpen(false), 1000);
      }
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: err.message || 'Authentication error.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setAuthFeedback({ type: 'info', text: 'Signed out successfully. Authentication required to access studio.' });
      setAuthModalOpen(true);
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: err.message || 'Error signing out.' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValue || newPasswordValue.length < 6) {
      setNewPasswordFeedback({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setNewPasswordLoading(true);
      setNewPasswordFeedback({ type: 'info', text: 'Updating password in Supabase...' });
      const { data, error } = await supabase.auth.updateUser({ password: newPasswordValue });

      if (error) {
        console.error('[Update Password Error]', error);
        console.log(error.message);
        setNewPasswordFeedback({ type: 'error', text: error.message || 'Failed to update password.' });
        return;
      }

      setNewPasswordFeedback({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => {
        setNewPasswordModalOpen(false);
        setNewPasswordValue('');
        setNewPasswordFeedback(null);
        // Direct the user into logged-in portal
        if (data?.user) {
          setCurrentUser(data.user);
        }
      }, 1200);
    } catch (err: any) {
      console.error('[Update Password Exception]', err);
      console.log(err?.message || err);
      setNewPasswordFeedback({ type: 'error', text: err.message || 'Error updating password.' });
    } finally {
      setNewPasswordLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navigateTo = (page: PageRoute) => {
    setCurrentPage(page);
    window.location.hash = page;
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Master projects loaded dynamically from Supabase 'projects' table (with projectsData fallback)
  const [projects, setProjects] = useState<ProjectItem[]>(projectsData);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSupabaseProjects() {
      try {
        setProjectsLoading(true);
        const { data: projectsRows, error } = await supabase.from('projects').select('*');

        if (error) {
          console.warn("Supabase projects table fetch failed:", error);
          setProjectsError(error.message);
          return;
        }

        if (projectsRows && projectsRows.length > 0) {
          const mapped: ProjectItem[] = projectsRows.map((row: any) => {
            const localMatch = projectsData.find(
              (p) =>
                (p.title && row.title && p.title.toLowerCase().trim() === row.title.toLowerCase().trim()) ||
                String(p.id) === String(row.id)
            );

            const categoryRaw = row.app_category || localMatch?.category || 'Flutter / Mobile';
            const techList = categoryRaw.split(/[\/,·|-]/).map((s: string) => s.trim()).filter(Boolean);
            if (localMatch?.techStack) {
              localMatch.techStack.forEach((t) => {
                if (!techList.includes(t)) techList.push(t);
              });
            }

            return {
              id: String(row.id || localMatch?.id || (row.title ? row.title.toLowerCase().replace(/\s+/g, '-') : 'app')),
              title: row.title || localMatch?.title || 'Studio App',
              tagline: row.tagline || localMatch?.tagline || '',
              description: row.description || localMatch?.fullDescription || localMatch?.shortDescription || '',
              app_category: row.app_category || localMatch?.category || 'Flutter / Mobile',
              category: row.app_category || localMatch?.category || 'Mobile App',
              status: row.status || localMatch?.status || 'Live',
              shortDescription: row.description || localMatch?.shortDescription || row.tagline || '',
              fullDescription: row.description || localMatch?.fullDescription || '',
              techStack: techList.length > 0 ? techList : ['Flutter', 'Android'],
              image: (Array.isArray(row.screenshots) && row.screenshots[0]) || localMatch?.image || 'images/Cod Finder Main Screen.jpg',
              downloadUrl: row.download_url || localMatch?.downloadUrl || 'https://wa.me/97430854376',
              featured: row.featured !== undefined ? Boolean(row.featured) : (localMatch?.featured ?? true)
            };
          });

          setProjects(mapped);
          setProjectsError(null);
        }
      } catch (err: any) {
        console.error("Exception fetching projects from Supabase in React:", err);
        setProjectsError(err.message || 'Failed to fetch projects');
      } finally {
        setProjectsLoading(false);
      }
    }

    fetchSupabaseProjects();
  }, []);

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (portfolioFilter === 'all') return true;
    if (portfolioFilter === 'live') return p.status === 'Live';
    if (portfolioFilter === 'dev') return p.status === 'In Development' || p.status === 'Beta Testing';
    return true;
  });

  const featuredProjects = projects.filter((p) => p.featured);
  const radarProjects = projects.filter((p) => !p.featured);

  // Handle Contact Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactStatus(null);

    const res = await submitContactForm({
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      project_type: contactProjectType,
      subject: contactSubject,
      message: contactMessage
    });

    setContactSubmitting(false);
    setContactStatus({
      success: res.success,
      text: res.message
    });

    if (res.success) {
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
    }
  };

  // Handle Quote Calculator Submit
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteContactName || !quoteContactEmail) {
      setQuoteStatusMessage({ success: false, text: 'Please provide your name and email to receive the estimate.' });
      return;
    }

    setQuoteSubmitting(true);
    setQuoteStatusMessage(null);

    const calculatedTier = quoteFeatures.length > 3 ? '$12,000 - $22,000' : '$6,000 - $12,000';
    const calculatedWeeks = quoteUrgency === 'fast-track' ? '3 - 4 weeks (Fast-Track)' : '6 - 8 weeks';

    const res = await submitContactForm({
      name: quoteContactName,
      email: quoteContactEmail,
      subject: `Project Quote Request: ${quotePlatforms.join(', ')} App`,
      message: `Platforms: ${quotePlatforms.join(', ')} | Features: ${quoteFeatures.join(', ')} | Timeline Preference: ${calculatedWeeks} | Estimated Range: ${calculatedTier}`,
      project_type: `Flutter App (${quotePlatforms.join('+')})`,
      budget_range: calculatedTier
    });

    setQuoteSubmitting(false);
    setQuoteStatusMessage({
      success: res.success,
      text: res.success
        ? `Quote request logged! Estimated investment: ${calculatedTier} (${calculatedWeeks}). Our lead architect will email you within 12 hours.`
        : res.message
    });
  };

  // Save custom Supabase credentials
  const saveCustomSupabase = () => {
    if (customSupabaseUrl && customSupabaseKey) {
      localStorage.setItem('rl_supabase_url', customSupabaseUrl.trim());
      localStorage.setItem('rl_supabase_key', customSupabaseKey.trim());
      setConfigSaved(true);
      setTimeout(() => {
        setConfigSaved(false);
        setSupabaseConfigModalOpen(false);
      }, 1500);
    }
  };

  const resetSupabaseConfig = () => {
    localStorage.removeItem('rl_supabase_url');
    localStorage.removeItem('rl_supabase_key');
    setCustomSupabaseUrl('');
    setCustomSupabaseKey('');
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setSupabaseConfigModalOpen(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* ====================================================================
          0. SLEEK DARK-THEMED SPLASH SCREEN / PRELOADER
          ==================================================================== */}
      {splashVisible && (
        <div id="rlSplashScreen" aria-label="Loading R & L Studio">
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <div className="relative mb-6">
              <img
                src="/images/logo.svg"
                alt="R & L Studio Logo"
                className="w-20 h-20 rounded-2xl shadow-2xl border-2 border-blue-500/40 splash-logo-glow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/logo.png';
                }}
              />
              <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 blur-xl -z-10 animate-pulse"></div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white mb-1.5">
              R &amp; L Studio
            </div>
            <div className="text-xs font-mono text-blue-400 mb-6 tracking-wide">
              Android Mobile Developer · Doha, Qatar
            </div>
            <div className="splash-spinner mb-4" role="status" aria-label="Loading"></div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
              Loading Systems...
            </span>
          </div>
        </div>
      )}

      {/* ====================================================================
          TOP BAR CONTRACT: [Brand Wordmark] - [4-6 Nav Links] - [Primary Actions]
          ==================================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        {/* Location-Based Live Clock & Weather Top Bar */}
        <div className="header-top-bar border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            {/* Left: Location + Live Doha Clock + Weather */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-slate-700 dark:text-slate-300">
              {/* Location Badge */}
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span className="text-sm leading-none" role="img" aria-label="Qatar Flag">🇶🇦</span>
                <span>Doha, Qatar</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="HQ Studio Live"></span>
              </span>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

              {/* Real-Time Time Zone Clock (AST / UTC+3) */}
              <div className="doha-badge" title="Doha, Qatar Time (AST / UTC+3)">
                <svg className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="doha-clock-time font-bold tracking-tight">{dohaTime}</span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">AST</span>
              </div>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

              {/* Dynamic Weather Widget (Open-Meteo) */}
              <div id="dohaWeatherWidget" className="doha-badge" title={`Live Weather in Doha, Qatar: ${dohaWeather.temp}°C, ${dohaWeather.desc}`}>
                <span className="doha-weather-icon text-sm leading-none">{dohaWeather.icon}</span>
                <span className="doha-weather-temp font-bold">{dohaWeather.temp}°C</span>
                <span className="doha-weather-desc text-[10px] text-slate-600 dark:text-slate-400 hidden xs:inline">{dohaWeather.desc}</span>
              </div>
            </div>

            {/* Right: Quick Contact & Operating Status */}
            <div className="hidden md:flex items-center gap-4 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Engineering Ops Online</span>
              </span>
              <a href="mailto:rlstudiox90@gmail.com" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">rlstudiox90@gmail.com</a>
              <a href="tel:+97430854376" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">+974 3085 4376</a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Zone 1: Single text element Brand Wordmark */}
          <button
            onClick={() => navigateTo('home')}
            className="text-2xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer text-left"
          >
            R &amp; L Studio
          </button>

          {/* Zone 2: Navigation Links (Clean text with hover states) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer ${
                currentPage === 'home' ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigateTo('about')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer ${
                currentPage === 'about' ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              About
            </button>
            <button
              onClick={() => navigateTo('portfolio')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer ${
                currentPage === 'portfolio' ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer ${
                currentPage === 'contact' ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => navigateTo('deployment-guide')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-xs font-mono uppercase tracking-wider ${
                currentPage === 'deployment-guide' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
              }`}
            >
              Deploy &amp; Code
            </button>
          </nav>

          {/* Zone 3: Primary Actions (Sign In, Theme Toggle, Supabase Settings, Quote Button) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sign In Button */}
            <button
              onClick={() => {
                setAuthFeedback(null);
                setAuthModalOpen(true);
              }}
              title="Studio Authentication"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {currentUser ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="truncate max-w-[100px] sm:max-w-[130px]">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Studio User'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Supabase Config button */}
            <button
              onClick={() => setSupabaseConfigModalOpen(true)}
              title="Configure Supabase Database Keys"
              aria-label="Supabase settings"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="hidden lg:inline text-xs font-mono">DB Config</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Get a Quote</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-6 space-y-4">
            {/* Mobile Live Doha Clock & Weather Summary */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🇶🇦</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Doha, Qatar</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">AST (UTC+3)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="doha-badge">
                  <span className="doha-clock-time font-bold">{dohaTime}</span>
                </div>
                <div className="doha-badge">
                  <span className="doha-weather-icon">{dohaWeather.icon}</span>
                  <span className="doha-weather-temp font-bold">{dohaWeather.temp}°C</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateTo('home')}
              className="block w-full text-left font-semibold text-base py-2 text-slate-700 dark:text-slate-200"
            >
              Home
            </button>
            <button
              onClick={() => navigateTo('about')}
              className="block w-full text-left font-semibold text-base py-2 text-slate-700 dark:text-slate-200"
            >
              About Us
            </button>
            <button
              onClick={() => navigateTo('portfolio')}
              className="block w-full text-left font-semibold text-base py-2 text-slate-700 dark:text-slate-200"
            >
              Portfolio Hub
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className="block w-full text-left font-semibold text-base py-2 text-slate-700 dark:text-slate-200"
            >
              Contact &amp; Map
            </button>
            <button
              onClick={() => navigateTo('deployment-guide')}
              className="block w-full text-left font-semibold text-base py-2 text-blue-600 dark:text-blue-400"
            >
              Hosting &amp; Code Exporter
            </button>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthFeedback(null);
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{currentUser ? currentUser.email : 'Sign In / Studio Account'}</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setQuoteModalOpen(true);
                }}
                className="w-full py-3 text-center text-sm font-bold text-white bg-blue-600 rounded-lg shadow"
              >
                Instant Project Quote
              </button>
              <div className="flex justify-around text-xs text-slate-500 pt-2">
                <button onClick={() => navigateTo('privacy')} className="underline">
                  Privacy
                </button>
                <button onClick={() => navigateTo('terms')} className="underline">
                  Terms
                </button>
                <a href="about.html" className="text-blue-600">
                  Static Files &rarr;
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Router */}
      <main className="flex-1">
        {/* ====================================================================
            PAGE: HOME
        ==================================================================== */}
        {currentPage === 'home' && (
          <div>
            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-blue-50/60 via-white to-transparent dark:from-slate-900/50 dark:via-slate-950 dark:to-transparent">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Column: Value Proposition & CTAs */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Animated availability indicator (Zero-pill compliant) */}
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>Available for New Projects</span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="text-blue-600 dark:text-blue-400">Doha, Qatar &amp; Global Remote</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white leading-[1.1] text-balance">
                      Cross-Platform Mobile Apps Engineered with <span className="text-blue-600 dark:text-blue-400">Flutter</span> &amp; <span className="text-emerald-600 dark:text-emerald-400">Supabase</span>
                    </h1>

                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                      We craft resilient, 60fps applications for iOS, Android, and Web. From hyper-localized Qatar logistics and ATM locators to global consumer marketplaces, we transform complex systems into effortless digital experiences.
                    </p>

                    {/* CTAs */}
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <button
                        onClick={() => navigateTo('portfolio')}
                        className="px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <span>Explore Flagship Apps</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigateTo('contact')}
                        className="px-6 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Request Consultation
                      </button>
                    </div>

                    {/* Proof adjacent to claims */}
                    <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-display tabular-nums">
                          60 FPS
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Native Execution</div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display tabular-nums">
                          99.9%
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supabase Uptime</div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-display tabular-nums">
                          1 Codebase
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">iOS, Android, Web</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Hero Visual Asset */}
                  <div className="lg:col-span-5">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 group">
                      <img
                        src="/images/hero.jpg"
                        alt="R & L Studio Engineering Headquarters in Doha"
                        className="w-full h-auto object-cover aspect-[4/3] group-hover:scale-102 transition-transform duration-700"
                        loading="eager"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6">
                        <div className="flex items-center gap-2 text-xs text-blue-300 font-mono mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>West Bay, Doha · State of Qatar</span>
                        </div>
                        <h2 className="text-lg font-bold text-white font-display">R &amp; L Studio Architecture Lab</h2>
                        <div className="text-xs text-slate-300 mt-0.5">Specialized Cross-Platform Mobile &amp; Cloud Systems</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* AD BANNER PLACEMENT 1 (Responsive & Compliant) */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 my-10" aria-label="Advertisement Banner">
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center adsense-container bg-slate-100/50 dark:bg-slate-900/50">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
                  Advertisement
                </div>
                <div className="flex items-center justify-center min-h-[90px] text-xs text-slate-500 dark:text-slate-400">
                  <span>Google AdSense Slot 1 (Responsive Leaderboard 728x90 / Mobile 320x100)</span>
                </div>
              </div>
            </section>

            {/* CORE EXPERTISE (Numbered Editorial Services) */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mb-14">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Technical Architecture
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white mb-4">
                  Engineering Foundations That Scale Effortlessly
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                  We reject fragile hybrid web wrappers. Our stack compiles directly to native hardware machine code, supported by enterprise cloud backends.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 01. Flutter */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-4">
                      01. CROSS-PLATFORM
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      Flutter &amp; Dart Mobile Architecture
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      Single source of truth delivering pixel-perfect, native-compiled applications for iOS and Android. Type-safe Dart logic ensures zero unexpected null-pointer crashes in production.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>60 FPS Impeller Graphics Engine</span>
                  </div>
                </div>

                {/* 02. Local Qatar Solutions */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                      02. LOCALIZED INTELLIGENCE
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      Qatar &amp; Gulf Specialized Systems
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      Deep domain knowledge of Qatar infrastructure: cash-on-delivery deposit kiosks (COD), iPay terminals, bank integrations, and Arabic RTL typographic layouts.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Doha GPS &amp; Offline Vector Maps</span>
                  </div>
                </div>

                {/* 03. Supabase */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                      03. CLOUD BACKEND
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                      <Server className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      Supabase PostgreSQL &amp; Realtime
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      Rock-solid database architecture with Row Level Security (RLS), instant WebSocket state synchronization, edge functions, and GDPR/Qatar PDPPL compliant data encryption.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-500" />
                    <span>PostgreSQL with Row Level Security</span>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURED SHOWCASE (Flagship Applications) */}
            <section className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                  <div>
                    <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      Proven Impact
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white">
                      Flagship Deployments in Qatar
                    </h2>
                  </div>
                  <button
                    onClick={() => navigateTo('portfolio')}
                    className="mt-4 md:mt-0 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View all 5 studio projects</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {featuredProjects.map((proj) => (
                    <article
                      key={proj.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                    >
                      <div className="relative h-64 bg-slate-950 overflow-hidden">
                        <ProjectImageCard
                          image={proj.image}
                          title={proj.title}
                          category={proj.category}
                        />
                        <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded">
                          {proj.status}
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{proj.app_category || proj.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{proj.techStack.slice(0, 2).join(' + ')}</span>
                          </div>
                          <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-1">
                            {proj.title}
                          </h3>
                          {proj.tagline && (
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">
                              {proj.tagline}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                            {proj.description || proj.shortDescription}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {proj.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-mono">Status: {proj.status}</span>
                          <button
                            onClick={() => setSelectedProject(proj)}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Technical Case Study &rarr;
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* IN-DEVELOPMENT RADAR */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mb-12">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Active Sprint Radar
                </div>
                <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-3">
                  Products Currently in Architecture &amp; Beta
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Our pipeline of upcoming utilities and venture-backed mobile architectures scheduled for release in 2026/2027.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {radarProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-40 bg-slate-950 rounded-lg overflow-hidden mb-4">
                        <ProjectImageCard
                          image={proj.image}
                          title={proj.title}
                          category={proj.category}
                        />
                        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white font-mono">
                          {proj.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-500 dark:text-slate-400">{proj.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{proj.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {proj.shortDescription}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">{proj.techStack[0]}</span>
                      <button
                        onClick={() => setSelectedProject(proj)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        View Specs &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="py-16 bg-blue-600 text-white">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
                  Have a Mobile Application Idea for Qatar or Global Markets?
                </h2>
                <p className="text-blue-100 text-base max-w-2xl mx-auto leading-relaxed">
                  We engineer high-performance Flutter prototypes and scalable Supabase backends. Let’s evaluate your technical scope and deliver an architecture roadmap.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => setQuoteModalOpen(true)}
                    className="px-6 py-3.5 text-sm font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-lg shadow-lg transition-all cursor-pointer"
                  >
                    Calculate Project Estimate
                  </button>
                  <button
                    onClick={() => navigateTo('contact')}
                    className="px-6 py-3.5 text-sm font-bold text-white bg-blue-800 hover:bg-blue-900 border border-blue-400/40 rounded-lg transition-all cursor-pointer"
                  >
                    Contact Engineering Team
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ====================================================================
            PAGE: ABOUT US
        ==================================================================== */}
        {currentPage === 'about' && (
          <div className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="max-w-3xl mb-16">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Heritage &amp; Direction
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white mb-4">
                  Crafting Resilient Cross-Platform Software in Doha, Qatar
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  R &amp; L Studio was established to overcome the fragmentation of mobile engineering. We combine Google Flutter’s declarative UI framework with Supabase’s PostgreSQL engine to build software that operates reliably in real-world conditions.
                </p>
              </div>

              {/* Founder Profile */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
                <div className="lg:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 flex flex-col items-center justify-center group">
                    <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center">
                      <img
                        src="/images/founder-avatar.svg"
                        alt="R & L Studio Lead Engineer Vector Avatar"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/logo.svg';
                        }}
                      />
                    </div>
                    <div className="w-full pt-4 mt-2 border-t border-blue-400/20 flex flex-col items-center text-center">
                      <div className="text-base font-bold text-white font-display">Lead Systems Architect</div>
                      <div className="text-xs text-blue-300 font-mono mt-0.5">Android Mobile Developer (VS Studio - Android Studio) · Doha, Qatar</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400">
                    Engineering Manifesto
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
                    Why We Chose Flutter and Supabase as Our Sovereign Stack
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Building separate iOS and Android codebases doubles engineering costs and introduces inconsistent bug profiles. Flutter’s Skia/Impeller renderer compiles directly to ARM machine code, giving users fluid 60fps animations across all form factors.
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Paired with Supabase, we obtain PostgreSQL’s ACID transactional guarantees, built-in vector search for AI semantics, and granular Row Level Security (RLS). This combination allows our boutique studio in Doha to deploy enterprise systems faster than teams ten times our size.
                  </p>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <strong>Location:</strong> West Bay, Doha, Qatar
                    </div>
                    <div>
                      <strong>Focus:</strong> Mobile Apps, Geospatial, Fintech
                    </div>
                    <div>
                      <strong>Email:</strong> rlstudiox90@gmail.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolchain Badges */}
              <div className="mb-20">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Our Toolchain
                </div>
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-6">
                  Technologies We Master &amp; Maintain
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { name: 'Flutter', role: 'Multiplatform UI' },
                    { name: 'Dart', role: 'Strict Type-Safety' },
                    { name: 'Supabase', role: 'Postgres & Auth' },
                    { name: 'Firebase', role: 'Push Notifications' },
                    { name: 'REST & WS', role: 'Realtime Protocol' },
                    { name: 'Git & CI/CD', role: 'Automated Fastlane' }
                  ].map((tech) => (
                    <div
                      key={tech.name}
                      className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center"
                    >
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{tech.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tech.role}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Link to Standalone HTML */}
              <div className="p-6 bg-blue-50 dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Standalone Static HTML Version</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Deploying to Netlify without Node runtime? View the standalone <code className="font-mono">about.html</code> page.
                  </div>
                </div>
                <a
                  href="about.html"
                  className="px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-300 dark:border-slate-700 rounded-lg shadow-sm hover:underline whitespace-nowrap"
                >
                  Open about.html &rarr;
                </a>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================
            PAGE: PORTFOLIO
        ==================================================================== */}
        {currentPage === 'portfolio' && (
          <div className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="max-w-3xl mb-12">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Showcase &amp; Radar
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white mb-4">
                  Mobile Portfolio &amp; Active Deployments
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Browse production applications engineered for clients in Qatar and global users. Filter between live deployments and active architecture sprints.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl w-fit mb-12 border border-slate-300 dark:border-slate-700">
                <button
                  onClick={() => setPortfolioFilter('all')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    portfolioFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Projects ({projects.length})
                </button>
                <button
                  onClick={() => setPortfolioFilter('live')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    portfolioFilter === 'live'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Live Apps (2)
                </button>
                <button
                  onClick={() => setPortfolioFilter('dev')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    portfolioFilter === 'dev'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  In Development (3)
                </button>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((p) => (
                  <article
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-52 bg-slate-950 overflow-hidden">
                        <ProjectImageCard
                          image={p.image}
                          title={p.title}
                          category={p.category}
                        />
                        <div
                          className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded text-white ${
                            p.status === 'Live' ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                        >
                          {p.status}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{p.app_category || p.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-blue-600 dark:text-blue-400">{p.techStack[0] || 'Flutter'}</span>
                        </div>
                        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">
                          {p.title}
                        </h2>
                        {p.tagline && (
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                            {p.tagline}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                          {p.description || p.shortDescription}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {p.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">{p.techStack[0]} + {p.techStack[2] || 'Supabase'}</span>
                      <button
                        onClick={() => setSelectedProject(p)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Deep Dive &rarr;
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Standalone HTML Notice */}
              <div className="mt-16 p-6 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Prefer plain HTML5 without React? Every portfolio card is also available in <code className="font-mono text-blue-600">portfolio.html</code>.
                </div>
                <a
                  href="portfolio.html"
                  className="px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:underline whitespace-nowrap"
                >
                  Open portfolio.html &rarr;
                </a>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================
            PAGE: CONTACT & MAP
        ==================================================================== */}
        {currentPage === 'contact' && (
          <div className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="max-w-3xl mb-14">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Direct Outreach
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white mb-4">
                  Connect With Our Engineering Studio
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Discuss an upcoming mobile app, request technical consulting, or inquire about COD Finder and iPay Finder licensing. Inquiries are stored directly in our Supabase PostgreSQL instance.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Form Column */}
                <div className="lg:col-span-7">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                          Project Brief &amp; Inquiry
                        </h2>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Direct pipeline to R &amp; L Studio engineers
                        </div>
                      </div>
                      <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Supabase RLS Active
                      </div>
                    </div>

                    {/* Status Alert */}
                    {contactStatus && (
                      <div
                        className={`mb-6 p-4 rounded-xl text-sm ${
                          contactStatus.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                            : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                        }`}
                      >
                        <strong>{contactStatus.success ? 'Success!' : 'Submission Notice:'}</strong> {contactStatus.text}
                      </div>
                    )}

                    <form onSubmit={handleContactSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                            Your Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="e.g. Khalid Al-Thani"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="khalid@enterprise.qa"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                            Phone / WhatsApp (Optional)
                          </label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+974 XX XXX XXX"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                            Service Requirement
                          </label>
                          <select
                            value={contactProjectType}
                            onChange={(e) => setContactProjectType(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                          >
                            <option value="Flutter Mobile App (iOS & Android)">Flutter Mobile App (iOS &amp; Android)</option>
                            <option value="Supabase Architecture & PostgreSQL">Supabase Architecture &amp; PostgreSQL</option>
                            <option value="Qatar Localized Solution (COD/iPay)">Qatar Localized Solution (COD/iPay)</option>
                            <option value="MVP Prototype Sprint">MVP Prototype Sprint</option>
                            <option value="App Audit & Performance Optimization">App Audit &amp; Performance</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Subject / Project Scope <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          placeholder="e.g. Courier navigation application for Qatar logistics"
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Message &amp; Objectives <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Outline your targets, desired timeline, target userbase in Qatar or globally, and any specific feature requirements..."
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition resize-y"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={contactSubmitting}
                        className="w-full py-3.5 px-6 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {contactSubmitting ? (
                          <span>Transmitting to Supabase...</span>
                        ) : (
                          <span>Submit Inquiry to Engineering Team</span>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Info & Map Column */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Studio Details */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                      Operations Hub
                    </h2>

                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Direct Email</div>
                          <a
                            href="mailto:rlstudiox90@gmail.com"
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                          >
                            rlstudiox90@gmail.com
                          </a>
                          <div className="text-xs text-slate-500 mt-0.5">Checked continuously Sun - Thu</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Studio Location</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            West Bay Financial District
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">Doha, State of Qatar</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Office Hours</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            Sunday – Thursday: 08:30 – 18:00 AST
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">Arabia Standard Time (GMT+3)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Map Embed */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-2 mb-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Doha, Qatar Location Map</span>
                      <span className="text-[11px] text-slate-400 font-mono">25.3217° N, 51.5292° E</span>
                    </div>
                    <div className="rounded-xl overflow-hidden h-64 border border-slate-200 dark:border-slate-700 relative">
                      <iframe
                        title="R & L Studio Location Map"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=51.4926%2C25.2891%2C51.5647%2C25.3524&amp;layer=mapnik&amp;marker=25.3217%2C51.5292"
                        className="w-full h-full border-0"
                        loading="lazy"
                      ></iframe>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            PAGE: PRIVACY POLICY
        ==================================================================== */}
        {currentPage === 'privacy' && (
          <div className="py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  AdSense &amp; PDPPL Compliance
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white mb-2">
                  Privacy Policy
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Last Updated: October 2026</span>
                  <span aria-hidden="true">·</span>
                  <span>Governing Law: Qatar Law No. 13 of 2016</span>
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">1. Overview</h2>
                  <p>
                    R &amp; L Studio ("we", "us", or "our") is committed to protecting your privacy in compliance with Qatar Law No. 13 of 2016 concerning the Protection of Personal Data Privacy (PDPPL) and global standards. This policy governs how we collect, store, and process data submitted through our website and apps.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">2. Information We Collect</h2>
                  <p>
                    We collect personal details (name, email, phone number, and project scopes) that you voluntarily submit through our contact and quote forms. Technical request data (such as IP address, browser type, and timestamps) is collected by our hosting infrastructure for security auditing.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">3. Supabase Cloud Storage &amp; Row Level Security</h2>
                  <p>
                    Inquiries are stored directly in a managed Supabase PostgreSQL database protected by strict Row Level Security (RLS) policies. Unauthorized public queries are blocked at the engine level. We never sell, lease, or monetize your contact records.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">4. Google AdSense &amp; Third-Party Cookies</h2>
                  <p>
                    We may display third-party advertisements via Google AdSense. Google and third-party vendors use cookies to serve ads based on your prior visits to this website and other sites across the Internet. You may opt out of personalized advertising by visiting Google Ads Settings (<a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-blue-600 underline">google.com/settings/ads</a>) or <a href="http://www.aboutads.info/choices" target="_blank" rel="noreferrer" className="text-blue-600 underline">aboutads.info/choices</a>.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">5. User Rights &amp; Erasure</h2>
                  <p>
                    You have the right to request access, rectification, or total deletion of any personal data stored in our Supabase instance. To exercise your rights, email our team at <a href="mailto:rlstudiox90@gmail.com" className="text-blue-600 underline font-semibold">rlstudiox90@gmail.com</a>.
                  </p>
                </section>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>R &amp; L Studio Legal Governance</span>
                <a href="privacy.html" className="text-blue-600 hover:underline">
                  View static privacy.html &rarr;
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            PAGE: TERMS & CONDITIONS
        ==================================================================== */}
        {currentPage === 'terms' && (
          <div className="py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Legal Agreement
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white mb-2">
                  Terms &amp; Conditions
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Last Updated: October 2026</span>
                  <span aria-hidden="true">·</span>
                  <span>Jurisdiction: Civil Courts of Doha, Qatar</span>
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
                  <p>
                    By using this website or our community applications (such as COD Finder and iPay Finder), you agree to be bound by these Terms &amp; Conditions and all applicable laws of the State of Qatar.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">2. Engineering Services &amp; SOW Agreements</h2>
                  <p>
                    All custom application development engagements (Flutter, Dart, Supabase) are governed by specific Statements of Work (SOW) executed between R &amp; L Studio and the client.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">3. Community Utilities Disclaimer</h2>
                  <p>
                    COD Finder and iPay Finder provide locator services for convenience. While coordinates and machine hours are maintained actively, R &amp; L Studio accepts no liability for third-party bank ATM hardware faults, terminal downtime, or operational discrepancies.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">4. Governing Law</h2>
                  <p>
                    These terms are governed by and construed under the laws of the State of Qatar. Any disputes shall be subject to the exclusive jurisdiction of the civil courts in Doha.
                  </p>
                </section>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>R &amp; L Studio Legal Contracts</span>
                <a href="terms.html" className="text-blue-600 hover:underline">
                  View static terms.html &rarr;
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            PAGE: DEPLOYMENT & CODE EXPORTER GUIDE
        ==================================================================== */}
        {currentPage === 'deployment-guide' && (
          <div className="py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="max-w-3xl mb-12">
                <div className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Netlify &amp; VS Code Guide
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white mb-3">
                  Step-by-Step Hosting, Supabase Setup &amp; AdSense Plan
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Everything required to take this complete multi-page platform from AI Studio into your local VS Code, connect your live Supabase database, and publish to Netlify for free.
                </p>
              </div>

              {/* Step 1 to 4 Cards */}
              <div className="space-y-8 mb-16">
                
                {/* Step 1 */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm font-mono">
                      1
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                      Local Setup (VS Code)
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    1. Create a local folder named <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-blue-600">rl-studio-website</code>.
                    <br />
                    2. Inside it, create the standalone pages generated in this project:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 mb-4">
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ index.html</span>
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ about.html</span>
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ portfolio.html</span>
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ contact.html</span>
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ privacy.html</span>
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ terms.html</span>
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ js/supabase.js</span>
                    <span className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">✓ schema.sql</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm font-mono">
                      2
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                      Supabase Database Setup
                    </h2>
                  </div>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>Log in to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Supabase.com</a> and click <strong>"New Project"</strong>.</li>
                    <li>Navigate to the <strong>SQL Editor</strong> tab on the left sidebar.</li>
                    <li>Copy and paste the code from <code className="font-mono text-xs text-blue-600">schema.sql</code> and click <strong>RUN</strong>. This creates the <code className="font-mono text-xs">contact_messages</code> table and sets up safe public Row Level Security (RLS) policies.</li>
                    <li>Go to <strong>Project Settings &rarr; API</strong>, copy your <strong>Project URL</strong> and <strong>anon public key</strong>, and paste them into <code className="font-mono text-xs">js/supabase.js</code> (or use the DB Config modal on this site to test instantly!).</li>
                  </ol>
                </div>

                {/* Step 3 */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm font-mono">
                      3
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                      Netlify Par Free Publish Karna (1-Minute Drag &amp; Drop)
                    </h2>
                  </div>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>Go to <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">app.netlify.com/drop</a>.</li>
                    <li>Drag and drop your <code className="font-mono text-xs">rl-studio-website</code> folder directly into the browser box.</li>
                    <li>Netlify will instantly deploy your site to a live URL like <code className="font-mono text-xs text-blue-600">https://randlstudio.netlify.app</code> with full SSL certificate and global CDN speed.</li>
                  </ol>
                </div>

                {/* Step 4 */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center text-sm font-mono">
                      4
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                      Google AdSense Approval Strategy
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    AdSense requires mandatory compliance pages: <strong>Privacy Policy</strong> (cookie &amp; advertising disclosures), <strong>Terms of Service</strong>, and <strong>Contact Page with physical location/email</strong>. All three are fully authored and included in this build!
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Recommended timeline:</strong> Keep the website live on Netlify for 1–2 weeks with regular project updates. Then submit your site URL to Google AdSense. Once approved, paste your client publisher ID into the header script and banner slots. When revenue begins, attach a custom domain (e.g., <code className="font-mono text-xs">randlstudio.qa</code> or <code className="font-mono text-xs">randlstudio.com</code>) via Netlify Domain Management.
                  </p>
                </div>

              </div>

              {/* Copyable schema.sql & js/supabase.js Code Viewer */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-400" />
                    <span className="font-bold font-mono text-sm">schema.sql (Copy for Supabase SQL Editor)</span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    project_type TEXT DEFAULT 'Flutter App',
    budget_range TEXT,
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous public inserts"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
    char_length(trim(name)) > 1 AND
    char_length(trim(email)) > 3 AND
    char_length(trim(subject)) > 1 AND
    char_length(trim(message)) > 4
);`,
                        'schema-sql'
                      )
                    }
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCodeId === 'schema-sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === 'schema-sql' ? 'Copied SQL!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
{`-- 1. Create table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    project_type TEXT DEFAULT 'Flutter App',
    budget_range TEXT,
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous public submissions from your website
CREATE POLICY "Allow anonymous public inserts"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
    char_length(trim(name)) > 1 AND
    char_length(trim(email)) > 3
);`}
                </pre>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          FOOTER
      ==================================================================== */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-14 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2">
            <button
              onClick={() => navigateTo('home')}
              className="text-2xl font-extrabold font-display text-slate-900 dark:text-white mb-3 text-left cursor-pointer"
            >
              R &amp; L Studio
            </button>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed mb-4">
              Premier cross-platform mobile and web application development studio in Doha, Qatar. Engineering scalable Flutter, Dart, and Supabase solutions.
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Email: <a href="mailto:rlstudiox90@gmail.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">rlstudiox90@gmail.com</a>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Location: West Bay Financial District, Doha, State of Qatar
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Navigation
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => navigateTo('home')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('portfolio')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Portfolio Hub
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Contact &amp; Map
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('deployment-guide')} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  Netlify Deploy Plan
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Legal &amp; Trust
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => navigateTo('privacy')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('terms')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <span className="text-xs text-slate-400">Doha, State of Qatar</span>
              </li>
              <li>
                <span className="text-xs text-slate-400">AdSense &amp; PDPPL Compliant</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} R &amp; L Studio. All rights reserved. Registered in Doha, Qatar.
        </div>
      </footer>

      {/* ====================================================================
          MODAL: SUPABASE AUTHENTICATION (GOOGLE OAUTH & EMAIL/PASSWORD)
      ==================================================================== */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && currentUser) setAuthModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                    Studio Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Powered by Supabase Authentication
                  </p>
                </div>
              </div>
              {currentUser && (
                <button
                  onClick={() => setAuthModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Mandatory Protected Portal Notice (Unauthenticated) */}
            {!currentUser && (
              <div className="p-3.5 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <div className="font-bold">Protected Studio Portal</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    Authentication required. Sign in with Google or your studio credentials to access R &amp; L Studio.
                  </div>
                </div>
              </div>
            )}

            {/* Profile / Logged In State */}
            {currentUser ? (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 font-mono mb-1">
                    Currently Signed In
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {currentUser.email}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    R &amp; L Studio Developer Access
                  </div>
                </div>
                {authFeedback && (
                  <div className={`text-xs font-medium py-1 ${authFeedback.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {authFeedback.text}
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/50 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Studio</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Unauthenticated Form State */
              <div className="space-y-5">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthFeedback(null);
                    }}
                    className={`flex-1 pb-2.5 border-b-2 transition cursor-pointer ${
                      authMode === 'signin'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthFeedback(null);
                    }}
                    className={`flex-1 pb-2.5 border-b-2 transition cursor-pointer ${
                      authMode === 'signup'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-3 shadow-sm hover:shadow transition cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="absolute px-3 bg-white dark:bg-slate-900 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    or with email
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-10 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {authFeedback && (
                    <div
                      className={`text-xs font-medium py-1 ${
                        authFeedback.type === 'error'
                          ? 'text-red-500'
                          : authFeedback.type === 'success'
                          ? 'text-emerald-500'
                          : 'text-blue-500'
                      }`}
                    >
                      {authFeedback.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? 'Connecting...' : authMode === 'signup' ? 'Create Studio Account' : 'Sign In to Studio'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: SET NEW PASSWORD (PASSWORD_RECOVERY FLOW)
      ==================================================================== */}
      {newPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewPasswordModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                    Set New Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Secure your R &amp; L Studio account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewPasswordModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newPasswordFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium mb-4 ${
                  newPasswordFeedback.type === 'error'
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    : newPasswordFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                }`}
              >
                {newPasswordFeedback.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2.5 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={newPasswordLoading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {newPasswordLoading ? 'Saving...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: PROJECT CASE STUDY DETAILS
      ==================================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">
              <span>{selectedProject.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedProject.status}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white mb-4">
              {selectedProject.title}
            </h2>

            <div className="rounded-xl overflow-hidden mb-6 bg-slate-950/80 p-3 flex items-center justify-center">
              <img
                src={selectedProject.image}
                alt={selectedProject.title}
                className="max-h-[55vh] max-w-full h-auto w-auto object-contain mx-auto rounded-lg shadow-xl block"
              />
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {selectedProject.fullDescription}
            </p>

            <div className="mb-6">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-900 dark:text-white mb-3">
                Key Technologies &amp; Capabilities
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedProject.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  navigateTo('contact');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Inquire About Similar Architecture
              </button>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: INSTANT PROJECT QUOTE CALCULATOR
      ==================================================================== */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setQuoteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <Calculator className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-bold">Interactive Estimator</span>
            </div>

            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
              Configure Your Mobile Solution
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Select desired platforms and features to receive an immediate sprint timeline &amp; budget estimation.
            </p>

            {quoteStatusMessage && (
              <div
                className={`mb-5 p-4 rounded-xl text-xs ${
                  quoteStatusMessage.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-800 dark:text-red-200'
                }`}
              >
                {quoteStatusMessage.text}
              </div>
            )}

            <form onSubmit={handleQuoteSubmit} className="space-y-5">
              {/* Target Platforms */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Target Platforms (Single Flutter Codebase)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['iOS', 'Android', 'Web'].map((plat) => (
                    <button
                      type="button"
                      key={plat}
                      onClick={() => {
                        if (quotePlatforms.includes(plat)) {
                          if (quotePlatforms.length > 1) setQuotePlatforms(quotePlatforms.filter((p) => p !== plat));
                        } else {
                          setQuotePlatforms([...quotePlatforms, plat]);
                        }
                      }}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition cursor-pointer ${
                        quotePlatforms.includes(plat)
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Features */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Select Architectural Features
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    'Supabase Database & Auth',
                    'Interactive Maps & Geolocation',
                    'Real-Time WebSocket Chat',
                    'Qatar / International Payment Gateway',
                    'Bilingual Arabic (RTL) Support',
                    'Offline Cache & Synced Storage'
                  ].map((feat) => (
                    <label
                      key={feat}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={quoteFeatures.includes(feat)}
                        onChange={(e) => {
                          if (e.target.checked) setQuoteFeatures([...quoteFeatures, feat]);
                          else setQuoteFeatures(quoteFeatures.filter((f) => f !== feat));
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{feat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Timeline Urgency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Delivery Velocity
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuoteUrgency('standard')}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      quoteUrgency === 'standard'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white">Standard Sprint</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">6 – 8 Weeks Timeline</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteUrgency('fast-track')}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      quoteUrgency === 'fast-track'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white">Fast-Track MVP</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">3 – 4 Weeks Dedicated</div>
                  </button>
                </div>
              </div>

              {/* Estimate Calculation Display */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Estimated Scope Tier
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-display">
                    {quoteFeatures.length > 3 ? '$12,000 – $22,000' : '$6,000 – $12,000'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Sprint Duration
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {quoteUrgency === 'fast-track' ? '3 – 4 Weeks' : '6 – 8 Weeks'}
                  </div>
                </div>
              </div>

              {/* Direct Inbound Info */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={quoteContactName}
                  onChange={(e) => setQuoteContactName(e.target.value)}
                  className="px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="email"
                  required
                  placeholder="Your Email"
                  value={quoteContactEmail}
                  onChange={(e) => setQuoteContactEmail(e.target.value)}
                  className="px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={quoteSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {quoteSubmitting ? 'Transmitting to Supabase...' : 'Submit Scope & Receive Formal Proposal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: SUPABASE DATABASE CONFIGURATION (Live In-Browser Testing)
      ==================================================================== */}
      {supabaseConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setSupabaseConfigModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
              <Database className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-bold">Database Connection</span>
            </div>

            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
              Supabase Project Credentials
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              By default, the studio contact form runs in graceful Demo Mode. You can paste your own project URL and anon public key here to test live inserts into your Supabase <code className="font-mono text-emerald-500">contact_messages</code> table right inside this preview!
            </p>

            {configSaved && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg">
                ✓ Credentials saved in browser session storage!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={customSupabaseUrl}
                  onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon / Public Key
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customSupabaseKey}
                  onChange={(e) => setCustomSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono resize-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveCustomSupabase}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Save &amp; Use Live Database
                </button>
                <button
                  type="button"
                  onClick={resetSupabaseConfig}
                  className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Reset Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
