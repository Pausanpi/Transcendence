import Fastify from 'fastify';
import i18nRoutes from './routes/i18n.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

async function startI18nService() {
    const fastify = Fastify({
        serviceName: 'i18n-service',     
        logger: {
            level: process.env.LOG_LEVEL || 'info'
        },
        trustProxy: true
    });

    if (process.env.CORS_ORIGIN) {
        const fastifyCors = await import('@fastify/cors');
        await fastify.register(fastifyCors.default, {
            origin: process.env.CORS_ORIGIN === 'true' ? true : process.env.CORS_ORIGIN,
            credentials: true
        });
    }

    const locales = {};
    const localesPath = path.join(__dirname, 'locales');
    try {
        const files = fs.readdirSync(localesPath);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const language = file.replace('.json', '');
                const filePath = path.join(localesPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                locales[language] = JSON.parse(content);
            }
        });
        console.log('🌐 Loaded languages:', Object.keys(locales));
    } catch (error) {
        console.error('Error loading locales:', error);
    }

    await fastify.register(i18nRoutes, { prefix: '/i18n' });

    fastify.get('/locales/:language.json', async (request, reply) => {
        const { language } = request.params;
        if (!locales[language]) {
            return reply.status(404).send({
                error: 'Language not found',
                available: Object.keys(locales)
            });
        }
        return locales[language];
    });

    fastify.get('/health', async () => {
        return {
            service: 'i18n-service',
            status: 'OK',
			url: process.env.I18N_SERVICE_PORT,
            timestamp: new Date().toISOString(),
            languages: Object.keys(locales),
            loaded: Object.keys(locales).length > 0,
			endpoints: [
				'/locales/:language.json',
				'/languages'
			]
        };
    });

    fastify.get('/languages', async () => {
        return {
            success: true,
            languages: Object.keys(locales).map(lang => ({
                code: lang,
                name: lang === 'en' ? 'English' : 'Español',
                native: lang === 'en' ? 'English' : 'Español'
            }))
        };
    });

    const port = process.env.I18N_SERVICE_PORT || 3002;
    await fastify.listen({
        port: port,
        host: '0.0.0.0'
    });

    console.log(`🌐 I18n Service running on port ${port}`);
}

startI18nService().catch(error => {
    console.error('Failed to start I18n Service:', error);
    process.exit(1);
});
