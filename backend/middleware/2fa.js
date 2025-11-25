import { findUserById } from '../models/User.js';

const TWOFA_EXEMPT_ROUTES = [
	'/auth/2fa-required',
	'/2fa/verify-login',
	'/auth/pending-2fa-user',
	'/auth/logout',
	'/',
	'/auth/login',
	'/auth/register',
	'/auth/github',
	'/auth/github/callback',
	'/public/',
	'/css/',
	'/js/',
	'/i18n/',
	'/health'
];

export function require2FA(req, res, next) {
	if (TWOFA_EXEMPT_ROUTES.some(route => req.path.startsWith(route))) {
		return next();
	}
	if (!req.isAuthenticated || !req.isAuthenticated()) {
		return res.status(401).json({
			error: 'Unauthenticated',
			code: 'NOT_AUTHENTICATED'
		});
	}
	const user = findUserById(req.user.id);
	if (user && user.twoFactorEnabled) {
		if (!req.session.twoFactorVerified) {
			req.session.pending2FAUserId = user.id;
			return res.redirect('/auth/2fa-required');
		}
	}
	next();
}

export async function check2FAStatus(req, res, next) {
	if (TWOFA_EXEMPT_ROUTES.some(route => req.path.startsWith(route)) ||
		req.path.includes('.') ||
		req.path === '/auth/2fa-required') {
		return next();
	}
	if (!req.isAuthenticated || !req.isAuthenticated()) {
		return next();
	}
	try {
		const user = await findUserById(req.user.id);
		if (!user) {
			return res.redirect('/');
		}
		req.user.twoFactorEnabled = user.twoFactorEnabled;
		if (user.twoFactorEnabled === true && !req.session.twoFactorVerified) {
			req.session.pending2FAUserId = user.id;
			if (req.path !== '/auth/2fa-required' && !req.path.startsWith('/2fa/')) {
				return res.redirect('/auth/2fa-required');
			}
		}
		if (user.twoFactorEnabled === false) {
			delete req.session.twoFactorVerified;
			delete req.session.pending2FAUserId;
		}
		next();
	} catch (error) {
		console.error('Error checking 2FA status:', error);
		next();
	}
}

export function enforce2FA(req, res, next) {
	if (TWOFA_EXEMPT_ROUTES.some(route => req.path.startsWith(route))) {
		return next();
	}
	if (!req.isAuthenticated || !req.isAuthenticated()) {
		return res.redirect('/');
	}
	const user = findUserById(req.user.id);
	if (user && user.twoFactorEnabled && !req.session.twoFactorVerified) {
		req.session.pending2FAUserId = user.id;
		if (req.path !== '/auth/2fa-required') {
			return res.redirect('/auth/2fa-required');
		}
	}
	next();
}

export function prevent2FABypass(req, res, next) {
	res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	if (TWOFA_EXEMPT_ROUTES.some(route => req.path.startsWith(route)) ||
		req.path.startsWith('/2fa/') ||
		req.path === '/auth/2fa-required') {
		return next();
	}
	if (req.isAuthenticated && req.isAuthenticated()) {
		const user = findUserById(req.user.id);
		if (user && user.twoFactorEnabled && !req.session.twoFactorVerified) {
			req.session.pending2FAUserId = user.id;
			if (req.path !== '/auth/2fa-required') {
				return res.redirect('/auth/2fa-required');
			}
		}
	}
	next();
}
