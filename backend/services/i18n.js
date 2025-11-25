import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class I18nService {
	constructor() {
		this.locales = {};
		this.defaultLanguage = 'en';
		this.currentLanguage = this.defaultLanguage;
		this.loadLocales();
	}
	render() {
		return `
		<div class="language-selector">
			<select id="languageSelect">
				<option value="en">🇺🇸 English</option>
				<option value="es">🇪🇸 Español</option>
			</select>
		</div>
	`;
	}
	loadLocales() {
		const localesPath = path.join(__dirname, '../locales');
		try {
			const files = fs.readdirSync(localesPath);
			files.forEach(file => {
				if (file.endsWith('.json')) {
					const language = file.replace('.json', '');
					const filePath = path.join(localesPath, file);
					const content = fs.readFileSync(filePath, 'utf8');
					this.locales[language] = JSON.parse(content);
				}
			});
		} catch (error) {
			console.error('Error loading languages:', error);
		}
	}
	setLanguage(lang) {
		if (this.locales[lang]) {
			this.currentLanguage = lang;
			return true;
		}
		return false;
	}
	getLanguage() {
		return this.currentLanguage;
	}
	t(key, params = {}) {
		const keys = key.split('.');
		let value = this.locales[this.currentLanguage];
		for (const k of keys) {
			value = value?.[k];
			if (value === undefined) {
				value = this.locales[this.defaultLanguage];
				for (const k2 of keys) {
					value = value?.[k2];
				}
				break;
			}
		}
		if (value === undefined) {
			console.warn(`Text not found: ${key}`);
			return key;
		}
		if (typeof value === 'string' && params) {
			return value.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] || match);
		}
		return value;
	}
	getAvailableLanguages() {
		return Object.keys(this.locales);
	}
}

export default new I18nService();
