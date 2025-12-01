
function showToast(message, type = 'success', duration = 5000) {
	const toast = document.createElement('div');
	toast.className = `toast-message toast-${type}`;
	toast.textContent = message;
	toast.setAttribute('role', 'alert');

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.classList.add('toast-fade-out');
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 500);
	}, duration);

	toast.addEventListener('click', () => {
		toast.classList.add('toast-fade-out');
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 500);
	});

	return toast;
}

function showMessage(message, type = 'success') {
	return showToast(message, type);
}

function showError(message) {
	return showToast(message, 'error');
}
