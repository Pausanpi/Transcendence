import { api, getToken, showResult, getHeaders } from '../api.js';

export function renderProfile(): string {
  setTimeout(loadProfile, 100);
  
  return `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="card">
        <h3 class="text-2xl font-bold mb-4">Profile</h3>
        <div id="profileInfo">Loading...</div>
        <div class="grid grid-cols-2 gap-4 mt-4">
          <input id="displayName" placeholder="Display Name" class="input" />
          <input id="avatar" placeholder="Avatar URL" class="input" />
        </div>
        <button onclick="updateProfile()" class="btn btn-blue mt-4">Update</button>
        <div id="profileResult" class="hidden"></div>
      </div>
      
      <div class="card">
        <h3 class="text-2xl font-bold mb-4 text-red-400">Danger Zone</h3>
        <input id="confirmPwd" type="password" placeholder="Password" class="input mb-4" />
        <div class="flex gap-4">
          <button onclick="anonymize()" class="btn btn-red flex-1">Anonymize</button>
          <button onclick="deleteAcc()" class="btn btn-red flex-1">Delete</button>
        </div>
        <div id="dangerResult" class="hidden"></div>
      </div>
    </div>
  `;
}

async function loadProfile(): Promise<void> {
  if (!getToken()) {
    document.getElementById('profileInfo')!.textContent = 'Please login';
    return;
  }
  
  try {
    const data = await api<any>('/api/users/profile');
    document.getElementById('profileInfo')!.innerHTML = `
      <p><b>Username:</b> ${data.username}</p>
      <p><b>Email:</b> ${data.email}</p>
    `;
  } catch {
    document.getElementById('profileInfo')!.textContent = 'Failed to load';
  }
}

async function updateProfile(): Promise<void> {
  const displayName = (document.getElementById('displayName') as HTMLInputElement).value;
  const avatar = (document.getElementById('avatar') as HTMLInputElement).value;
  
  const data = await api<any>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ displayName, avatar })
  });
  showResult('profileResult', data);
  loadProfile();
}

async function anonymize(): Promise<void> {
  if (!confirm('Are you sure?')) return;
  const confirmPassword = (document.getElementById('confirmPwd') as HTMLInputElement).value;
  
  const data = await api<any>('/api/users/gdpr/anonymize', {
    method: 'POST',
    body: JSON.stringify({ confirmPassword })
  });
  showResult('dangerResult', data);
}

async function deleteAcc(): Promise<void> {
  if (!confirm('DELETE permanently?')) return;
  const confirmPassword = (document.getElementById('confirmPwd') as HTMLInputElement).value;
  
  const data = await api<any>('/api/users/gdpr/delete', {
    method: 'DELETE',
    body: JSON.stringify({ confirmPassword })
  });
  showResult('dangerResult', data);
}

// Global
(window as any).updateProfile = updateProfile;
(window as any).anonymize = anonymize;
(window as any).deleteAcc = deleteAcc;