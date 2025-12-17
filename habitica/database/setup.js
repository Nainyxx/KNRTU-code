// server/scripts/init-db.js
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    await connection.promise().query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'habitica_db'}`);
    await connection.promise().query(`USE ${process.env.DB_NAME || 'habitica_db'}`);
    
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    const queries = schema.split(';').filter(query => query.trim());
    
    for (const query of queries) {
        try {
            await connection.promise().query(query);
            console.log(`✓ Выполнен запрос: ${query.substring(0, 50)}...`);
        } catch (error) {
            console.error(`✗ Ошибка в запросе: ${error.message}`);
        }
    }
    
    console.log('✅ База данных успешно инициализирована!');
    connection.end();
}

setupDatabase().catch(console.error);