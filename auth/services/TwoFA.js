import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class TwoFAService {
  generateSecret(user) {
    const issuer = 'Transcendence';
    const accountName = (user.email || user.username).replace(/[^a-zA-Z0-9@.]/g, '');

    const secret = speakeasy.generateSecret({
      name: `${issuer}:${accountName}`,
      issuer: issuer,
      length: 32
    });

    const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret.base32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    return {
      secret: secret.base32,
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
      throw new Error('Could not generate QR code');
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
}

export default new TwoFAService();