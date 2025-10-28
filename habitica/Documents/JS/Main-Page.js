// Переключение темы
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const body = document.body;
    const header = document.querySelector('.header');
    
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Обработчик клика по переключателю
    themeToggle.addEventListener('click', function() {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
});

// Основная логика для трекера привычек
document.addEventListener('DOMContentLoaded', function() {
    // Плавная прокрутка
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Анимация появления элементов
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Анимируем карточки и квесты
    const animatedElements = document.querySelectorAll('.feature-card, .about-card, .quest');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Интерактивные квесты
    const quests = document.querySelectorAll('.quest');
    quests.forEach(quest => {
        quest.addEventListener('click', function() {
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                showNotification('Задание отменено ❌', 'info');
            } else {
                this.classList.add('active');
                showNotification('Задание выполнено! +10 XP 🎉', 'success');
                
                // Анимация прогресса
                const xpBar = document.querySelector('.xp-progress');
                const currentWidth = parseInt(xpBar.style.width) || 30;
                const newWidth = Math.min(currentWidth + 10, 100);
                xpBar.style.width = newWidth + '%';
                
                if (newWidth === 100) {
                    showNotification('Уровень повышен! 🏆', 'success');
                    setTimeout(() => {
                        xpBar.style.width = '0%';
                    }, 2000);
                }
            }
        });
    });

    // Динамическая шапка
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(15, 15, 15, 0.95)';
        } else {
            header.style.background = 'rgba(15, 15, 15, 0.8)';
        }
    });
});

// Функции для модального окна
function showAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'block';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
}

function scrollToFeatures() {
    document.getElementById('features').scrollIntoView({
        behavior: 'smooth'
    });
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--gradient)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        font-weight: 500;
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

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        closeAuthModal();
    }
});

// Демо-функция для кнопок авторизации
document.addEventListener('DOMContentLoaded', function() {
    const authButtons = document.querySelectorAll('.auth-btn');
    authButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            showNotification('Регистрация скоро будет доступна! 🚀', 'success');
            closeAuthModal();
        });
    });
});

