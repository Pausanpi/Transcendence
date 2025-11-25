import i18n from '../services/i18n.js';

export function i18nMiddleware(req, res, next) {
	try {
		let lang = 'en';
		if (req.session && req.session.language) lang = req.session.language;
		else if (req.query && req.query.lang && (req.query.lang === 'es' || req.query.lang === 'en')) {
			lang = req.query.lang;
		} else if (req.body && req.body.language && (req.body.language === 'es' || req.body.language === 'en')) {
			lang = req.body.language;
		} else if (req.headers && req.headers['accept-language']) {
			const browserLang = req.headers['accept-language'].split(',')[0]?.split('-')[0];
			if (browserLang === 'es' || browserLang === 'en') {
				lang = browserLang;
			}
		}
		if (!i18n.locales[lang]) lang = 'en';
		i18n.setLanguage(lang);
		if (req.session) req.session.language = lang;
		req.i18n = i18n;
		res.locals.t = i18n.t.bind(i18n);
		res.locals.currentLanguage = lang;
		res.locals.availableLanguages = i18n.getAvailableLanguages();
		next();
	} catch (error) {
		console.error('Error in i18n middleware:', error);
		i18n.setLanguage('en');
		if (req.session) req.session.language = 'en';
		res.locals.translations = i18n.locales[lang] || i18n.locales['en'];
		next();
	}
}
