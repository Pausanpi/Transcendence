class LanguageManager {
	constructor() {
		this.translations = {};
		this.currentLanguage = 'en';
		this.initialized = false;
	}

	async init() {
		if (this.initialized) return;
		await this.loadCurrentLanguage();
		await this.loadTranslations();
		this.renderLanguageSelector();
		this.applyTranslations();
		this.initialized = true;
	}

	renderLanguageSelector(containerSelector = null) {
		if (document.getElementById('languageSelect')) return;

		const selectorHTML = `
            <div class="language-selector">
                <select id="languageSelect">
                    <option value="es">🇪🇸 Español</option>
                    <option value="en">🇺🇸 English</option>
                </select>
            </div>
        `;

		let container;
		if (containerSelector) {
			container = document.querySelector(containerSelector);
		}

		if (container) {
			container.insertAdjacentHTML('afterbegin', selectorHTML);
		} else {
			document.body.insertAdjacentHTML('afterbegin', selectorHTML);
		}

		this.attachLanguageSelectorEvents();
	}

	attachLanguageSelectorEvents() {
		const languageSelect = document.getElementById('languageSelect');
		if (languageSelect) {
			languageSelect.value = this.currentLanguage;
			languageSelect.addEventListener('change', (e) => {
				this.changeLanguage(e.target.value);
			});
		}
	}

	async loadCurrentLanguage() {
		try {
			const savedLang = localStorage.getItem('preferredLanguage');
			if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
				this.currentLanguage = savedLang;
			} else {
				const browserLang = navigator.language.split('-')[0];
				this.currentLanguage = (browserLang === 'es') ? 'es' : 'en';
				localStorage.setItem('preferredLanguage', this.currentLanguage);
			}
			await this.syncWithServer();
		} catch (error) {
			console.error('Error loading current language:', error);
			this.currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
		}

		const select = document.getElementById('languageSelect');
		if (select) {
			select.value = this.currentLanguage;
		}
	}

	async syncWithServer() {
		try {
			await fetch('/i18n/change-language', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: this.currentLanguage })
			});
		} catch (error) {
			console.warn('Could not sync language with server:', error);
		}
	}

	async loadTranslations() {
		try {
			const response = await fetch(`/i18n/translations?t=${Date.now()}`, {
				credentials: 'include'
			});
			if (!response.ok) throw new Error('Failed to load translations');
			this.translations = await response.json();
			console.log('Translations loaded successfully:', Object.keys(this.translations));
		} catch (error) {
			console.error('Error loading translations:', error);
			await this.loadFallbackTranslations();
		}
	}

	async loadFallbackTranslations() {
		try {
			const response = await fetch(`/locales/${this.currentLanguage}.json?t=${Date.now()}`);
			if (response.ok) {
				this.translations = await response.json();
				console.log('Fallback translations loaded');
			}
		} catch (error) {
			console.error('Error loading fallback translations:', error);
			this.translations = {};
		}
	}

	applyTranslations() {
		if (!this.translations || Object.keys(this.translations).length === 0) {
			console.warn('No translations available to apply');
			return;
		}

		document.querySelectorAll('[data-i18n]').forEach(element => {
			const key = element.getAttribute('data-i18n');
			const value = this.getTranslation(key);
			if (value && typeof value === 'string') {
				if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
					element.value = value;
				} else {
					element.textContent = value;
				}
			}
		});

		document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
			const key = element.getAttribute('data-i18n-placeholder');
			const value = this.getTranslation(key);
			if (value && typeof value === 'string') {
				element.placeholder = value;
			}
		});

		document.body.classList.remove('i18n-loading');
		document.body.classList.add('i18n-loaded');

		window.dispatchEvent(new CustomEvent('translationsApplied'));
	}

	getTranslation(key) {
		if (!this.translations || typeof this.translations !== 'object') {
			return key;
		}
		const parts = key.split('.');
		let current = this.translations;
		for (const part of parts) {
			if (!current || typeof current !== 'object' || current[part] === undefined) {
				return key;
			}
			current = current[part];
		}
		return current;
	}

	async changeLanguage(lang) {
		try {
			this.currentLanguage = lang;
			localStorage.setItem('preferredLanguage', lang);

			const response = await fetch('/i18n/change-language', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: lang }),
				credentials: 'include'
			});

			const result = await response.json();
			if (result.success) {
				await this.loadTranslations();
				this.applyTranslations();

				const languageSelect = document.getElementById('languageSelect');
				if (languageSelect) {
					languageSelect.value = lang;
				}

				if (typeof window.applyTranslationsToProfile === 'function') {
					window.applyTranslationsToProfile();
				}

				return true;
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
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
		return this.initialized && this.translations && Object.keys(this.translations).length > 0;
	}
}

window.languageManager = new LanguageManager();

document.addEventListener('DOMContentLoaded', async function () {
	await window.languageManager.init();
});
