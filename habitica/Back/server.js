const express = require('express');
const path = require('path');
const mysql = require('mysql2');

const app = express();
app.use(express.urlencoded({ extended: true }));

// Подключение к MariaDB
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1337',
    database: 'Habitica'
});

// Проверяем подключение к базе
db.connect((err) => {
    if (err) {
        console.log('❌ Ошибка подключения к БД:', err);
    } else {
        console.log('✅ Подключение к MariaDB установлено');
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front/HTML-Pages/Login-Page.html'));
});

// Обработка формы - ТЕПЕРЬ СОХРАНЯЕМ В БАЗУ
app.post('/add-user', (req, res) => {
    const { login, email, password, name } = req.body;
    
    console.log('📥 Получены данные:', { login, email, password, name });

    // Сохраняем в базу данных
    const sql = 'INSERT INTO users (login, email, password, name) VALUES (?, ?, ?, ?)';
    
    db.execute(sql, [login, email, password, name], (err, result) => {
        if (err) {
            console.log('❌ Ошибка при сохранении в базу:', err);
            res.send('Ошибка: ' + err.message);
        } else {
            console.log('✅ Пользователь сохранен в базу. ID:', result.insertId);
            res.send(`
                <h1>Успех! 🎉</h1>
                <p>Пользователь <strong>${name}</strong> сохранен в базу данных!</p>
                <p>ID: ${result.insertId}</p>
                <a href="/">Добавить еще</a> | 
                <a href="/users">Посмотреть всех</a>
            `);
        }
    });
});

// Страница со списком пользователей ИЗ БАЗЫ
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users ORDER BY id DESC', (err, results) => {
        if (err) {
            res.send('Ошибка загрузки данных');
            return;
        }

        let html = `
            <h1>Список пользователей (всего: ${results.length})</h1>
            <table border="1" cellpadding="10">
                <tr>
                    <th>ID</th>
                    <th>Логин</th>
                    <th>Email</th>
                    <th>Имя</th>
                    <th>Уровень</th>
                    <th>Дата</th>
                </tr>
        `;

        results.forEach(user => {
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.login}</td>
                    <td>${user.email}</td>
                    <td>${user.name}</td>
                    <td>${user.level}</td>
                    <td>${user.created_at}</td>
                </tr>
            `;
        });

        html += `</table><a href="/">Назад</a>`;
        res.send(html);
    });
});

app.listen(3000, () => {
    console.log('🚀 Сервер запущен: http://localhost:3000');
});