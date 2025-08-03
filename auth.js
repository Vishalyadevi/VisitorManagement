class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.isLoggedIn() && window.location.pathname !== 'dashboard.html') {
            window.location.href = 'dashboard.html';
            return;
        }

        // Check if user is not logged in and trying to access dashboard
        if (!this.isLoggedIn() && window.location.pathname === 'dashboard.html') {
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const loginBtn = document.querySelector('.login-btn');
        const errorDiv = document.getElementById('loginError');

        // Clear previous errors
        this.hideError();

        // Validate inputs
        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

        // Show loading state
        this.showLoading(loginBtn);

        // Simulate API call delay
        await this.delay(1500);

        // Simple authentication (in real app, this would be server-side)
        if (username === 'admin' && password === 'admin123') {
            // Store authentication
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loginTime', new Date().toISOString());
            localStorage.setItem('adminUsername', username);

            // Success animation
            this.showSuccess(loginBtn);
            
            // Redirect after brief delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            // Hide loading and show error
            this.hideLoading(loginBtn);
            this.showError('Invalid username or password. Please try again.');
            
            // Shake animation for error
            loginBtn.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                loginBtn.style.animation = '';
            }, 500);
        }
    }

    handleLogout() {
        // Show confirmation
        if (confirm('Are you sure you want to logout?')) {
            // Clear authentication
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loginTime');
            localStorage.removeItem('adminUsername');
            
            // Redirect to login
            window.location.href = 'index.html';
        }
    }

    isLoggedIn() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const loginTime = localStorage.getItem('loginTime');
        
        if (!isLoggedIn || !loginTime) {
            return false;
        }

        // Check if session has expired (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            this.handleLogout();
            return false;
        }

        return true;
    }

    showLoading(button) {
        button.classList.add('loading');
        button.disabled = true;
        const loader = button.querySelector('.btn-loader');
        if (loader) {
            loader.style.display = 'block';
        }
    }

    hideLoading(button) {
        button.classList.remove('loading');
        button.disabled = false;
        const loader = button.querySelector('.btn-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showSuccess(button) {
        button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        button.innerHTML = '<span>✓ Login Successful</span>';
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }
    }

    hideError() {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getAdminUsername() {
        return localStorage.getItem('adminUsername') || 'Admin';
    }
}

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize Auth Manager
const authManager = new AuthManager();

// Export for use in other files
window.authManager = authManager;
