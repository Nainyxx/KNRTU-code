const Habit = require('../models/Habit');
const { validationResult } = require('express-validator');

exports.createHabit = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, difficulty, goal } = req.body;
        
        const habit = await Habit.create({
            user_id: req.user.id,
            name,
            description,
            difficulty,
            goal
        });

        res.status(201).json({
            habit: {
                id: habit.id,
                name: habit.name,
                description: habit.description,
                difficulty: habit.difficulty,
                goal: habit.goal,
                xp: habit.xp,
                current_streak: habit.current_streak,
                best_streak: habit.best_streak,
                created_at: habit.created_at
            }
        });
    } catch (error) {
        console.error('Create habit error:', error);
        res.status(500).json({ error: 'Ошибка при создании привычки' });
    }
};

exports.getUserHabits = async (req, res) => {
    try {
        const habits = await Habit.findByUser(req.user.id);
        res.json({ habits });
    } catch (error) {
        console.error('Get habits error:', error);
        res.status(500).json({ error: 'Ошибка при получении привычек' });
    }
};

exports.completeHabit = async (req, res) => {
    try {
        const { habitId } = req.params;
        
        const result = await Habit.complete(habitId);
        
        // проверка на принадлежность привычки пользователю
        const habits = await Habit.findByUser(req.user.id);
        const habitExists = habits.find(h => h.id === parseInt(habitId));
        
        if (!habitExists) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }

        // добавляем экспу пользователю
        res.json({
            success: true,
            streak: result.streak,
            bestStreak: result.bestStreak,
            message: 'Привычка выполнена!'
        });
    } catch (error) {
        if (error.message === 'Habit already completed today') {
            return res.status(400).json({ error: 'Эта привычка уже выполнена сегодня' });
        }
        console.error('Complete habit error:', error);
        res.status(500).json({ error: 'Ошибка при выполнении привычки' });
    }
};

exports.skipHabit = async (req, res) => {
    try {
        const { habitId } = req.params;
        
        // проверка на принадлежность привычки пользователю
        const habits = await Habit.findByUser(req.user.id);
        const habitExists = habits.find(h => h.id === parseInt(habitId));
        
        if (!habitExists) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }

        await Habit.skip(habitId);
        
        res.json({
            success: true,
            message: 'Привычка пропущена'
        });
    } catch (error) {
        console.error('Skip habit error:', error);
        res.status(500).json({ error: 'Ошибка при пропуске привычки' });
    }
};

exports.deleteHabit = async (req, res) => {
    try {
        const { habitId } = req.params;
        
        // проверка на принадлежность привычки пользователю
        const habits = await Habit.findByUser(req.user.id);
        const habitExists = habits.find(h => h.id === parseInt(habitId));
        
        if (!habitExists) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }

        await Habit.delete(habitId);
        
        res.json({
            success: true,
            message: 'Привычка удалена'
        });
    } catch (error) {
        console.error('Delete habit error:', error);
        res.status(500).json({ error: 'Ошибка при удалении привычки' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const stats = await Habit.getUserStats(req.user.id);
        res.json({ stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Ошибка при получении статистики' });
    }
};