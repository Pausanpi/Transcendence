export function renderAuth(): string {
  return `
    <div class="max-w-md mx-auto space-y-6">
      <div class="card">
        <h3 class="text-2xl font-bold mb-4 text-center">Login</h3>
        <input id="loginEmail" type="email" placeholder="Email" class="input mb-3" />
        <input id="loginPassword" type="password" placeholder="Password" class="input mb-4" />
        <button onclick="login()" class="btn btn-blue w-full">Login</button>
        <div id="loginResult" class="hidden"></div>
      </div>
      
      <div class="card">
        <h3 class="text-2xl font-bold mb-4 text-center">Register</h3>
        <input id="regUsername" type="text" placeholder="Username" class="input mb-3" />
        <input id="regEmail" type="email" placeholder="Email" class="input mb-3" />
        <input id="regPassword" type="password" placeholder="Password" class="input mb-4" />
        <button onclick="register()" class="btn btn-green w-full">Register</button>
        <div id="registerResult" class="hidden"></div>
      </div>
    </div>
  `;
}