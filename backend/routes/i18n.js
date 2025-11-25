import i18n from '../services/i18n.js';

export default async function i18nRoutes(fastify, options) {
	fastify.get('/translations', async (request, reply) => {
		const currentLanguage = request.session?.language || 'en';
		const translations = i18n.locales[currentLanguage];
		return translations;
	});
	fastify.post('/change-language', async (request, reply) => {
		const { language } = request.body;
		if (!language) {
			return reply.status(400).send({
				success: false,
				error: 'Language is required'
			});
		}
		if (i18n.setLanguage(language)) {
			if (request.session) {
				request.session.language = language;
			}
			return {
				success: true,
				message: `Language changed to ${language}`,
				language: language
			};
		} else {
			return reply.status(400).send({
				success: false,
				error: 'Unsupported language'
			});
		}
	});
	fastify.get('/available-languages', async (request, reply) => {
		return {
			success: true,
			languages: i18n.getAvailableLanguages(),
			current: i18n.getLanguage()
		};
	});
}
