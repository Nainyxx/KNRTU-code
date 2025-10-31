class User {
    constructor(id, login, email, password, name, level = 1, created_at = null) {
        this.id = id;
        this.login = login;
        this.email = email;
        this.password = password;
        this.name = name;
        this.level = level;
        this.created_at = created_at;
    }

    // Методы для работы с данными пользователя
    getInfo() {
        return {
            id: this.id,
            login: this.login,
            email: this.email,
            name: this.name,
            level: this.level,
            created_at: this.created_at
        };
    }

    isAdmin() {
        return this.level === 3;
    }

    isModerator() {
        return this.level >= 2;
    }
}

module.exports = User;