const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // проверка на существование пользователя
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        // создание пользователя
        const user = await User.create({ name, email, password });
        const token = generateToken(user.id);

        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                level: user.level,
                xp: user.xp,
                xp_needed: user.xp_needed,
                streak: user.streak,
                avatar: user.avatar
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // нахождение пользователя
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // проверка пароля
        const isPasswordValid = await User.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // генерация токена
        const token = generateToken(user.id);

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                level: user.level,
                xp: user.xp,
                xp_needed: user.xp_needed,
                streak: user.streak,
                avatar: user.avatar
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка при входе' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = req.user;
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                level: user.level,
                xp: user.xp,
                xp_needed: user.xp_needed,
                streak: user.streak,
                avatar: user.avatar,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Ошибка при получении профиля' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const updates = {};
        
        if (name) updates.name = name;
        if (avatar) updates.avatar = avatar;

        const updatedUser = await User.update(req.user.id, updates);
        
        res.json({
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                level: updatedUser.level,
                xp: updatedUser.xp,
                xp_needed: updatedUser.xp_needed,
                streak: updatedUser.streak,
                avatar: updatedUser.avatar
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении профиля' });
    }
};

exports.addXP = async (req, res) => {
    try {
        const { xp } = req.body;
        const user = req.user;

        let newXP = user.xp + xp;
        let newLevel = user.level;
        let xpNeeded = user.xp_needed;

        while (newXP >= xpNeeded) {
            newXP -= xpNeeded;
            newLevel += 1;
            xpNeeded = Math.floor(100 * Math.pow(newLevel, 1.3));
        }

        // проверка пользователя
        await User.update(user.id, {
            xp: newXP,
            level: newLevel,
            xp_needed: xpNeeded
        });

        res.json({
            level: newLevel,
            xp: newXP,
            xp_needed: xpNeeded,
            leveledUp: newLevel > user.level
        });
    } catch (error) {
        console.error('Add XP error:', error);
        res.status(500).json({ error: 'Ошибка при добавлении XP' });
    }
};