import i18n from '../services/i18n.js';

export default async function i18nRoutes(fastify, options) {
    fastify.get('/translations', async (request, reply) => {
        const language = request.query.language || i18n.getLanguage() || 'en';
        const translations = i18n.locales[language];

        if (!translations) {
            return reply.status(404).send({
                success: false,
                error: 'Translations not found for language: ' + language
            });
        }

        return translations;
    });

    fastify.post('/change-language', async (request, reply) => {
        const { language } = request.body;

        if (!language || !['en', 'es', 'ja'].includes(language)) {
            return reply.status(400).send({
                success: false,
                error: 'common.unsupportedLanguage'
            });
        }

        i18n.setLanguage(language);

        if (request.session) {
            request.session.language = language;
        }

        return {
            success: true,
            message: 'common.languageChanged',
            language: language
        };
    });

    fastify.get('/available-languages', async (request, reply) => {
        return {
            success: true,
            languages: ['en', 'es', 'ja'],
            current: i18n.getLanguage()
        };
    });

    fastify.get('/locales/:language.json', async (request, reply) => {
        const { language } = request.params;

        if (!['en', 'es', 'ja'].includes(language)) {
            return reply.status(404).send({ error: 'Language not found' });
        }

        const translations = i18n.locales[language];
        if (!translations) {
            return reply.status(404).send({ error: 'Translations not found' });
        }

        return translations;
    });
}
