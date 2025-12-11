import validationService from '../services/validation.js';
import passwordService from '../services/password.js';
import fastifyStatic from '@fastify/static';
export function validateRegistration(request, reply, next) {
	const { username, email, password } = request.body;

	if (!request.body) {
		return reply.status(400).send({
			error: 'validation.invalidRequest',
			code: 'INVALID_REQUEST'
		});
	}

	const usernameValidation = validationService.validateUsername(username);
	if (!usernameValidation.isValid) {
		return reply.status(400).send({
			error: usernameValidation.error,
			code: 'INVALID_USERNAME'
		});
	}

	const emailValidation = validationService.validateEmail(email);
	if (!emailValidation.isValid) {
		return reply.status(400).send({
			error: emailValidation.error,
			code: 'INVALID_EMAIL'
		});
	}

	const passwordValidation = passwordService.validatePasswordStrength(password);
	if (!passwordValidation.isValid) {
		return reply.status(400).send({
			error: 'validation.weakPassword',
			issues: passwordValidation.issues,
			code: 'WEAK_PASSWORD'
		});
	}

	next();
}

export function validateLogin(request, reply, next) {
	const { email, password } = request.body;

	if (!request.body) {
		return reply.status(400).send({
			error: 'validation.invalidRequest',
			code: 'INVALID_REQUEST'
		});
	}

	const emailValidation = validationService.validateEmail(email);
	if (!emailValidation.isValid) {
		return reply.status(400).send({
			error: 'messages.invalidCredentials',
			code: 'INVALID_CREDENTIALS'
		});
	}

	if (!password || password.length < 1) {
		return reply.status(400).send({
			error: 'messages.invalidCredentials',
			code: 'INVALID_CREDENTIALS'
		});
	}

	next();
}

export function handleValidationError(error, request, reply) {
	if (error.validation) {
		return reply.status(400).send({
			error: 'validation.invalidInput',
			code: 'VALIDATION_ERROR',
			details: error.validation
		});
	}
	reply.send(error);
}
