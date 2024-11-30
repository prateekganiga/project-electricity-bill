const BASE_URL = 'http://localhost:3000'; // Backend server URL

document.addEventListener('DOMContentLoaded', () => {
    // Handle Sign-Up Form Submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            fetch(`${BASE_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = 'login.html';
                    } else {
                        alert(data.message || 'Sign-Up failed');
                    }
                })
                .catch(err => console.error('Error:', err));
        });
    }

    // Handle Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('token', data.token);
                        alert('Login successful!');
                        window.location.href= "welcome.html"
                    } else {
                        document.getElementById('login-error').classList.remove('hidden');
                    }
                })
                .catch(err => console.error('Error:', err));
        });
    }
});
