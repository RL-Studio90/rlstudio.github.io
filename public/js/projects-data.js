/**
 * ==============================================================================
 * R & L STUDIO - DYNAMIC PROJECTS DATA CONFIGURATION
 * ==============================================================================
 * Single source of truth for all projects showcased on R & L Studio's website.
 * Tagline: Android Mobile Developer (VS Studio - Android Studio)
 * Studio: R & L Studio (Doha, Qatar)
 * Contact: +974-3085-4376 | rlstudiox90@gmail.com
 * ==============================================================================
 * HOW TO ADD A NEW PROJECT:
 * Copy and paste the template below to the end of the `projectsData` array:
 * 
 * {
 *   id: "unique-app-slug",
 *   title: "App Name",
 *   tagline: "Short Catchy Tagline",
 *   category: "Utility / Maps / E-Commerce / Transportation",
 *   status: "Live" | "Beta Testing" | "In Development",
 *   shortDescription: "One sentence summary for cards.",
 *   fullDescription: "Detailed multi-sentence architectural overview.",
 *   screenshots: ["images/screen1.jpg", "images/screen2.jpg"],
 *   techStack: ["Android Studio", "Flutter", "Dart", "Supabase"],
 *   image: "images/screen1.jpg",
 *   downloadUrl: "https://wa.me/97430854376?text=Inquiry",
 *   featured: true | false
 * },
 * ==============================================================================
 */

export const projectsData = [
  {
    id: "cod-finder",
    title: "COD Finder",
    tagline: "Qatar's fastest COD machine locator",
    category: "Utility / Delivery",
    status: "Live",
    shortDescription: "Delivery riders ke liye Qatar me cash deposit machines (COD) fast find karne ki specialized app.",
    fullDescription: "Delivery riders aur logistics couriers ke liye Qatar me cash deposit machines (COD / CDM) fast find aur navigate karne ki specialized Android application. Offline map caching, live operational status, aur instant route computation ke sath critical hours bachaata hai.",
    screenshots: [
      "images/Cod Finder Splash Screen.jpg",
      "images/Cod Finder Main Screen.jpg",
      "images/Cod Finder Menu.jpg",
      "images/Cod Finder Settings Menu.jpg",
      "images/Cod Finder Admin Panel.jpg"
    ],
    techStack: ["Android Studio", "Flutter", "Dart", "Supabase", "GPS Routing", "Offline Cache"],
    image: "images/Cod Finder Main Screen.jpg",
    downloadUrl: "https://wa.me/97430854376?text=Hi%20R%26L%20Studio,%20I%20am%20interested%20in%20COD%20Finder%20app",
    featured: true
  },
  {
    id: "ipay-finder",
    title: "iPay Finder",
    tagline: "Find. Navigate. Pay Smart.",
    category: "Utility / Maps",
    status: "Live",
    shortDescription: "Qatar me nearest payment machines ko easily locate aur navigate karne ke liye smart app.",
    fullDescription: "Qatar me nearest payment machines aur authorized kiosks ko easily locate aur turn-by-turn navigate karne ke liye tailored smart app. Built for Android with modern Flutter & Dart architecture, Supabase backend authentication, and bilingual English & Arabic localization.",
    screenshots: [
      "images/iPay Finder Splash Screen.jpg",
      "images/iPay Finder Home Screen.jpg",
      "images/iPay Finder Login Screen.jpg",
      "images/iPay Finder Settings Menu.jpg",
      "images/iPay Finder admin panel.jpg"
    ],
    techStack: ["Android Studio", "Flutter", "Dart", "Supabase Auth", "Google Maps API", "Bilingual RTL"],
    image: "images/iPay Finder Home Screen.jpg",
    downloadUrl: "https://wa.me/97430854376?text=Hi%20R%26L%20Studio,%20I%20am%20interested%20in%20iPay%20Finder%20app",
    featured: true
  },
  {
    id: "pdfora",
    title: "PDFORA",
    tagline: "Smart PDF Tools & Utilities",
    category: "Productivity",
    status: "Beta Testing",
    shortDescription: "Complete document suite for PDF editing and management.",
    fullDescription: "Next-generation private document utility suite delivering client-side PDF compression, merging, watermarking, cryptographic digital signing, and OCR text extraction with zero confidential data leaks.",
    screenshots: [
      "images/PDFora login screen.jpg",
      "images/PDFora main screen.jpg",
      "images/PDFora menu setting.jpg"
    ],
    techStack: ["Android Studio", "Flutter Mobile", "Dart FFI", "Supabase Storage", "WebAssembly"],
    image: "images/PDFora main screen.jpg",
    downloadUrl: "https://wa.me/97430854376?text=Hi%20R%26L%20Studio,%20I%20want%20early%20access%20to%20PDFORA",
    featured: false
  },
  {
    id: "zonix-ride",
    title: "Zonix Ride",
    tagline: "Next-gen Ride Booking Platform",
    category: "Transportation",
    status: "In Development",
    shortDescription: "Fast and reliable ride-hailing app.",
    fullDescription: "Full-stack on-demand transportation architecture featuring high-frequency GPS telemetry, automated trip dispatch algorithms, dynamic surge calculations, and dual passenger/driver apps with sub-100ms sync.",
    screenshots: [
      "images/Zonix Ride Splash Screen.jpg",
      "images/Zonix Ride Startup.jpg",
      "images/Zonix Ride Startup 2.jpg",
      "images/Zonix Ride login screen.jpg",
      "images/Zonix Ride Main Screen.jpg"
    ],
    techStack: ["Android Studio", "Flutter", "Dart", "Supabase Realtime", "WebSockets"],
    image: "images/Zonix Ride Main Screen.jpg",
    downloadUrl: "https://wa.me/97430854376?text=Hi%20R%26L%20Studio,%20tell%20me%20more%20about%20Zonix%20Ride",
    featured: false
  },
  {
    id: "bazarpulse",
    title: "BazarPulse",
    tagline: "E-Commerce & Market Insights",
    category: "Shopping / Commerce",
    status: "In Development",
    shortDescription: "Smart shopping companion tracking multi-vendor deals.",
    fullDescription: "Hyper-local classifieds and marketplace platform designed for rapid listings, verified buyer/seller credentials, real-time negotiation chat, and proximity-based deal discovery in under 30 seconds.",
    screenshots: [
      "images/bazarpulse.jpg"
    ],
    techStack: ["Android Studio", "Flutter", "Dart", "Supabase Database", "In-App Chat"],
    image: "images/bazarpulse.jpg",
    downloadUrl: "https://wa.me/97430854376?text=Hi%20R%26L%20Studio,%20inquiry%20regarding%20BazarPulse",
    featured: false
  }
];

// Universal attachment for plain script tags in HTML
if (typeof window !== "undefined") {
  window.RL_PROJECTS_DATA = projectsData;
}
