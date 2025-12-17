// Трекер привычек Habitica
class HabitTracker {
    constructor() {
        this.user = null;
        this.habits = [];
        this.init();
    }

    async init() {
        await this.loadFromStorage();
        this.setupEventListeners();
        await this.render();
    }

    async loadFromStorage() {
        // Проверяем наличие токена
        if (window.api && window.api.token) {
            try {
                const profile = await window.api.getProfile();
                this.user = profile.user;
            } catch (error) {
                console.warn('Ошибка загрузки профиля:', error);
                window.api.clearAuth();
            }
        }

        // Загружаем тему
        const savedTheme = localStorage.getItem('habitica_theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    async loadHabits() {
        if (this.user) {
            try {
                this.habits = await window.api.getHabits();
                return true;
            } catch (error) {
                console.error('Ошибка загрузки привычек:', error);
                return false;
            }
        }
        return false;
    }

    setupEventListeners() {
        // Кнопка темы
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Кнопка входа
        document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal());
        
        // Кнопки добавления привычки
        document.getElementById('addHabitBtn').addEventListener('click', () => this.showModal('habitModal'));
        document.getElementById('createFirstHabit')?.addEventListener('click', () => this.showModal('habitModal'));
        
        // Закрытие модалок
        document.getElementById('closeAuthModal').addEventListener('click', () => this.closeModal('authModal'));
        document.getElementById('closeHabitModal').addEventListener('click', () => this.closeModal('habitModal'));
        document.getElementById('cancelHabit').addEventListener('click', () => this.closeModal('habitModal'));
        
        // Табы авторизации
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });
        
        // Формы
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('habitForm').addEventListener('submit', (e) => this.handleAddHabit(e));
        
        // Клик вне модалки
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('habitica_theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    showAuthModal() {
        if (this.user) {
            // Если пользователь уже вошел, показываем меню выхода
            if (confirm('Вы хотите выйти?')) {
                this.logout();
            }
        } else {
            this.showModal('authModal');
            this.switchAuthTab('login');
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        // Сбрасываем формы
        if (modalId === 'habitModal') {
            document.getElementById('habitForm').reset();
        }
        if (modalId === 'authModal') {
            document.getElementById('loginForm').reset();
            document.getElementById('registerForm').reset();
        }
    }

    switchAuthTab(tab) {
        // Обновляем активные кнопки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) btn.classList.add('active');
        });
        
        // Показываем нужную форму
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
            if (form.id === `${tab}Form`) form.classList.add('active');
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
        
        try {
            const result = await window.api.login(email, password);
            this.user = result.user;
            await this.loadHabits();
            this.closeModal('authModal');
            this.showNotification('Вход выполнен!', 'success');
            await this.render();
        } catch (error) {
            this.showNotification(error.message || 'Ошибка входа', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        if (!name || !email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        try {
            const result = await window.api.register(name, email, password);
            this.user = result.user;
            await this.loadHabits();
            this.closeModal('authModal');
            this.showNotification('Регистрация успешна!', 'success');
            await this.render();
        } catch (error) {
            this.showNotification(error.message || 'Ошибка регистрации', 'error');
        }
    }

    async handleAddHabit(e) {
        e.preventDefault();
        const name = document.getElementById('habitName').value;
        const description = document.getElementById('habitDescription').value;
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        const goal = document.querySelector('input[name="goal"]:checked').value;
        
        if (!name) {
            this.showNotification('Введите название привычки', 'error');
            return;
        }
        
        try {
            const habit = await window.api.createHabit({
                name,
                description,
                difficulty,
                goal
            });
            
            await this.loadHabits();
            this.closeModal('habitModal');
            this.showNotification('Привычка добавлена!', 'success');
            await this.render();
        } catch (error) {
            this.showNotification(error.message || 'Ошибка создания привычки', 'error');
        }
    }

    async completeHabit(habitId) {
        try {
            const result = await window.api.completeHabit(habitId);
            
            // Добавляем XP
            const habit = this.habits.find(h => h.id === habitId);
            if (habit) {
                await window.api.addXP(habit.xp);
                await this.loadFromStorage(); // Обновляем пользователя
            }
            
            await this.loadHabits();
            this.showNotification(`+${habit?.xp || 10} XP! Привычка выполнена`, 'success');
            await this.render();
        } catch (error) {
            this.showNotification(error.message || 'Ошибка выполнения привычки', 'error');
        }
    }

    async skipHabit(habitId) {
        try {
            await window.api.skipHabit(habitId);
            await this.loadHabits();
            this.showNotification('Привычка пропущена', 'warning');
            await this.render();
        } catch (error) {
            this.showNotification(error.message || 'Ошибка пропуска привычки', 'error');
        }
    }

    async deleteHabit(habitId) {
        if (!confirm('Удалить эту привычку?')) return;
        
        try {
            await window.api.deleteHabit(habitId);
            await this.loadHabits();
            this.showNotification('Привычка удалена', 'success');
            await this.render();
        } catch (error) {
            this.showNotification(error.message || 'Ошибка удаления привычки', 'error');
        }
    }

    async logout() {
        window.api.clearAuth();
        this.user = null;
        this.habits = [];
        this.showNotification('Вы вышли из системы', 'success');
        await this.render();
    }

    async render() {
        await this.updateProfile();
        await this.renderHabits();
        await this.updateStats();
    }

    async updateProfile() {
        if (this.user) {
            document.getElementById('userName').textContent = this.user.name;
            document.getElementById('userLevel').textContent = this.user.level;
            document.getElementById('currentXP').textContent = this.user.xp;
            document.getElementById('neededXP').textContent = this.user.xp_needed;
            document.getElementById('streakDays').textContent = this.user.streak;
            document.getElementById('totalHabits').textContent = this.habits.length;
            
            // Аватар
            const avatarElement = document.getElementById('userAvatar');
            if (avatarElement) {
                avatarElement.textContent = this.user.avatar || '👤';
            }
            
            // Определяем титул по уровню
            let title = 'Новичок';
            if (this.user.level >= 10) title = 'Опытный';
            if (this.user.level >= 20) title = 'Мастер';
            if (this.user.level >= 30) title = 'Легенда';
            document.getElementById('userTitle').textContent = title;
            
            // Прогресс XP
            const xpPercent = (this.user.xp / this.user.xp_needed) * 100;
            const xpProgress = document.getElementById('xpProgress');
            if (xpProgress) {
                xpProgress.style.width = `${Math.min(xpPercent, 100)}%`;
            }
            
            // Обновляем кнопку входа
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <i class="fas fa-user"></i>
                    <span>${this.user.name}</span>
                `;
            }
        } else {
            document.getElementById('userName').textContent = 'Гость';
            document.getElementById('userLevel').textContent = '1';
            document.getElementById('currentXP').textContent = '0';
            document.getElementById('neededXP').textContent = '100';
            document.getElementById('streakDays').textContent = '0';
            document.getElementById('totalHabits').textContent = '0';
            document.getElementById('userTitle').textContent = 'Новичок';
            
            const xpProgress = document.getElementById('xpProgress');
            if (xpProgress) {
                xpProgress.style.width = '0%';
            }
            
            const avatarElement = document.getElementById('userAvatar');
            if (avatarElement) {
                avatarElement.textContent = '👤';
            }
            
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <i class="fas fa-user"></i>
                    <span>Войти</span>
                `;
            }
        }
    }

    async renderHabits() {
        const container = document.getElementById('habitsGrid');
        if (!container) return;
        
        const habitsLoaded = await this.loadHabits();
        
        if (!habitsLoaded || this.habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>${this.user ? 'Начните отслеживать привычки' : 'Войдите, чтобы отслеживать привычки'}</h3>
                    <p>${this.user ? 'Добавьте свою первую привычку и начните свой путь к улучшению себя!' : 'Авторизуйтесь, чтобы получить доступ к трекеру привычек'}</p>
                    ${this.user ? 
                        `<button class="btn-primary" id="createFirstHabit">
                            <i class="fas fa-plus"></i> Создать первую привычку
                        </button>` : 
                        `<button class="btn-primary" id="loginFromEmpty">
                            <i class="fas fa-sign-in-alt"></i> Войти
                        </button>`
                    }
                </div>
            `;
            
            if (this.user) {
                document.getElementById('createFirstHabit').addEventListener('click', () => this.showModal('habitModal'));
            } else {
                document.getElementById('loginFromEmpty').addEventListener('click', () => this.showModal('authModal'));
            }
            return;
        }
        
        container.innerHTML = this.habits.map(habit => `
            <div class="habit-card" data-id="${habit.id}">
                <div class="habit-header">
                    <div>
                        <div class="habit-title">${habit.name}</div>
                        <div class="habit-description">${habit.description || 'Без описания'}</div>
                        <div class="habit-meta">
                            <span class="difficulty-badge ${habit.difficulty}">${habit.difficulty === 'easy' ? 'Легко' : habit.difficulty === 'medium' ? 'Средне' : 'Сложно'}</span>
                            <span class="goal-badge">${habit.goal === 'daily' ? 'Ежедневно' : 'Еженедельно'}</span>
                        </div>
                    </div>
                    <div class="habit-xp">+${habit.xp} XP</div>
                </div>
                
                <div class="habit-streak">
                    Серия: ${habit.current_streak} дн. (рекорд: ${habit.best_streak} дн.)
                    ${habit.completed_today ? '<span class="completed-badge">✓ Выполнено сегодня</span>' : ''}
                </div>
                
                <div class="habit-actions">
                    <button class="btn-complete" ${habit.completed_today ? 'disabled' : ''} onclick="app.completeHabit(${habit.id})">
                        <i class="fas fa-check"></i> ${habit.completed_today ? 'Выполнено' : 'Выполнить'}
                    </button>
                    <button class="btn-skip" onclick="app.skipHabit(${habit.id})">
                        <i class="fas fa-forward"></i> Пропустить
                    </button>
                    <button class="btn-skip" onclick="app.deleteHabit(${habit.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async updateStats() {
        try {
            if (this.user) {
                const stats = await window.api.getStats();
                
                document.getElementById('todayCompleted').textContent = stats.completedToday || 0;
                document.getElementById('todayTotal').textContent = stats.totalHabits || 0;
                document.getElementById('bestStreak').textContent = stats.bestStreak || 0;
                
                // Рассчитываем успешность
                let successRate = 0;
                if (stats.totalHabits > 0) {
                    const totalCompletions = this.habits.reduce((sum, h) => sum + h.current_streak, 0);
                    const totalDays = stats.totalHabits * 30;
                    successRate = Math.round((totalCompletions / totalDays) * 100);
                }
                document.getElementById('successRate').textContent = `${successRate}%`;
            } else {
                document.getElementById('todayCompleted').textContent = '0';
                document.getElementById('todayTotal').textContent = '0';
                document.getElementById('bestStreak').textContent = '0';
                document.getElementById('successRate').textContent = '0%';
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Автоудаление через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Создаем и экспортируем приложение
const app = new HabitTracker();
window.app = app; // Делаем доступным глобально для обработчиков в HTML