class AdminUsersManager {
	constructor() {
		this.users = [];
		this.init();
	}

	init() {
		this.loadUsers();
		document.getElementById('refreshUsers').addEventListener('click', () => this.loadUsers());
	}

	async loadUsers() {
		const loadingElement = document.getElementById('loadingMessage');
		const tableElement = document.getElementById('usersTable');
		loadingElement.style.display = 'block';
		tableElement.style.display = 'none';

		try {
			const response = await fetch('/users/users/list', {
				credentials: 'include', 
				headers: { 'Authorization': `Bearer ${this.getToken()}` }
			});

			if (response.status === 403) {
				this.showError('Access denied. Admin rights required.');
				return;
			}

			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			const result = await response.json();

			if (result.success) {
				this.users = result.users;
				this.renderUsersTable();
			} else {
				this.showError('Error loading users data');
			}
		} catch (error) {
			console.error('Error loading users:', error);
			this.showError('Connection error. Please try again.');
		} finally {
			loadingElement.style.display = 'none';
		}
	}

	getToken() {
		return localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || '';
	}

	renderUsersTable() {
		const tableElement = document.getElementById('usersTable');
		if (this.users.length === 0) {
			tableElement.innerHTML = '<div class="no-data">No users found in database</div>';
			tableElement.style.display = 'block';
			return;
		}

		const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>2FA</th>
                        <th>Status</th>
                        <th>Provider</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                  ${this.users.map(user => `
        <tr>
            <td><code>${user.id}</code></td>
            <td>${this.escapeHtml(user.username)}</td>
            <td>${this.escapeHtml(user.email)}</td>
            <td>
                <span class="badge ${Boolean(user.twoFactorEnabled) ? 'badge-success' : 'badge-warning'}">
                    ${Boolean(user.twoFactorEnabled) ? 'Enabled' : 'Disabled'}
                </span>
            </td>
            <!-- ... resto del código ... -->
        </tr>
    `).join('')}
                </tbody>
            </table>
        `;
		tableElement.innerHTML = tableHTML;
		tableElement.style.display = 'block';
	}

	showError(message) {
		const tableElement = document.getElementById('usersTable');
		tableElement.innerHTML = `<div class="error-message">${message}</div>`;
		tableElement.style.display = 'block';
	}

	escapeHtml(unsafe) {
		if (unsafe === null || unsafe === undefined) return 'N/A';
		return unsafe.toString()
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new AdminUsersManager();
});
