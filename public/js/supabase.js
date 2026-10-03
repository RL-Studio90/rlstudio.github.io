/**
 * ==============================================================================
 * R & L STUDIO - SUPABASE CLIENT INTEGRATION
 * ==============================================================================
 * Backend Credentials:
 * Project URL: https://xwhugayxrizbiaqndycl.supabase.co
 * Anon Key: sb_publishable_ilMx2ttvWxmZMJQatWeCAg_M6-GTHSd
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

/**
 * Initializes and returns the Supabase client.
 * Uses window.supabase from CDN (@supabase/supabase-js v2)
 * with graceful HTTP REST fallback.
 */
export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const { url, anonKey } = SUPABASE_CONFIG;

  // 1. If Supabase CDN is loaded on the page
  if (typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function") {
    supabaseInstance = window.supabase.createClient(url, anonKey);
    return supabaseInstance;
  }

  // 2. Direct REST API Fallback
  supabaseInstance = {
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
            throw new Error(errData.message || `Supabase HTTP ${response.status}: ${response.statusText}`);
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

/**
 * Submits contact form data to the 'contact_messages' table in Supabase.
 * @param {Object} formData
 * @param {string} formData.name - Sender name
 * @param {string} formData.email - Sender email
 * @param {string} formData.subject - Subject line
 * @param {string} formData.message - Message body
 * @param {string} [formData.phone] - Sender contact number
 * @param {string} [formData.project_type] - Project type
 * @param {string} [formData.budget_range] - Budget range
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
export async function submitContactForm(formData) {
  // Input Validation
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

// Global attachment for vanilla HTML
if (typeof window !== "undefined") {
  window.RL_Studio_Supabase = {
    getSupabaseConfig,
    getSupabaseClient,
    submitContactForm
  };
}

export default {
  getSupabaseConfig,
  getSupabaseClient,
  submitContactForm
};
