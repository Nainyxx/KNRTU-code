const pool = require('../config/database');

class Habit {
    static async create(habitData) {
        const { user_id, name, description, difficulty, goal } = habitData;
        const xp = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
        
        const [result] = await pool.execute(
            'INSERT INTO habits (user_id, name, description, difficulty, goal, xp) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, name, description, difficulty, goal, xp]
        );
        
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM habits WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByUser(userId) {
        const [rows] = await pool.execute(
            `SELECT h.*, 
                (SELECT COUNT(*) FROM habit_completions hc 
                 WHERE hc.habit_id = h.id AND DATE(hc.completed_date) = CURDATE()) as completed_today
             FROM habits h 
             WHERE h.user_id = ? 
             ORDER BY h.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async complete(habitId) {
        // проверка, выполнена ли привычка сегодня
        const [existing] = await pool.execute(
            'SELECT * FROM habit_completions WHERE habit_id = ? AND DATE(completed_date) = CURDATE()',
            [habitId]
        );
        
        if (existing.length > 0) {
            throw new Error('Habit already completed today');
        }

        // добавление записи о выполнении
        await pool.execute(
            'INSERT INTO habit_completions (habit_id, completed_date) VALUES (?, CURDATE())',
            [habitId]
        );

        // обновление стрика
        const [habit] = await pool.execute('SELECT * FROM habits WHERE id = ?', [habitId]);
        
        // Пполучение стрика из ряда дней выполнения
        const [streakRows] = await pool.execute(`
            WITH RECURSIVE dates AS (
                SELECT CURDATE() as date
                UNION ALL
                SELECT DATE_SUB(date, INTERVAL 1 DAY)
                FROM dates
                WHERE date >= CURDATE() - INTERVAL 30 DAY
            )
            SELECT COUNT(*) as streak
            FROM dates d
            WHERE EXISTS (
                SELECT 1 FROM habit_completions hc 
                WHERE hc.habit_id = ? AND DATE(hc.completed_date) = d.date
            )
            AND d.date <= CURDATE()
            ORDER BY d.date DESC
            LIMIT 1
        `, [habitId]);
        
        const newStreak = streakRows[0]?.streak || 1;
        const bestStreak = Math.max(habit[0].best_streak, newStreak);
        
        await pool.execute(
            'UPDATE habits SET current_streak = ?, best_streak = ? WHERE id = ?',
            [newStreak, bestStreak, habitId]
        );

        return { streak: newStreak, bestStreak };
    }

    static async skip(habitId) {
        // удаление выполнение за сегодня, если есть
        await pool.execute(
            'DELETE FROM habit_completions WHERE habit_id = ? AND DATE(completed_date) = CURDATE()',
            [habitId]
        );

        await pool.execute(
            'UPDATE habits SET current_streak = 0 WHERE id = ?',
            [habitId]
        );
    }

    static async delete(habitId) {
        await pool.execute('DELETE FROM habits WHERE id = ?', [habitId]);
    }

    static async getUserStats(userId) {
        const [habits] = await pool.execute('SELECT COUNT(*) as total FROM habits WHERE user_id = ?', [userId]);
        const [today] = await pool.execute(
            `SELECT COUNT(DISTINCT hc.habit_id) as completed 
             FROM habit_completions hc 
             JOIN habits h ON h.id = hc.habit_id 
             WHERE h.user_id = ? AND DATE(hc.completed_date) = CURDATE()`,
            [userId]
        );
        const [bestStreak] = await pool.execute(
            'SELECT MAX(best_streak) as best FROM habits WHERE user_id = ?',
            [userId]
        );

        return {
            totalHabits: habits[0].total,
            completedToday: today[0].completed,
            bestStreak: bestStreak[0].best || 0
        };
    }
}

module.exports = Habit;