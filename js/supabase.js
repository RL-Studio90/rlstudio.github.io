/**
 * ==============================================================================
 * R & L STUDIO - SUPABASE CLIENT & AUTH INTEGRATION
 * ==============================================================================
 * Backend Credentials:
 * Project URL: https://xwhugayxrizbiaqndycl.supabase.co
 * Anon Key: sb_publishable_ilMx2ttvWxmZMJQatWeCAg_M6-GTHSd
 * Auth Providers: Google OAuth, Email/Password
 * Target Table: contact_messages
 * ==============================================================================
 */

export const SUPABASE_CONFIG = {
  url: "https://xwhugayxrizbiaqndycl.supabase.co",
  anonKey: "sb_publishable_ilMx2ttvWxmZMJQatWeCAg_M6-GTHSd"
};

export function getSupabaseConfig() {
  return SUPABASE_CONFIG;
}

let supabaseInstance = null;
let dynamicCreateClient = null;

// Dynamically resolve createClient from CDN if window.supabase is not loaded yet
if (typeof window !== "undefined") {
  if (window.supabase && typeof window.supabase.createClient === "function") {
    dynamicCreateClient = window.supabase.createClient;
  } else {
    // Dynamic import from ESM CDN as progressive enhancement
    import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
      .then((mod) => {
        if (mod && typeof mod.createClient === "function") {
          dynamicCreateClient = mod.createClient;
          if (!supabaseInstance) {
            getSupabaseClient();
          }
        }
      })
      .catch(() => {});
  }
}

/**
 * Initializes and returns the Supabase client with full Auth and Database support.
 */
export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const { url, anonKey } = SUPABASE_CONFIG;

  // 1. Check window.supabase from CDN script tag
  if (typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function") {
    supabaseInstance = window.supabase.createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseInstance;
  }

  // 2. Check dynamicCreateClient
  if (typeof dynamicCreateClient === "function") {
    supabaseInstance = dynamicCreateClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseInstance;
  }

  // 3. Fallback mock/REST client
  supabaseInstance = {
    auth: {
      signInWithOAuth: async () => ({ data: null, error: new Error("Auth client unavailable") }),
      signInWithPassword: async () => ({ data: null, error: new Error("Auth client unavailable") }),
      signUp: async () => ({ data: null, error: new Error("Auth client unavailable") }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: (tableName) => ({
      insert: async (records) => {
        try {
          const response = await fetch(`${url}/rest/v1/${tableName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": anonKey,
              "Authorization": `Bearer ${anonKey}`,
              "Prefer": "return=minimal"
            },
            body: JSON.stringify(records)
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}: ${response.statusText}`);
          }
          return { data: records, error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      }
    })
  };

  return supabaseInstance;
}

/* ==========================================================================
   AUTHENTICATION FUNCTIONS
   ========================================================================== */

/**
 * Initiates Google OAuth sign-in via Supabase.
 */
export async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client || !client.auth) {
    throw new Error("Supabase auth is not initialized");
  }

  // Use current page URL without hash for OAuth redirect
  const redirectOrigin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectOrigin,
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Signs in with Email and Password.
 */
export async function signInWithEmail(email, password) {
  const client = getSupabaseClient();
  if (!client || !client.auth) {
    throw new Error("Supabase auth is not initialized");
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Signs up a new user with Email and Password.
 */
export async function signUpWithEmail(email, password) {
  const client = getSupabaseClient();
  if (!client || !client.auth) {
    throw new Error("Supabase auth is not initialized");
  }

  const redirectOrigin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";

  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: redirectOrigin
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Sends a password reset email via Supabase Auth.
 */
export async function resetPasswordForEmail(email) {
  const client = getSupabaseClient();
  if (!client || !client.auth) {
    throw new Error("Supabase auth is not initialized");
  }

  const redirectOrigin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const { data, error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: redirectOrigin
  });
  if (error) throw error;
  return data;
}

/**
 * Signs out current user session.
 */
export async function signOutUser() {
  const client = getSupabaseClient();
  if (!client || !client.auth) {
    throw new Error("Supabase auth is not initialized");
  }

  const { error } = await client.auth.signOut();
  if (error) throw error;
  return true;
}

/**
 * Retrieves current active session.
 */
export async function getSession() {
  const client = getSupabaseClient();
  if (!client || !client.auth) return null;
  const { data, error } = await client.auth.getSession();
  if (error) return null;
  return data.session;
}

/**
 * Subscribes to auth state changes (SIGNED_IN, SIGNED_OUT, etc.)
 */
export function onAuthStateChange(callback) {
  const client = getSupabaseClient();
  if (!client || !client.auth) return { unsubscribe: () => {} };
  
  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return data.subscription;
}

/* ==========================================================================
   DATABASE / CONTACT FORM FUNCTIONS
   ========================================================================== */

/**
 * Submits contact form data to the 'contact_messages' table in Supabase.
 */
export async function submitContactForm(formData) {
  if (!formData.name || !formData.name.trim()) {
    return { success: false, message: "Please enter your name." };
  }
  if (!formData.email || !formData.email.trim()) {
    return { success: false, message: "Please enter your email address." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email.trim())) {
    return { success: false, message: "Please provide a valid email address." };
  }
  if (!formData.subject || !formData.subject.trim()) {
    return { success: false, message: "Please provide a subject." };
  }
  if (!formData.message || !formData.message.trim()) {
    return { success: false, message: "Please write a message." };
  }

  const payload = {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    subject: formData.subject.trim(),
    message: formData.message.trim(),
    ...(formData.phone ? { phone: formData.phone.trim() } : {}),
    ...(formData.project_type ? { project_type: formData.project_type.trim() } : {}),
    ...(formData.budget_range ? { budget_range: formData.budget_range.trim() } : {}),
    status: "unread",
    created_at: new Date().toISOString()
  };

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from("contact_messages").insert([payload]);

    if (error) {
      console.error("[R & L Studio Supabase Error]", error);
      return {
        success: false,
        message: error.message || "Failed to submit message to Supabase.",
        error
      };
    }

    return {
      success: true,
      message: "Thank you! Your message has been sent directly to the R & L Studio engineering team in Doha, Qatar.",
      data
    };
  } catch (err) {
    console.error("[R & L Studio Supabase Exception]", err);
    return {
      success: false,
      message: err.message || "Network error. Please try again or reach out on WhatsApp (+974-3085-4376).",
      error: err
    };
  }
}

// Global attachment for plain script tags
if (typeof window !== "undefined") {
  window.RL_Studio_Supabase = {
    getSupabaseConfig,
    getSupabaseClient,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    signOutUser,
    getSession,
    onAuthStateChange,
    submitContactForm
  };
}

export default {
  getSupabaseConfig,
  getSupabaseClient,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPasswordForEmail,
  signOutUser,
  getSession,
  onAuthStateChange,
  submitContactForm
};
