const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Создание привычки
router.post('/', [
    body('name').notEmpty().withMessage('Название привычки обязательно'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Некорректная сложность'),
    body('goal').isIn(['daily', 'weekly']).withMessage('Некорректная цель')
], habitController.createHabit);

// Получение привычек пользователя
router.get('/', habitController.getUserHabits);

// Выполнение привычки
router.post('/:habitId/complete', habitController.completeHabit);

// Пропуск привычки
router.post('/:habitId/skip', habitController.skipHabit);

// Удаление привычки
router.delete('/:habitId', habitController.deleteHabit);

// Статистика
router.get('/stats', habitController.getStats);

module.exports = router;