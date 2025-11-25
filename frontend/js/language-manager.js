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
		if (document.getElementById('languageSelect')) {
			return;
		}

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
			const response = await fetch('/i18n/available-languages');
			const data = await response.json();
			const savedLang = localStorage.getItem('preferredLanguage');
			if (savedLang && data.languages.includes(savedLang)) {
				this.currentLanguage = savedLang;
			} else {
				this.currentLanguage = data.current || 'en';
				localStorage.setItem('preferredLanguage', this.currentLanguage);
			}
			await this.syncWithServer();
		} catch (error) {
			console.error('Error loading current language:', error);
			const savedLang = localStorage.getItem('preferredLanguage');
			this.currentLanguage = savedLang || 'en';
		}

		const select = document.getElementById('languageSelect');
		if (select) {
			select.value = this.currentLanguage;
		}
	}

	async syncWithServer() {
		try {
			const response = await fetch('/i18n/change-language', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: this.currentLanguage })
			});
			if (!response.ok) {
				throw new Error('Failed to sync with server');
			}
		} catch (error) {
			console.warn('Could not sync language with server:', error);
		}
	}

	async loadTranslations() {
		try {
			const response = await fetch(`/i18n/translations?t=${Date.now()}`);
			if (!response.ok) throw new Error('Failed to load translations');
			this.translations = await response.json();
		} catch (error) {
			console.error('Error loading translations:', error);
			setTimeout(() => this.loadTranslations(), 1000);
		}
	}

	applyTranslations() {
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
	}

	showTranslatedMessage(messageKey, type, containerId = 'message', params = {}) {
		const messageDiv = document.getElementById(containerId);
		const messageText = this.getTranslation(messageKey, params);
		messageDiv.innerHTML = `<div class="message ${type}">${messageText}</div>`;
		if (type === 'success') {
			setTimeout(() => {
				messageDiv.innerHTML = '';
			}, 5000);
		}
	}

	getTranslation(key, params = {}) {
		const keys = key.split('.');
		let value = this.translations;

		for (const k of keys) {
			value = value?.[k];
			if (value === undefined) break;
		}

		if (value === undefined) {
			console.warn(`Translation not found: ${key}`);
			return key;
		}

		if (typeof value === 'string' && params) {
			return value.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] !== undefined ? params[param] : match);
		}

		return value;
	}

	async changeLanguage(lang) {
		try {
			this.currentLanguage = lang;
			localStorage.setItem('preferredLanguage', lang);

			const response = await fetch('/i18n/change-language', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: lang })
			});

			const result = await response.json();
			if (result.success) {
				await this.loadTranslations();
				this.applyTranslations();
				const languageSelect = document.getElementById('languageSelect');
				if (languageSelect) {
					languageSelect.value = lang;
				}
				return true;
			} else {
				console.error('Error changing language:', result.error);
				this.currentLanguage = 'en';
				localStorage.setItem('preferredLanguage', 'en');
				return false;
			}
		} catch (error) {
			console.error('Error changing language:', error);
			this.currentLanguage = 'en';
			localStorage.setItem('preferredLanguage', 'en');
			return false;
		}
	}

	async refreshTranslations() {
		await this.loadTranslations();
		this.applyTranslations();
	}
}

window.languageManager = new LanguageManager();

document.addEventListener('DOMContentLoaded', async function () {
	await window.languageManager.init();
});
