export function renderTermsOfService(): string {
	return `
    <div class="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-8 px-2 sm:px-4">
      <div class="card">
        <h1 class="text-4xl font-bold mb-4 text-yellow-400">Terms of Service</h1>
        <p class="text-gray-400 mb-4"><strong>Last Updated:</strong> February 18, 2026</p>
        <p class="text-gray-300 mb-4">
          Welcome to Transcendence! These Terms of Service ("Terms") govern your access to and use of 
          the Transcendence online gaming platform. By creating an account or using our services, you 
          agree to be bound by these Terms.
        </p>
        <p class="text-gray-300 mb-4">
          <strong>Please read these Terms carefully before using our platform.</strong>
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">1. Acceptance of Terms</h2>
        <p class="text-gray-300 mb-4">
          By accessing or using Transcendence, you acknowledge that you have read, understood, and agree 
          to be bound by these Terms, as well as our <button onclick="navigate('privacy-policy')" class="text-yellow-400 hover:text-yellow-300 underline">Privacy Policy</button>. 
          If you do not agree to these Terms, you may not use our services.
        </p>
        <p class="text-gray-300 mb-4">
          We reserve the right to modify these Terms at any time. Continued use of the platform after 
          changes constitutes acceptance of the modified Terms.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">2. Eligibility</h2>
        <p class="text-gray-300 mb-4">
          You must meet the following requirements to use Transcendence:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Be at least 13 years of age</li>
          <li>If you are between 13 and 18, you should have parental or guardian consent</li>
          <li>Have the legal capacity to enter into binding agreements</li>
          <li>Not be prohibited from using the service under applicable laws</li>
          <li>Not have been previously banned or suspended from the platform</li>
        </ul>
        <p class="text-gray-300 mb-4">
          By using Transcendence, you represent and warrant that you meet these eligibility requirements.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">3. Account Registration and Security</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">3.1 Account Creation</h3>
        <p class="text-gray-300 mb-4">
          To access certain features, you must create an account by providing:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>A unique username</li>
          <li>A valid email address</li>
          <li>A secure password</li>
        </ul>
        <p class="text-gray-300 mb-4">
          Alternatively, you may register using OAuth authentication through supported third-party providers.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">3.2 Account Security</h3>
        <p class="text-gray-300 mb-4">You are responsible for:</p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Maintaining the confidentiality of your password and account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access or security breach</li>
          <li>Enabling Two-Factor Authentication (2FA) for enhanced security (strongly recommended)</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">3.3 Account Accuracy</h3>
        <p class="text-gray-300 mb-4">
          You agree to provide accurate, current, and complete information during registration and to 
          update such information to keep it accurate and current. Providing false information may result 
          in account termination.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">3.4 Account Sharing</h3>
        <p class="text-gray-300 mb-4">
          You may not share your account with others or allow others to access your account. Each account 
          is personal and non-transferable.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">4. Acceptable Use Policy</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">4.1 Permitted Use</h3>
        <p class="text-gray-300 mb-4">
          Transcendence is provided for personal, non-commercial entertainment purposes. You may:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Play Pong and other available games</li>
          <li>Participate in tournaments and competitions</li>
          <li>Connect with other players and add friends</li>
          <li>View leaderboards and player statistics</li>
          <li>Customize your profile with avatars</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">4.2 Prohibited Conduct</h3>
        <p class="text-gray-300 mb-4">You agree NOT to:</p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Cheat or exploit:</strong> Use bots, cheats, hacks, or exploits to gain unfair advantages</li>
          <li><strong>Harass others:</strong> Engage in harassment, bullying, hate speech, or threatening behavior</li>
          <li><strong>Spam:</strong> Send unsolicited messages or engage in disruptive behavior</li>
          <li><strong>Impersonate:</strong> Impersonate other users, staff, or any other person or entity</li>
          <li><strong>Violate laws:</strong> Use the platform for illegal activities or to violate applicable laws</li>
          <li><strong>Attack the system:</strong> Attempt to hack, DDoS, or compromise the platform's security</li>
          <li><strong>Scrape data:</strong> Use automated tools to extract data from the platform</li>
          <li><strong>Reverse engineer:</strong> Decompile, disassemble, or reverse engineer any part of the platform</li>
          <li><strong>Upload malware:</strong> Upload viruses, malware, or malicious code</li>
          <li><strong>Account manipulation:</strong> Create multiple accounts to manipulate rankings or abuse features</li>
          <li><strong>Inappropriate content:</strong> Upload offensive, explicit, or inappropriate avatars or content</li>
          <li><strong>Interfere with others:</strong> Disrupt the gaming experience of other users</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">5. User-Generated Content</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">5.1 Your Content</h3>
        <p class="text-gray-300 mb-4">
          You retain ownership of content you upload (such as profile avatars). However, by uploading 
          content, you grant Transcendence a non-exclusive, worldwide, royalty-free license to use, 
          display, and store such content for the purpose of operating the platform.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">5.2 Content Standards</h3>
        <p class="text-gray-300 mb-4">All user-generated content must:</p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Comply with applicable laws and regulations</li>
          <li>Not infringe on intellectual property rights of others</li>
          <li>Not contain explicit, offensive, or inappropriate material</li>
          <li>Not promote violence, discrimination, or illegal activities</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">5.3 Content Moderation</h3>
        <p class="text-gray-300 mb-4">
          We reserve the right to review, remove, or refuse any content that violates these Terms or 
          that we deem inappropriate, without prior notice.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">6. Game Rules and Fair Play</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">6.1 Fair Competition</h3>
        <p class="text-gray-300 mb-4">
          All players are expected to compete fairly. Cheating, match fixing, or any form of unfair 
          gameplay is strictly prohibited and will result in penalties.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">6.2 Match Results</h3>
        <p class="text-gray-300 mb-4">
          Match results are recorded automatically and are final. We may review and correct results only 
          in cases of technical errors or proven cheating.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">6.3 Rankings and Leaderboards</h3>
        <p class="text-gray-300 mb-4">
          Rankings are calculated based on match performance. We reserve the right to adjust rankings 
          if manipulation or cheating is detected.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">6.4 Tournaments</h3>
        <p class="text-gray-300 mb-4">
          Tournament participation is subject to specific rules that will be communicated for each event. 
          Violations may result in disqualification.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">7. Intellectual Property</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">7.1 Our Rights</h3>
        <p class="text-gray-300 mb-4">
          All content, features, and functionality of Transcendence, including but not limited to:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Software code and architecture</li>
          <li>Game mechanics and design</li>
          <li>Graphics, logos, and trademarks</li>
          <li>Text, images, and other materials</li>
        </ul>
        <p class="text-gray-300 mb-4">
          are owned by Transcendence and are protected by copyright, trademark, and other intellectual 
          property laws. All rights not expressly granted are reserved.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">7.2 Limited License</h3>
        <p class="text-gray-300 mb-4">
          We grant you a limited, non-exclusive, non-transferable, revocable license to access and use 
          Transcendence for personal, non-commercial purposes in accordance with these Terms.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">7.3 Restrictions</h3>
        <p class="text-gray-300 mb-4">You may not:</p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Copy, modify, or create derivative works of the platform</li>
          <li>Distribute, sell, or transfer any part of the platform</li>
          <li>Remove or modify any copyright, trademark, or proprietary notices</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">8. Termination and Suspension</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">8.1 Termination by You</h3>
        <p class="text-gray-300 mb-4">
          You may terminate your account at any time through the <button onclick="navigate('gdpr')" class="text-yellow-400 hover:text-yellow-300 underline">Privacy & Data Management</button> 
          page. Upon termination, your personal data will be deleted or anonymized in accordance with 
          our Privacy Policy.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">8.2 Termination by Us</h3>
        <p class="text-gray-300 mb-4">
          We reserve the right to suspend or terminate your account immediately, without prior notice, if:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>You violate these Terms of Service</li>
          <li>You engage in prohibited conduct or cheating</li>
          <li>Your account is used for fraudulent or illegal activities</li>
          <li>We are required to do so by law</li>
          <li>Continuing your access would harm other users or the platform</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">8.3 Effects of Termination</h3>
        <p class="text-gray-300 mb-4">
          Upon termination:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Your right to access the platform immediately ceases</li>
          <li>Your account data will be handled according to our Privacy Policy</li>
          <li>Match history may be retained in anonymized form for leaderboard integrity</li>
          <li>Any pending friend requests or connections will be removed</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">8.4 Appeals</h3>
        <p class="text-gray-300 mb-4">
          If you believe your account was suspended or terminated in error, you may contact us to appeal 
          the decision. We will review appeals on a case-by-case basis.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">9. Disclaimers and Limitations of Liability</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">9.1 Service "AS IS"</h3>
        <p class="text-gray-300 mb-4">
          Transcendence is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either 
          express or implied, including but not limited to:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Warranties of merchantability or fitness for a particular purpose</li>
          <li>Warranties of uninterrupted or error-free service</li>
          <li>Warranties regarding the accuracy or reliability of content</li>
          <li>Warranties that the service will meet your requirements</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">9.2 Service Availability</h3>
        <p class="text-gray-300 mb-4">
          We do not guarantee that the platform will be available at all times. We may experience:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Scheduled maintenance and downtime</li>
          <li>Technical issues or server problems</li>
          <li>Updates or modifications to the service</li>
        </ul>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">9.3 Limitation of Liability</h3>
        <p class="text-gray-300 mb-4">
          To the maximum extent permitted by law, Transcendence and its operators shall not be liable for:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Any indirect, incidental, special, consequential, or punitive damages</li>
          <li>Loss of profits, data, or goodwill</li>
          <li>Service interruptions or errors</li>
          <li>Actions or content of other users</li>
          <li>Unauthorized access to your account</li>
        </ul>
        <p class="text-gray-300 mb-4">
          Our total liability to you for any claims arising from or related to these Terms or your use 
          of the platform shall not exceed €100 or the amount you paid to us (if any) in the past 12 months.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">9.4 User Responsibility</h3>
        <p class="text-gray-300 mb-4">
          You are solely responsible for:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Your interactions with other users</li>
          <li>Content you upload or share</li>
          <li>Your compliance with these Terms</li>
          <li>Any consequences of your actions on the platform</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">10. Indemnification</h2>
        <p class="text-gray-300 mb-4">
          You agree to indemnify, defend, and hold harmless Transcendence, its operators, and affiliates 
          from any claims, damages, liabilities, and expenses (including legal fees) arising from:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Your violation of these Terms</li>
          <li>Your violation of any applicable laws or regulations</li>
          <li>Your infringement of any third-party rights</li>
          <li>Your use or misuse of the platform</li>
          <li>Content you upload or share</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">11. Privacy and Data Protection</h2>
        <p class="text-gray-300 mb-4">
          Your privacy is important to us. Please review our <button onclick="navigate('privacy-policy')" class="text-yellow-400 hover:text-yellow-300 underline">Privacy Policy</button> 
          to understand how we collect, use, and protect your personal information.
        </p>
        <p class="text-gray-300 mb-4">
          By using Transcendence, you consent to the collection and use of your information as described 
          in the Privacy Policy. You have extensive privacy rights under GDPR and other applicable laws, 
          which you can exercise through our Privacy & Data Management page.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">12. Dispute Resolution</h2>
        
        <h3 class="text-xl font-semibold mb-3 text-gray-200">12.1 Informal Resolution</h3>
        <p class="text-gray-300 mb-4">
          If you have a dispute with us, please contact us first at support@transcendence.local to attempt 
          to resolve the issue informally.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">12.2 Governing Law</h3>
        <p class="text-gray-300 mb-4">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
          in which Transcendence operates, without regard to conflict of law principles.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">12.3 Jurisdiction</h3>
        <p class="text-gray-300 mb-4">
          Any legal action or proceeding arising from these Terms shall be brought exclusively in the courts 
          of competent jurisdiction in our operating location, and you consent to the personal jurisdiction 
          of such courts.
        </p>

        <h3 class="text-xl font-semibold mb-3 text-gray-200">12.4 EU Users</h3>
        <p class="text-gray-300 mb-4">
          For users in the European Union, nothing in these Terms affects your statutory rights as a consumer 
          under EU consumer protection laws.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">13. Modifications to the Service</h2>
        <p class="text-gray-300 mb-4">
          We reserve the right to:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>Modify, suspend, or discontinue any aspect of the platform at any time</li>
          <li>Add or remove features and functionality</li>
          <li>Change game rules or mechanics</li>
          <li>Update system requirements</li>
        </ul>
        <p class="text-gray-300 mb-4">
          We will make reasonable efforts to notify users of significant changes, but we are not obligated 
          to provide advance notice for all modifications.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">14. Third-Party Services</h2>
        <p class="text-gray-300 mb-4">
          Transcendence may integrate with third-party services, including:
        </p>
        <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2 ml-4">
          <li>OAuth authentication providers</li>
          <li>Monitoring and analytics tools</li>
        </ul>
        <p class="text-gray-300 mb-4">
          Your use of third-party services is subject to their respective terms and conditions. We are 
          not responsible for third-party services or their privacy practices.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">15. Severability</h2>
        <p class="text-gray-300 mb-4">
          If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining 
          provisions shall continue in full force and effect. The invalid provision shall be modified to 
          the minimum extent necessary to make it valid and enforceable.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">16. Entire Agreement</h2>
        <p class="text-gray-300 mb-4">
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
          Transcendence regarding your use of the platform and supersede all prior agreements and understandings.
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">17. Contact Information</h2>
        <p class="text-gray-300 mb-4">
          If you have questions or concerns about these Terms of Service, please contact us:
        </p>
        <ul class="list-none text-gray-300 mb-4 space-y-2 ml-4">
          <li><strong>Email:</strong> support@transcendence.local</li>
          <li><strong>Legal inquiries:</strong> legal@transcendence.local</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-yellow-400">18. Acknowledgment</h2>
        <p class="text-gray-300 mb-4">
          By using Transcendence, you acknowledge that you have read, understood, and agree to be bound 
          by these Terms of Service.
        </p>
        <p class="text-gray-300 mb-4 font-bold">
          Thank you for being part of the Transcendence community. Enjoy the game! 🎮
        </p>
      </div>

      <div class="card">
        <div class="flex flex-wrap gap-4 justify-center">
          <button onclick="navigate('privacy-policy')" class="btn btn-yellow">
            🔒 View Privacy Policy
          </button>
          <button onclick="navigate('gdpr')" class="btn btn-blue">
            ⚙️ Manage Your Data
          </button>
          <button onclick="navigate('home')" class="btn btn-gray">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  `;
}
