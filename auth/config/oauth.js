import GitHubStrategy from "passport-github2";
import dotenv from "dotenv";
import { findUserById } from '../../users/models/User.js';

dotenv.config();

export function configurePassport(passport) {
    passport.registerUserSerializer(async (user) => {
        console.log('Serializer called for user:', user?.id);
        return user?.id || user?.user?.id || null;
    });

    passport.registerUserDeserializer(async (id) => {
        console.log('Deserializer called for id:', id);
        try {
            const user = await findUserById(id);
            console.log('Deserialized user:', user?.id);
            return user;
        } catch (error) {
            console.error('Deserializer error:', error);
            return null;
        }
    });

    passport.use(
        'github',
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
                scope: ["user:email"],
                proxy: true
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    console.log('GitHub profile:', profile.id, profile.username);
                    const user = {
                        id: profile.id.toString(),
                        username: profile.username,
                        email: profile.emails?.[0]?.value || null,
                        avatar: profile.photos?.[0]?.value || null,
                        profileUrl: profile.profileUrl || `https://github.com/${profile.username}`,
                        twoFactorEnabled: false
                    };
                    console.log('Passport user created:', user.id);
                    return done(null, user);
                } catch (err) {
                    console.error('Passport strategy error:', err);
                    return done(err, null);
                }
            }
        )
    );

    return passport;
}