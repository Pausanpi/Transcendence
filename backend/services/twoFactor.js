import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class TwoFactorService {
    generateSecret(user) {
        const issuer = 'OAuthApp';
        const accountName = (user.email || user.username).replace(/[^a-zA-Z0-9@.]/g, '');

        const secret = speakeasy.generateSecret({
            name: `${issuer}:${accountName}`,
            issuer: issuer,
            length: 32
        });

        const base32 = secret.base32;
        const otpauthUrl =
                       + `?secret=${base32}`
            + `&issuer=${encodeURIComponent(issuer)}`
            + `&algorithm=SHA1&digits=6&period=300`;

        return {
            secret: base32,
            otpauth_url: otpauthUrl
        };
    }

    async generateQRCode(otpauthUrl) {
        try {
            return await QRCode.toDataURL(otpauthUrl, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 300
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('The QR code could not be generated.');
        }
    }

    verifyToken(secret, token, window = 1) {
        try {
            return speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: window,
                step: 30
            });
        } catch (error) {
            console.error('Error verifying token:', error);
            return false;
        }
    }

    generateBackupCodes(count = 8) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const part1 = Math.random().toString().substr(2, 5);
            const part2 = Math.random().toString().substr(2, 3);
            codes.push(`${part1}-${part2}`);
        }
        return codes;
    }

    verifyBackupCode(backupCodes, code) {
        return backupCodes.includes(code);
    }

    getCurrentToken(secret, time = null) {
        try {
            const cleanSecret = secret
                .replace(/\s/g, '')
                .toUpperCase();

            const options = {
                secret: cleanSecret,
                encoding: 'base32',
                step: 30
            };

            if (time) {
                options.time = time;
            }

            return speakeasy.totp(options);
        } catch (error) {
            console.error('Error getting current token:', error);
            return null;
        }
    }

    verifyTokenWithWindow(secret, token, window = 2) {
        try {
            const cleanSecret = secret
                .replace(/\s/g, '')
                .toUpperCase();

            const verified = speakeasy.totp.verify({
                secret: cleanSecret,
                encoding: 'base32',
                token: token,
                window: window,
                step: 30
            });

            return verified;
        } catch (error) {
            console.error('Error verifying token with window:', error);
            return false;
        }
    }

    getTimeInfo() {
        const now = Date.now();
        const unixTime = Math.floor(now / 1000);
        const step = 30;
        const currentStep = Math.floor(unixTime / step);
        const timeInStep = unixTime % step;
        const timeRemaining = step - timeInStep;

        return {
            unixTime,
            currentStep,
            timeInCurrentStep: timeInStep,
            secondsUntilNextCode: timeRemaining,
            localTime: new Date(now).toISOString()
        };
    }
}

export default new TwoFactorService();
