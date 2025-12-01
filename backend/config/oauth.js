import fastifyPassport from '@fastify/passport';
import GitHubStrategy from "passport-github2";
import dotenv from "dotenv";
import { findUserById } from "../models/User.js";

dotenv.config();

const BASE_URL = process.env.NODE_ENV === 'production'
	? 'https://localhost:8443'
	: process.env.BASE_URL || 'http://localhost:8443';

fastifyPassport.registerUserSerializer(async (user) => user.id);

fastifyPassport.registerUserDeserializer(async (id) => {
	return await findUserById(id);
});

fastifyPassport.use(
	'github',
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: `${BASE_URL}/auth/github/callback`,
			scope: ["user:email"],
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
					twoFactorEnabled: false
				};
				return done(null, user);
			} catch (err) {
				return done(err, null);
			}
		}
	)
);

export default fastifyPassport;
