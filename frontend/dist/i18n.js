import { api } from './api.js';
export class LanguageManager {
    constructor() {
        this.translations = {};
        this.currentLanguage = 'en';
        this.initialized = false;
    }
    async init() {
        if (this.initialized)
            return;
        await this.loadCurrentLanguage();
        await this.loadTranslations();
        this.renderLanguageSelector();
        this.applyTranslations();
        this.initialized = true;
    }
    renderLanguageSelector(containerSelector = null) {
        this.attachLanguageSelectorEvents();
    }
    attachLanguageSelectorEvents() {
        document.addEventListener('change', (e) => {
            const target = e.target;
            if (target instanceof HTMLSelectElement &&
                target.id === 'languageSelect') {
                this.changeLanguage(target.value);
            }
        });
    }
    async loadCurrentLanguage() {
        try {
            const savedLang = localStorage.getItem('preferredLanguage');
            if (savedLang === 'en' || savedLang === 'es') {
                this.currentLanguage = savedLang;
            }
            else {
                const browserLang = navigator.language.split('-')[0];
                this.currentLanguage = browserLang === 'es' ? 'es' : 'en';
                localStorage.setItem('preferredLanguage', this.currentLanguage);
            }
            await this.syncWithServer();
        }
        catch (error) {
            console.error('Error loading current language:', error);
            this.currentLanguage =
                localStorage.getItem('preferredLanguage') || 'en';
        }
        const select = document.getElementById('languageSelect');
        if (select) {
            select.value = this.currentLanguage;
        }
    }
    async syncWithServer() {
        try {
            const result = await api('/api/i18n/change-language', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: this.currentLanguage })
            });
            if (!result?.success) {
                throw new Error('Failed to sync language with server');
            }
            await result;
        }
        catch (error) {
            console.warn('Could not sync language with server:', error);
        }
    }
    async loadTranslations() {
        try {
            const result = await api(`/api/i18n/translations?t=${Date.now()}`, {
                credentials: 'include'
            });
            if (!result?.success) {
                throw new Error(`HTTP error! status: ${result.status}`);
            }
            this.translations = await result;
        }
        catch (error) {
            console.error('Error loading translations:', error);
            await this.loadFallbackTranslations();
        }
    }
    async loadFallbackTranslations() {
        try {
            const result = await api(`/api/i18n/locales/${this.currentLanguage}.json?t=${Date.now()}`);
            if (!result?.success) {
                this.translations = await result;
            }
        }
        catch (error) {
            console.error('Error loading fallback translations:', error);
            this.translations = {};
        }
    }
    applyTranslations() {
        if (!Object.keys(this.translations).length) {
            console.warn('No translations available to apply');
            return;
        }
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (!key)
                return;
            const value = this.getTranslation(key);
            if (typeof value === 'string') {
                if (element instanceof HTMLInputElement &&
                    (element.type === 'submit' || element.type === 'button')) {
                    element.value = value;
                }
                else {
                    element.textContent = value;
                }
            }
        });
        document
            .querySelectorAll('[data-i18n-placeholder]')
            .forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (!key)
                return;
            const value = this.getTranslation(key);
            if (typeof value === 'string') {
                element.placeholder = value;
            }
        });
        document.body.classList.remove('i18n-loading');
        document.body.classList.add('i18n-loaded');
        window.dispatchEvent(new CustomEvent('translationsApplied'));
    }
    getTranslation(key) {
        const parts = key.split('.');
        let current = this.translations;
        for (const part of parts) {
            if (typeof current !== 'object' ||
                current === null ||
                !(part in current)) {
                return parts[parts.length - 1];
            }
            current = current[part];
        }
        return typeof current === 'string'
            ? current
            : parts[parts.length - 1];
    }
    t(key) {
        return this.getTranslation(key);
    }
    async changeLanguage(lang) {
        try {
            this.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            const response = await api('/api/i18n/change-language', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: lang }),
                credentials: 'include'
            });
            const result = await response;
            if (!result.success) {
                throw new Error(result.error);
            }
            await this.loadTranslations();
            this.applyTranslations();
            const select = document.getElementById('languageSelect');
            if (select) {
                select.value = lang;
            }
            window.applyTranslationsToProfile?.();
            return true;
        }
        catch (error) {
            console.error('Error changing language:', error);
            this.currentLanguage = 'en';
            localStorage.setItem('preferredLanguage', 'en');
            return false;
        }
    }
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    isReady() {
        return (this.initialized &&
            Object.keys(this.translations).length > 0);
    }
}
window.languageManager = new LanguageManager();
