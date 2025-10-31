const mysql = require('mysql2');
const User = require('./User');

class UserManager {
    constructor() {
        this.db = mysql.createConnection({
            host: 'localhost',
            user: 'root', 
            password: '1337',
            database: 'my_project'
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db.connect(err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Создает пользователя в базе и возвращает объект User
    async createUser(login, email, password, name, level = 1) {
        const sql = 'INSERT INTO users (login, email, password, name, level) VALUES (?, ?, ?, ?, ?)';
        
        return new Promise((resolve, reject) => {
            this.db.execute(sql, [login, email, password, name, level], (err, result) => {
                if (err) reject(err);
                else {
                    // Возвращаем объект User
                    const user = new User(result.insertId, login, email, password, name, level, new Date());
                    resolve(user);
                }
            });
        });
    }

    // Получает всех пользователей как объекты User
    async getAllUsers() {
        return new Promise((resolve, reject) => {
            this.db.query('SELECT * FROM users ORDER BY id DESC', (err, results) => {
                if (err) reject(err);
                else {
                    const users = results.map(row => 
                        new User(row.id, row.login, row.email, row.password, row.name, row.level, row.created_at)
                    );
                    resolve(users);
                }
            });
        });
    }

    // Находит пользователя по логину и возвращает объект User
    async findUserByLogin(login) {
        return new Promise((resolve, reject) => {
            this.db.execute('SELECT * FROM users WHERE login = ?', [login], (err, results) => {
                if (err) reject(err);
                else if (results.length === 0) resolve(null);
                else {
                    const row = results[0];
                    const user = new User(row.id, row.login, row.email, row.password, row.name, row.level, row.created_at);
                    resolve(user);
                }
            });
        });
    }
}

module.exports = UserManager;