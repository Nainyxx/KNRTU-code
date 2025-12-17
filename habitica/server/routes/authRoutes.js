const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Регистрация
router.post('/register', [
    body('name').notEmpty().withMessage('Имя обязательно'),
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен быть минимум 6 символов')
], authController.register);

// Вход
router.post('/login', [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').notEmpty().withMessage('Пароль обязателен')
], authController.login);

// Получение профиля (требуется авторизация)
router.get('/profile', authMiddleware, authController.getProfile);

// Обновление профиля
router.put('/profile', authMiddleware, authController.updateProfile);

// Добавление XP
router.post('/xp', authMiddleware, authController.addXP);

module.exports = router;