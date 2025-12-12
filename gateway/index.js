import fastifyStatic from '@fastify/static';
import createFastifyApp from '../shared/fastify-config.js';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import gatewayRoutes from './routes/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'dev-service-token';

async function startGateway() {
    const fastify = await createFastifyApp({
        serviceName: 'api-gateway',
        enableSessions: false,
        corsOrigin: true
    });

    try {
        const jwtSecret = process.env.JWT_SECRET || 'dev-fallback-secret';


fastify.decorateRequest('isAuthenticated', function() {
    try {
        const cookieHeader = this.headers && this.headers.cookie;
        if (cookieHeader && typeof cookieHeader === 'string') {
            const match = cookieHeader.split(';').find(c => c.trim().startsWith('auth_jwt='));
            if (match) {
                const token = match.split('=')[1];
                if (token) {
                    try {
                        const decoded = jwt.verify(token, jwtSecret, {
                            issuer: 'gateway',
                            audience: 'user'
                        });
                        if (decoded && decoded.id) {
                            this.user = decoded;
                            return true;
                        }
                    } catch (verifyError) {
                    }
                }
            }
        }

                if (this.headers && (this.headers['x-user-id'] || this.headers['x-user'])) {
            try {
                if (this.headers['x-user']) {
                    this.user = JSON.parse(this.headers['x-user']);
                } else {
                    this.user = { id: this.headers['x-user-id'] };
                }
                return true;
            } catch (e) {
            }
        }
        return false;
    } catch (error) {
        return false;
    }
});


    } catch (e) {
    }

fastify.setErrorHandler(function (error, request, reply) {
    try {
        const headerTypes = {};
        for (const [k, v] of Object.entries(request.headers || {})) {
            headerTypes[k] = Array.isArray(v) ? `Array(${v.length})` : typeof v;
        }
    } catch (e) {
    }

    if (error.code === 'ECONNREFUSED') {
        return reply.status(503).send({
            error: 'Service unavailable',
            message: 'Authentication service is not responding'
        });
    }

    if (error.code === 'ETIMEDOUT') {
        return reply.status(504).send({
            error: 'Gateway timeout',
            message: 'The authentication service took too long to respond'
        });
    }

    reply.status(500).send({
        error: 'Internal gateway error',
        message: error.message
    });
});
fastify.addHook('onRequest', async (request, reply) => {
    try {
        request.raw.on('close', () => {});
    } catch (e) {}
});

fastify.addHook('onSend', async (request, reply, payload) => payload);


    fastify.post('/auth/login', async (request, reply) => {
        const upstream = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        const url = `${upstream}/auth/login`;
        const contentType = request.headers['content-type'] || 'application/json';
        const clientIp = request.headers['x-forwarded-for'] || request.raw?.socket?.remoteAddress || request.socket?.remoteAddress || '';

        const headers = {
            'x-service-token': SERVICE_TOKEN,
            'x-forwarded-for': String(clientIp),
            'user-agent': request.headers['user-agent'] || 'gateway-proxy'
        };
        if (typeof request.headers['cookie'] === 'string') headers['cookie'] = request.headers['cookie'];
        if (contentType) headers['content-type'] = contentType;

        try {
            let bodyToSend;
            if (contentType.includes('application/x-www-form-urlencoded')) {
                bodyToSend = new URLSearchParams(request.body).toString();
            } else if (contentType.includes('application/json')) {
                bodyToSend = JSON.stringify(request.body || {});
            } else {
                bodyToSend = request.body;
            }

            const upstreamRes = await fetch(url, {
                method: 'POST',
                headers,
                body: bodyToSend
            });

            const rawHeaders = (upstreamRes.headers && typeof upstreamRes.headers.raw === 'function') ? upstreamRes.headers.raw() : {};
            let setCookieHeaders = rawHeaders['set-cookie'] || [];
            if ((!setCookieHeaders || setCookieHeaders.length === 0) && upstreamRes.headers.get && upstreamRes.headers.get('set-cookie')) {
                setCookieHeaders = [upstreamRes.headers.get('set-cookie')];
            }

            const cookieParts = (setCookieHeaders || []).flatMap((hdr) => {
                try {
                    const s = typeof hdr === 'string' ? hdr : (Buffer.isBuffer(hdr) ? hdr.toString('utf8') : String(hdr));
                    return s.split(/, (?=[^=;,\s]+=)/g).map(p => p.trim()).filter(Boolean);
                } catch (e) { return []; }
            });

            const filteredCookies = cookieParts.filter((c) => {
                try {
                    const lower = String(c).toLowerCase();
                    if (lower.includes('sessionid=') && (lower.includes('max-age=0') || lower.includes('expires=thu, 01 jan 1970'))) return false;
                    if (/^sessionid=\s*(;|$)/i.test(c)) return false;
                    return true;
                } catch (e) { return true; }
            });

            if (filteredCookies.length > 0) reply.header('Set-Cookie', filteredCookies);

            const respText = await upstreamRes.text();
            const contentTypeResp = upstreamRes.headers.get('content-type') || 'application/json';
            reply.header('Content-Type', contentTypeResp);
            return reply.code(upstreamRes.status).send(respText);
        } catch (err) {
            return reply.status(502).send({ error: 'Bad Gateway', message: err.message });
        }
    });


    async function proxyForward(request, reply, upstreamBase, prefix = '', rewriteToRoot = false) {
        try {
            const rawUrl = request.raw.url || request.url || '/';
            const prefixPath = prefix || '';
            let pathSuffix;
            if (prefixPath && rewriteToRoot) {
                pathSuffix = rawUrl.startsWith(prefixPath) ? rawUrl.slice(prefixPath.length) : rawUrl;
            } else {
                pathSuffix = rawUrl;
            }
            const target = `${upstreamBase}${pathSuffix}`;

            const headers = {};
            for (const [k, v] of Object.entries(request.headers || {})) {
                const lower = k.toLowerCase();
                if (['connection','keep-alive','transfer-encoding','upgrade','host'].includes(lower)) continue;
                if (Array.isArray(v)) headers[k] = v.join('; ');
                else if (typeof v === 'string') headers[k] = v;
            }
            const clientIp = request.headers['x-forwarded-for'] || request.raw?.socket?.remoteAddress || request.socket?.remoteAddress || '';
            headers['x-service-token'] = SERVICE_TOKEN;
            headers['x-forwarded-for'] = String(clientIp);
            try {
                const cookieHeader = request.headers && request.headers.cookie;
                if (cookieHeader && typeof cookieHeader === 'string') {
                    const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('auth_jwt='));
                    if (match) {
                        const idx = match.indexOf('=');
                        const token = idx === -1 ? '' : match.slice(idx + 1);
                        if (token) {
                                try {
                                    let decoded;
                                    try {
                                        decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-fallback-secret', { issuer: 'gateway', audience: 'user' });
                                    } catch (verifyErr) {
                                        decoded = jwt.decode(token);
                                    }
                                if (decoded && decoded.id) {
                                    headers['x-user-id'] = decoded.id;
                                    headers['x-user'] = JSON.stringify(decoded);
                                }
                            } catch (e) {
                            }
                        }
                    }
                }
            } catch (e) {
            }

            let bodyToSend;
            const contentType = request.headers['content-type'] || '';
            if (['GET','HEAD','OPTIONS'].includes(request.method)) {
                bodyToSend = undefined;
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                if (request.body && typeof request.body === 'object') bodyToSend = new URLSearchParams(request.body).toString();
                else bodyToSend = request.body;
            } else if (contentType.includes('application/json')) {
                bodyToSend = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {});
            } else {
                bodyToSend = request.body && typeof request.body !== 'object' ? request.body : undefined;
            }

            const upstreamRes = await fetch(target, {
                method: request.method,
                headers,
                body: bodyToSend,
                redirect: 'manual'
            });

            try {
                const rawHeaders = (upstreamRes.headers && typeof upstreamRes.headers.raw === 'function') ? upstreamRes.headers.raw() : {};
                let setCookieHeaders = rawHeaders['set-cookie'] || [];
                if ((!setCookieHeaders || setCookieHeaders.length === 0) && upstreamRes.headers.get && upstreamRes.headers.get('set-cookie')) {
                    setCookieHeaders = [upstreamRes.headers.get('set-cookie')];
                }

                const cookieParts = (setCookieHeaders || []).flatMap((hdr) => {
                    try {
                        const s = typeof hdr === 'string' ? hdr : (Buffer.isBuffer(hdr) ? hdr.toString('utf8') : String(hdr));
                        return s.split(/, (?=[^=;,\s]+=)/g).map(p => p.trim()).filter(Boolean);
                    } catch (e) { return []; }
                });

                const filteredCookies = cookieParts.filter((c) => {
                    try {
                        const lower = String(c).toLowerCase();
                        if (lower.includes('sessionid=') && (lower.includes('max-age=0') || lower.includes('expires=thu, 01 jan 1970'))) return false;
                        if (/^sessionid=\s*(;|$)/i.test(c)) return false;
                        return true;
                    } catch (e) { return true; }
                });

                if (filteredCookies.length > 0) reply.header('Set-Cookie', filteredCookies);
            } catch (e) {
            }

            upstreamRes.headers.forEach?.((value, name) => {
                const lower = name.toLowerCase();
                if (['set-cookie','connection','keep-alive','transfer-encoding','upgrade'].includes(lower)) return;
                try { reply.header(name, value); } catch (e) {}
            });

            const buffer = Buffer.from(await upstreamRes.arrayBuffer());
            reply.code(upstreamRes.status);
            return reply.send(buffer);
        } catch (err) {
            return reply.status(502).send({ error: 'Bad Gateway', message: err.message });
        }
    }

    const authUpstream = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    fastify.all('/auth/*', async (request, reply) => proxyForward(request, reply, authUpstream, '/auth'));

    const twoFaUpstream = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    fastify.all('/2fa/*', async (request, reply) => proxyForward(request, reply, twoFaUpstream, '/2fa'));

    const i18nUpstream = process.env.I18N_SERVICE_URL || 'http://localhost:3002';
    fastify.all('/i18n/*', async (request, reply) => proxyForward(request, reply, i18nUpstream, '/i18n'));

    const databaseUpstream = process.env.DATABASE_SERVICE_URL || 'http://localhost:3003';
    fastify.all('/database/*', async (request, reply) => proxyForward(request, reply, databaseUpstream, '/database', true));

    const usersUpstream = process.env.USERS_SERVICE_URL || 'http://localhost:3004';
    fastify.all('/users/*', async (request, reply) => proxyForward(request, reply, usersUpstream, '/users'));








    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '../frontend'),
        prefix: '/',
        wildcard: true,
        index: false
    });

    await fastify.register(gatewayRoutes);

    const port = process.env.GATEWAY_PORT || 3000;
    await fastify.listen({
        port,
        host: '0.0.0.0'
    });


}
startGateway().catch(error => {
    process.exit(1);
});
