import { reactive } from 'vue';
import en from './locales/en.js';
import zh from './locales/zh.js';

const messages = { en, zh };
export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'zh'];

function getInitialLocale() {
  if (typeof window !== 'undefined') {
    try {
      // 1. Check URL query string parameter (?lang=zh or ?lang=en)
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      if (langParam) {
        const cleanLang = langParam.toLowerCase();
        if (cleanLang.startsWith('zh') || cleanLang === 'cn') return 'zh';
        if (cleanLang.startsWith('en')) return 'en';
      }

      // 2. Check path (/zh/ or /zh)
      const pathname = window.location.pathname || '';
      if (pathname === '/zh' || pathname.startsWith('/zh/')) {
        return 'zh';
      }

      // 3. Check localStorage
      const saved = localStorage.getItem('city_roads_lang');
      if (saved && SUPPORTED_LOCALES.includes(saved)) {
        return saved;
      }

      // 4. Check browser navigator language
      if (typeof navigator !== 'undefined' && navigator.language) {
        const navLang = navigator.language.toLowerCase();
        if (navLang.startsWith('zh')) return 'zh';
      }
    } catch (e) {
      console.warn('Failed to detect initial locale:', e);
    }
  }
  return DEFAULT_LOCALE;
}

const state = reactive({
  locale: getInitialLocale()
});

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  state.locale = locale;

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('city_roads_lang', locale);
    } catch (e) {
      // Ignore localStorage access errors (e.g. private browsing mode)
    }
  }
}

export function getLocale() {
  return state.locale;
}

export function toggleLocale() {
  setLocale(state.locale === 'zh' ? 'en' : 'zh');
}

export function t(key, params = {}) {
  const currentMsg = messages[state.locale] || messages[DEFAULT_LOCALE];
  const keys = key.split('.');
  
  let val = currentMsg;
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k];
    } else {
      // Fallback to English
      let fallbackVal = messages[DEFAULT_LOCALE];
      for (const fk of keys) {
        if (fallbackVal && typeof fallbackVal === 'object' && fk in fallbackVal) {
          fallbackVal = fallbackVal[fk];
        } else {
          return key;
        }
      }
      val = fallbackVal;
      break;
    }
  }

  if (typeof val === 'string') {
    return val.replace(/\{(\w+)\}/g, (_, match) => {
      return params[match] !== undefined ? params[match] : `{${match}}`;
    });
  }

  return val !== undefined ? val : key;
}

export const i18nPlugin = {
  install(app) {
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$i18n = {
      get locale() {
        return state.locale;
      },
      set locale(val) {
        setLocale(val);
      },
      setLocale,
      getLocale,
      toggleLocale,
      availableLocales: SUPPORTED_LOCALES
    };

    app.provide('i18n', {
      state,
      t,
      setLocale,
      getLocale,
      toggleLocale
    });
  }
};

export default i18nPlugin;
