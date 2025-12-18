import Fastify from 'fastify';
import i18nRoutes from './routes/i18n.js';
import healthRoutes from './routes/health.js';
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

const corsOrigin = process.env.CORS_ORIGIN || 'https://localhost:8443';
const fastifyCors = await import('@fastify/cors');
await fastify.register(fastifyCors.default, {
    origin: corsOrigin === 'true' ? true : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-service-token'],
    exposedHeaders: ['Set-Cookie']
});

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
		Object.defineProperty(global, '__I18N_LOCALES__', { value: locales, configurable: true });
	} catch (error) {
	}

	await fastify.register(i18nRoutes, { prefix: '/i18n' });

	await fastify.register(healthRoutes);

	const port = process.env.I18N_SERVICE_PORT || 3002;
	await fastify.listen({
		port: port,
		host: '0.0.0.0'
	});

}

startI18nService().catch(error => {
	process.exit(1);
});
