-- Полная схема базы данных
CREATE DATABASE IF NOT EXISTS habitica_db
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE habitica_db;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    xp_needed INT DEFAULT 100,
    streak INT DEFAULT 0,
    avatar VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Таблица привычек
CREATE TABLE IF NOT EXISTS habits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    goal ENUM('daily', 'weekly') DEFAULT 'daily',
    xp INT DEFAULT 10,
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Таблица истории выполнения
CREATE TABLE IF NOT EXISTS habit_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habit_id INT NOT NULL,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE KEY unique_completion (habit_id, completed_date),
    INDEX idx_habit_id (habit_id),
    INDEX idx_completed_date (completed_date)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Тестовые данные (опционально)
INSERT INTO users (name, email, password_hash) VALUES
('Тестовый Пользователь', 'test@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3aV7QHpqjzE2QN7NpQ6O1QdL5W6');

INSERT INTO habits (user_id, name, description, difficulty, goal) VALUES
(1, 'Пить воду', 'Выпивать 2 литра воды в день', 'medium', 'daily'),
(1, 'Утренняя зарядка', '15 минут упражнений', 'easy', 'daily'),
(1, 'Чтение книги', '30 минут чтения', 'medium', 'daily');