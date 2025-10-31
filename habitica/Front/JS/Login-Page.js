// Login Page Logic
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const body = document.body;
    const loginForm = document.getElementById('loginForm');
    
    // Theme Toggle Functionality
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }
    
    function updateThemeIcon(theme) {
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    // Инициализируем тему при загрузке
    initTheme();
    
    // Form Submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Basic validation
        if (!email || !password) {
            showNotification('Заполните все поля', 'error');
            return;
        }
        
        // Simulate login process
        showNotification('Вход выполнен! Возвращаемся в игру...', 'success');
        
        // Show loading animation on XP bar
        const xpProgress = document.querySelector('.xp-progress');
        xpProgress.style.width = '100%';
        
        // Redirect to main page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
        // Save remember me preference
        if (rememberMe) {
            localStorage.setItem('rememberLogin', 'true');
        }
    });
    
    // Social buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            showNotification('Функция скоро будет доступна!', 'info');
        });
    });
    
    // Auto-fill demo credentials for testing
    const demoLogin = document.getElementById('demoLogin');
    if (demoLogin) {
        demoLogin.addEventListener('click', function() {
            document.getElementById('loginEmail').value = 'demo@habitica.com';
            document.getElementById('loginPassword').value = 'demopassword123';
            showNotification('Демо данные заполнены!', 'info');
        });
    }
    
    // Notification function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--primary-green)' : type === 'error' ? '#EF4444' : 'var(--gradient)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            font-weight: 500;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Check if user wanted to be remembered
    if (localStorage.getItem('rememberLogin') === 'true') {
        document.getElementById('rememberMe').checked = true;
    }
});