import fastifyPassport from '@fastify/passport';
import GitHubStrategy from "passport-github2";
import dotenv from "dotenv";
import vaultClient from "../services/vault-client.js";
import { findUserById } from "../models/User.js";

dotenv.config();

const BASE_URL = process.env.NODE_ENV === 'production'
	? 'https://localhost:8443'
	: process.env.BASE_URL || 'http://localhost:8443';

const requiredEnvVars = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
	console.error('ERROR: Required environment variables are missing:');
	missingVars.forEach(varName => console.error(`   - ${varName}`));
	process.exit(1);
}

if (process.env.GITHUB_CLIENT_ID.length < 10 || process.env.GITHUB_CLIENT_SECRET.length < 10) {
	console.error('ERROR: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET appear invalid');
	process.exit(1);
}

fastifyPassport.registerUserSerializer(async (user, request) => {
	return user.id;
});

fastifyPassport.registerUserDeserializer(async (id, request) => {
	try {
		const user = await findUserById(id);
		return user;
	} catch (error) {
		throw error;
	}
});

fastifyPassport.use(
	'github',
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: `${BASE_URL}/auth/github/callback`,
			scope: ["user:email"],
			userAgent: 'secure-web-app',
			proxy: true
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				const user = {
					id: profile.id,
					username: profile.username,
					email: profile.emails?.[0]?.value || null,
					avatar: profile.photos?.[0]?.value || null,
					profileUrl: profile.profileUrl || `https://github.com/${profile.username}`,
					twoFactorEnabled: false,
					twoFactorVerified: false
				};
				if (vaultClient) {
					try {
						const twoFactorData = await vaultClient.getSecret(`2fa/${user.id}`);
						if (twoFactorData?.enabled) {
							user.twoFactorEnabled = true;
							user.twoFactorVerified = false;
						}
					} catch (vaultError) {
						console.warn('Unable to load 2FA data from Vault:', vaultError.message);
					}
				} else {
					console.warn('Vault client unavailable, continuing without 2FA data');
				}
				return done(null, user);
			} catch (err) {
				console.error('Error processing GitHub profile:', err);
				return done(err, null);
			}
		}
	)
);

export default fastifyPassport;
