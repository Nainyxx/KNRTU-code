// Registration Page Logic
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const body = document.body;
    const registrationForm = document.getElementById('registrationForm');
    const usernameInput = document.getElementById('username');
    const characterName = document.getElementById('characterName');
    
    // Theme Toggle Functionality
    function initTheme() {
        // Проверяем сохраненную тему или устанавливаем темную по умолчанию
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
    
    // Update character name in real-time
    usernameInput.addEventListener('input', function() {
        const name = this.value.trim() || 'Новый Игрок';
        characterName.textContent = name;
    });
    
    // Form Submission
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Validation
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают!', 'error');
            return;
        }
        
        if (password.length < 8) {
            showNotification('Пароль должен быть не менее 8 символов', 'error');
            return;
        }
        
        if (!agreeTerms) {
            showNotification('Необходимо принять условия использования', 'error');
            return;
        }
        
        // Show success animation
        const xpProgress = document.querySelector('.xp-progress');
        xpProgress.style.width = '100%';
        
        showNotification('Персонаж создан! Добро пожаловать в Habitica! 🎮', 'success');
        
        // Simulate registration process
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
    
    // Social buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            showNotification('Функция скоро будет доступна!', 'info');
        });
    });
    
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
});

