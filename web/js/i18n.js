import en from './locales/en.json';
import fr from './locales/fr.json';

const STRINGS = { en, fr };

const LANGUAGE_KEY = 'yasl-language';
const AVAILABLE = Object.keys(STRINGS);

// Resolves the effective language: stored preference, or the system
// language when the preference is 'system' (fallback: English).
export function getLanguage() {
  const pref = localStorage.getItem(LANGUAGE_KEY) || 'system';
  if (pref !== 'system') return pref;
  const sys = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return AVAILABLE.includes(sys) ? sys : 'en';
}

// The stored preference itself ('en', 'fr' or 'system')
export function getLanguagePref() {
  return localStorage.getItem(LANGUAGE_KEY) || 'system';
}

export function setLanguagePref(pref) {
  localStorage.setItem(LANGUAGE_KEY, pref);
  location.reload();
}

export function t(key, params) {
  const dict = STRINGS[getLanguage()] || STRINGS.en;
  let s = dict[key] ?? STRINGS.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, v);
    }
  }
  return s;
}

// db.js is a classic (non-module) script: expose t() globally like window.db
window.t = t;

// Applies translations to static elements via data-i18n attributes
export function applyStaticStrings() {
  document.documentElement.lang = getLanguage();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}
