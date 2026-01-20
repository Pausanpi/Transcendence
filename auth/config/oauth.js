import GitHubStrategy from 'passport-github2';
import { findUserById, findOrCreateOAuthUser } from '../services/user.js';

export function configurePassport(passport) {
	passport.registerUserSerializer(async (user) => {
		return user?.id || user?.user?.id || null;
	});

	passport.registerUserDeserializer(async (id) => {
		try {
			const user = await findUserById(id);
			return user;
		} catch (error) {
			console.error('Deserializer error:', error);
			return null;
		}
	});

	if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
		passport.use(
			'github',
			new GitHubStrategy(
				{
					clientID: process.env.GITHUB_CLIENT_ID,
					clientSecret: process.env.GITHUB_CLIENT_SECRET,
					callbackURL: 'https://localhost:8443/api/oauth/github/callback',
					scope: ["user:email"],
					proxy: true
				},
				async (accessToken, refreshToken, profile, done) => {
					try {
						const oauthProfile = {
							provider: 'github',
							id: profile.id.toString(),
							username: profile.username || profile.displayName || `github_${profile.id}`,
							email: profile.emails?.[0]?.value || null,
							avatar: profile.photos?.[0]?.value || null,
							profileUrl: profile.profileUrl || `https://github.com/${profile.username}`
						};

						const user = await findOrCreateOAuthUser(oauthProfile);
						if (!user) {
							return done(new Error('Could not find or create user'), null);
						}

						return done(null, user);
					} catch (err) {
						console.error('Passport strategy error:', err);
						return done(err, null);
					}
				}
			)
		);
	} else {
		console.warn('GitHub OAuth not configured: environment variables missing. OAuth disabled.');
	}

	return passport;
}
