// Language detection, preference storage, and supported languages

const LANGUAGE_KEY = "mindmate_language";

export interface Language {
  code: string;
  name: string;       // in English
  nativeName: string;  // in the language itself
}

// Languages Claude handles well — curated for quality, not exhaustive
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "auto", name: "Auto-detect", nativeName: "Auto-detect" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", nativeName: "Filipino" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  { code: "ig", name: "Igbo", nativeName: "Igbo" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan" },
  { code: "ka", name: "Georgian", nativeName: "ქართული" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
];

/** Get the stored language preference, or null if using auto-detect */
export function getLanguagePreference(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === "auto" || !stored) return null;
  return stored;
}

/** Save a language preference. Pass "auto" to revert to auto-detect. */
export function setLanguagePreference(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_KEY, code);
}

/** Get the browser's language (e.g. "az", "en-GB", "fr") */
export function getBrowserLanguage(): string {
  if (typeof window === "undefined") return "en";
  return navigator.language || "en";
}

/**
 * Get the effective language to use.
 * Priority: stored preference > browser language
 * Returns the base language code (e.g. "en" not "en-GB")
 */
export function getEffectiveLanguage(): string {
  const preference = getLanguagePreference();
  if (preference) return preference;
  const browser = getBrowserLanguage();
  // Return base code (e.g. "en" from "en-GB", "az" from "az-AZ")
  return browser.split("-")[0];
}

/** Get the display name for the current effective language */
export function getEffectiveLanguageDisplay(): string {
  const code = getEffectiveLanguage();
  const found = SUPPORTED_LANGUAGES.find(l => l.code === code);
  if (found) return found.nativeName;
  // For unlisted languages, return the code
  return code;
}

/** Check if the stored setting is "auto" (or unset) */
export function isAutoDetect(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(LANGUAGE_KEY);
  return !stored || stored === "auto";
}

/** Get the raw stored value for the settings picker */
export function getStoredLanguageCode(): string {
  if (typeof window === "undefined") return "auto";
  return localStorage.getItem(LANGUAGE_KEY) || "auto";
}
