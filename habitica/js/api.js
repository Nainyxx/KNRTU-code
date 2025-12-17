// API конфигурация
const API_BASE_URL = 'http://localhost:5000/api';

class HabiticaAPI {
    constructor() {
        this.token = localStorage.getItem('habitica_token') || null;
        this.user = JSON.parse(localStorage.getItem('habitica_user') || 'null');
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('habitica_token', token);
        localStorage.setItem('habitica_user', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('habitica_token');
        localStorage.removeItem('habitica_user');
    }

async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
        ...options,
        headers,
        mode: 'cors'
    };

    console.log('Отправка запроса:', url, config);

    try {
        const response = await fetch(url, config);
        
        console.log('Статус ответа:', response.status);
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { error: await response.text() };
        }
        
        console.log('Полный ответ сервера:', data); // Добавьте эту строку
        
        if (!response.ok) {
            // Выводим детальную информацию об ошибках
            if (data.errors && data.errors.length > 0) {
                console.error('Ошибки валидации:', data.errors);
                const errorMessages = data.errors.map(err => err.msg).join(', ');
                throw new Error(`Ошибка валидации: ${errorMessages}`);
            }
            throw new Error(data.error || data.message || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

    // Аутентификация
    async register(name, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        
        this.setAuth(data.token, data.user);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        this.setAuth(data.token, data.user);
        return data;
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    async updateProfile(updates) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    // Привычки
    async getHabits() {
        const data = await this.request('/habits');
        return data.habits;
    }

    async createHabit(habitData) {
        const data = await this.request('/habits', {
            method: 'POST',
            body: JSON.stringify(habitData)
        });
        return data.habit;
    }

    async completeHabit(habitId) {
        return await this.request(`/habits/${habitId}/complete`, {
            method: 'POST'
        });
    }

    async skipHabit(habitId) {
        return await this.request(`/habits/${habitId}/skip`, {
            method: 'POST'
        });
    }

    async deleteHabit(habitId) {
        return await this.request(`/habits/${habitId}`, {
            method: 'DELETE'
        });
    }

    async getStats() {
        const data = await this.request('/habits/stats');
        return data.stats;
    }

    async addXP(xp) {
        return await this.request('/auth/xp', {
            method: 'POST',
            body: JSON.stringify({ xp })
        });
    }
}

// Создаем глобальный экземпляр API
window.api = new HabiticaAPI();