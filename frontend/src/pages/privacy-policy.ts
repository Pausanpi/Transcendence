export function renderPrivacyPolicy(): string {
	return `
    <div class="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-8 px-2 sm:px-4">
      <div class="card">
        <h1 class="text-4xl font-bold mb-4 text-yellow-400">Privacy Policy</h1>
        <p class="text-gray-400 mb-4"><strong>Last Updated:</strong> February 18, 2026</p>
        <p class="text-gray-300 mb-4">
          At Transcendence, we take your privacy seriously. This Privacy Policy explains how we collect, 
          use, disclose, and safeguard your information when you use our online Pong gaming platform.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">1. Information We Collect</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">1.1 Account Information</h3>
        <p class="text-gray-300 mb-4">
          When you create an account, we collect:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Username:</strong> Your chosen display name</li>
          <li><strong>Email address:</strong> For account verification and communication</li>
          <li><strong>Password:</strong> Stored securely using industry-standard hashing (bcrypt)</li>
          <li><strong>Profile avatar:</strong> Optional image you upload</li>
          <li><strong>Two-Factor Authentication (2FA) data:</strong> If you enable 2FA for enhanced security</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">1.2 OAuth Authentication</h3>
        <p class="text-gray-300 mb-4">
          If you choose to authenticate via OAuth providers (such as 42 School, Google, or other third-party services), 
          we receive:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Your OAuth provider ID</li>
          <li>Basic profile information (name, email) as permitted by the provider</li>
          <li>Profile picture from the OAuth provider</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">1.3 Gaming Data</h3>
        <p class="text-gray-300 mb-4">
          We automatically collect and store gameplay information:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Match history:</strong> Records of games played, scores, opponents, and timestamps</li>
          <li><strong>Tournament participation:</strong> Your participation in tournaments and results</li>
          <li><strong>Game statistics:</strong> Win/loss ratios, performance metrics</li>
          <li><strong>Player rankings:</strong> Your competitive ranking and leaderboard position</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">1.4 Social Features</h3>
        <p class="text-gray-300 mb-4">
          When you use our social features, we collect:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Friend connections:</strong> List of players you've added as friends</li>
          <li><strong>Friend requests:</strong> Pending and accepted friend requests</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">1.5 Technical Information</h3>
        <p class="text-gray-300 mb-4">
          We automatically collect technical data:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Session data:</strong> Login times, session duration, and activity logs</li>
          <li><strong>IP addresses:</strong> For security and fraud prevention</li>
          <li><strong>Browser information:</strong> Browser type, version, and language preferences</li>
          <li><strong>Cookies:</strong> Essential cookies for authentication and preferences (see Cookie Policy below)</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">2. How We Use Your Information</h2>
        <p class="text-gray-300 mb-4">We use the collected information for:</p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Account Management:</strong> Creating and maintaining your account</li>
          <li><strong>Authentication:</strong> Verifying your identity and maintaining secure sessions</li>
          <li><strong>Game Functionality:</strong> Enabling gameplay, matchmaking, and tournament features</li>
          <li><strong>Leaderboards & Rankings:</strong> Displaying player statistics and competitive rankings</li>
          <li><strong>Social Features:</strong> Facilitating friend connections and social interactions</li>
          <li><strong>Communication:</strong> Sending important account-related notifications</li>
          <li><strong>Security:</strong> Detecting and preventing fraud, abuse, and unauthorized access</li>
          <li><strong>Service Improvement:</strong> Analyzing usage patterns to improve our platform</li>
          <li><strong>Legal Compliance:</strong> Meeting legal obligations and enforcing our Terms of Service</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">3. Legal Basis for Processing (GDPR)</h2>
        <p class="text-gray-300 mb-4">
          For users in the European Union, we process your personal data under the following legal bases:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Contractual Necessity:</strong> To provide the gaming service you've signed up for</li>
          <li><strong>Legitimate Interests:</strong> To improve our services, ensure security, and prevent fraud</li>
          <li><strong>Consent:</strong> For optional features like analytics (where required)</li>
          <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">4. Data Sharing and Disclosure</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">4.1 We DO NOT Sell Your Data</h3>
        <p class="text-gray-300 mb-4">
          We do not sell, rent, or trade your personal information to third parties for marketing purposes.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">4.2 Public Information</h3>
        <p class="text-gray-300 mb-4">
          The following information is publicly visible to other users:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Username and avatar</li>
          <li>Match history and game statistics</li>
          <li>Player rankings and leaderboard position</li>
          <li>Tournament participation</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">4.3 Service Providers</h3>
        <p class="text-gray-300 mb-4">
          We may share data with trusted service providers who assist us:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>OAuth Providers:</strong> For third-party authentication</li>
          <li><strong>Hosting Services:</strong> To store and serve our application</li>
          <li><strong>Monitoring Tools:</strong> For performance monitoring and error tracking (Prometheus, Grafana)</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">4.4 Legal Requirements</h3>
        <p class="text-gray-300 mb-4">
          We may disclose your information if required by law, court order, or to protect our rights and safety.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">5. Data Security</h2>
        <p class="text-gray-300 mb-4">
          We implement robust security measures to protect your data:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Encryption:</strong> SSL/TLS encryption for data in transit</li>
          <li><strong>Password Protection:</strong> Bcrypt hashing for password storage</li>
          <li><strong>Vault Integration:</strong> Secure storage for sensitive credentials using HashiCorp Vault</li>
          <li><strong>Two-Factor Authentication:</strong> Optional 2FA for enhanced account security</li>
          <li><strong>Session Management:</strong> Secure JWT tokens with expiration</li>
          <li><strong>Security Headers:</strong> Implementation of CORS, CSP, and other security headers</li>
          <li><strong>Rate Limiting:</strong> Protection against brute force attacks</li>
          <li><strong>ModSecurity:</strong> Web application firewall for threat prevention</li>
        </ul>
        <p class="text-gray-300 mb-4">
          However, no method of transmission over the internet is 100% secure. While we strive to protect 
          your data, we cannot guarantee absolute security.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">6. Cookie Policy</h2>
        <p class="text-gray-300 mb-4">
          We use cookies and similar technologies for:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Essential Cookies:</strong> Required for authentication and session management</li>
          <li><strong>Preference Cookies:</strong> Storing your language and theme preferences</li>
          <li><strong>Security Cookies:</strong> Preventing fraud and enhancing security</li>
        </ul>
        <p class="text-gray-300 mb-4">
          You can control cookies through your browser settings, but disabling essential cookies may 
          prevent you from using certain features.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">7. Data Retention</h2>
        <p class="text-gray-300 mb-4">
          We retain your personal data for as long as necessary to provide our services and comply with legal obligations:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
          <li><strong>Inactive Accounts:</strong> Data retained for 2 years after last login, then anonymized or deleted</li>
          <li><strong>Match History:</strong> Retained indefinitely for leaderboard integrity (anonymized if you delete your account)</li>
          <li><strong>Security Logs:</strong> Retained for 90 days</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">8. Your Privacy Rights</h2>
        <p class="text-gray-300 mb-4">
          You have the following rights regarding your personal data:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
          <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("Right to be Forgotten")</li>
          <li><strong>Right to Data Portability:</strong> Export your data in a machine-readable format</li>
          <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
          <li><strong>Right to Restriction:</strong> Request restriction of processing</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
        </ul>
        <p class="text-gray-300 mb-4">
          You can exercise these rights through the <button onclick="navigate('gdpr')" class="text-yellow-400 hover:text-yellow-300 underline">Privacy & Data Management</button> 
          page in your profile, where you can:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Export all your personal data</li>
          <li>Manage your privacy preferences</li>
          <li>Anonymize your account data</li>
          <li>Delete your account permanently</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">9. Children's Privacy</h2>
        <p class="text-gray-300 mb-4">
          Transcendence is not intended for users under the age of 13. We do not knowingly collect 
          personal information from children under 13. If we become aware that a child under 13 has 
          provided us with personal information, we will take steps to delete such information.
        </p>
        <p class="text-gray-300 mb-4">
          For users between 13 and 18, we recommend obtaining parental consent before using our services.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">10. International Data Transfers</h2>
        <p class="text-gray-300 mb-4">
          Your data may be transferred to and processed in countries other than your country of residence. 
          We ensure appropriate safeguards are in place to protect your personal information in accordance 
          with this Privacy Policy and applicable data protection laws.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">11. Third-Party Links</h2>
        <p class="text-gray-300 mb-4">
          Our platform may contain links to third-party websites or services (such as OAuth providers). 
          We are not responsible for the privacy practices of these third parties. We encourage you to 
          review their privacy policies.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">12. Changes to This Privacy Policy</h2>
        <p class="text-gray-300 mb-4">
          We may update this Privacy Policy from time to time. We will notify you of significant changes by:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Updating the "Last Updated" date at the top of this policy</li>
          <li>Posting a notice on our platform</li>
          <li>Sending an email notification for material changes</li>
        </ul>
        <p class="text-gray-300 mb-4">
          Your continued use of Transcendence after changes are posted constitutes acceptance of the updated policy.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">13. Contact Us</h2>
        <p class="text-gray-300 mb-4">
          If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
        </p>
        <ul class="list-none text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Email:</strong> privacy@transcendence.local</li>
          <li><strong>Data Protection Officer:</strong> dpo@transcendence.local</li>
        </ul>
        <p class="text-gray-300 mb-4">
          For EU residents: If you believe we have not adequately addressed your concerns, you have the 
          right to lodge a complaint with your local data protection authority.
        </p>
      </div>

      <div class="card">
        <div class="flex flex-wrap gap-4 justify-center">
          <button onclick="navigate('terms-of-service')" class="btn btn-yellow">
            📜 View Terms of Service
          </button>
          <button onclick="navigate('gdpr')" class="btn btn-blue">
            🔒 Manage Your Privacy
          </button>
          <button onclick="navigate('home')" class="btn btn-gray">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  `;
}
