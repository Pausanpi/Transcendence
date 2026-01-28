import { api } from './api.js';

type Language = 'en' | 'es';

interface Translations {
	[key: string]: string | Translations;
}

declare global {
	interface Window {
		languageManager: LanguageManager;
		applyTranslationsToProfile?: () => void;
	}
}

export class LanguageManager {
	private translations: Translations = {};
	private currentLanguage: Language = 'en';
	private initialized = false;

	async init(): Promise<void> {
		if (this.initialized) return;

		await this.loadCurrentLanguage();
		await this.loadTranslations();
		this.renderLanguageSelector();
		this.applyTranslations();

		this.initialized = true;
	}

	renderLanguageSelector(containerSelector: string | null = null): void {

		this.attachLanguageSelectorEvents();
	}

	private attachLanguageSelectorEvents(): void {
		document.addEventListener('change', (e: Event) => {
			const target = e.target as HTMLElement;

			if (
				target instanceof HTMLSelectElement &&
				target.id === 'languageSelect'
			) {
				this.changeLanguage(target.value as 'en' | 'es');
			}
		});
	}


	private async loadCurrentLanguage(): Promise<void> {
		try {
			const savedLang = localStorage.getItem('preferredLanguage') as Language | null;

			if (savedLang === 'en' || savedLang === 'es') {
				this.currentLanguage = savedLang;
			} else {
				const browserLang = navigator.language.split('-')[0];
				this.currentLanguage = browserLang === 'es' ? 'es' : 'en';
				localStorage.setItem('preferredLanguage', this.currentLanguage);
			}

			await this.syncWithServer();
		} catch (error) {
			console.error('Error loading current language:', error);
			this.currentLanguage =
				(localStorage.getItem('preferredLanguage') as Language) || 'en';
		}

		const select = document.getElementById('languageSelect') as HTMLSelectElement | null;
		if (select) {
			select.value = this.currentLanguage;
		}
	}

	private async syncWithServer(): Promise<void> {
		try {
			const result = await api<any>('/api/i18n/change-language', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: this.currentLanguage })
			});
if (!result?.success) {
	throw new Error('Failed to sync language with server');
}

			await result;
		} catch (error) {
			console.warn('Could not sync language with server:', error);
		}
	}

	private async loadTranslations(): Promise<void> {
		try {
			const result = await api<any>(`/api/i18n/translations?t=${Date.now()}`, {
				credentials: 'include'
			});

			if (!result?.success) {
    throw new Error(`HTTP error! status: ${result.status}`);
}

			this.translations = await result;

		} catch (error) {
			console.error('Error loading translations:', error);
			await this.loadFallbackTranslations();
		}
	}

	private async loadFallbackTranslations(): Promise<void> {
		try {
			 const result = await api<any>(
				`/api/i18n/locales/${this.currentLanguage}.json?t=${Date.now()}`
			);

			if (!result?.success) {
				this.translations = await result;
			}
		} catch (error) {
			console.error('Error loading fallback translations:', error);
			this.translations = {};
		}
	}

	applyTranslations(): void {
		if (!Object.keys(this.translations).length) {
			console.warn('No translations available to apply');
			return;
		}

		document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(element => {
			const key = element.getAttribute('data-i18n');
			if (!key) return;

			const value = this.getTranslation(key);
			if (typeof value === 'string') {
				if (
					element instanceof HTMLInputElement &&
					(element.type === 'submit' || element.type === 'button')
				) {
					element.value = value;
				} else {
					element.textContent = value;
				}
			}
		});

		document
			.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]')
			.forEach(element => {
				const key = element.getAttribute('data-i18n-placeholder');
				if (!key) return;

				const value = this.getTranslation(key);
				if (typeof value === 'string') {
					element.placeholder = value;
				}
			});

		document.body.classList.remove('i18n-loading');
		document.body.classList.add('i18n-loaded');

		window.dispatchEvent(new CustomEvent('translationsApplied'));
	}

	private getTranslation(key: string): string {
		const parts = key.split('.');
		let current: string | Translations | undefined = this.translations;

		for (const part of parts) {
			if (
				typeof current !== 'object' ||
				current === null ||
				!(part in current)
			) {
				return parts[parts.length - 1];
			}
			current = (current as Translations)[part];
		}

		return typeof current === 'string'
			? current
			: parts[parts.length - 1];
	}

public t(key: string): string {
	return this.getTranslation(key);
}

	async changeLanguage(lang: Language): Promise<boolean> {
		try {
			this.currentLanguage = lang;
			localStorage.setItem('preferredLanguage', lang);

			const response = await api<any>('/api/i18n/change-language', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: lang }),
				credentials: 'include'
			});

			const result: { success: boolean; error?: string } = await response;

			if (!result.success) {
				throw new Error(result.error);
			}

			await this.loadTranslations();
			this.applyTranslations();

			const select = document.getElementById('languageSelect') as HTMLSelectElement | null;
			if (select) {
				select.value = lang;
			}

			window.applyTranslationsToProfile?.();
			return true;
		} catch (error) {
			console.error('Error changing language:', error);
			this.currentLanguage = 'en';
			localStorage.setItem('preferredLanguage', 'en');
			return false;
		}
	}

	getCurrentLanguage(): Language {
		return this.currentLanguage;
	}

	isReady(): boolean {
		return (
			this.initialized &&
			Object.keys(this.translations).length > 0
		);
	}
}

window.languageManager = new LanguageManager();
