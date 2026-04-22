// controllers/qaController.js
const { promisePool } = require('../config/database');

// @desc    Submit anonymous question
// @route   POST /api/qa/questions
// @access  Private (can be anonymous)
exports.submitQuestion = async (req, res) => {
    try {
        const { question, category, isAnonymous } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a question'
            });
        }

        // Perform AI Analysis
        let sentimentData = { polarity: 0, risk_score: 0 };
        try {
            const { analyzeSentiment } = require('../utils/aiService');
            sentimentData = await analyzeSentiment(question);
        } catch (aiError) {
            console.error('AI Analysis failed:', aiError);
        }

        const [result] = await promisePool.query(
            `INSERT INTO qa_questions (user_id, question, category, is_anonymous, sentiment_polarity, risk_score) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId, 
                question, 
                category || null, 
                isAnonymous !== false,
                sentimentData.polarity,
                sentimentData.risk_score
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Question submitted successfully',
            questionId: result.insertId
        });

    } catch (error) {
        console.error('Submit question error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error submitting question'
        });
    }
};

// @desc    Get all questions
// @route   GET /api/qa/questions
// @access  Public
exports.getAllQuestions = async (req, res) => {
    try {
        const { category, status } = req.query;

        let query = `
            SELECT 
                q.*,
                u.name as author_name,
                (SELECT COUNT(*) FROM qa_answers WHERE question_id = q.id) as answer_count
            FROM qa_questions q
            LEFT JOIN users u ON q.user_id = u.id AND q.is_anonymous = FALSE
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ' AND q.category = ?';
            params.push(category);
        }

        if (status) {
            query += ' AND q.status = ?';
            params.push(status);
        } else {
            query += ' AND q.status != "archived"';
        }

        query += ' ORDER BY q.created_at DESC LIMIT 50';

        const [questions] = await promisePool.query(query, params);

        // Format questions
        const formattedQuestions = questions.map(q => ({
            ...q,
            author_name: q.is_anonymous ? 'Anonymous' : q.author_name
        }));

        res.status(200).json({
            success: true,
            count: formattedQuestions.length,
            questions: formattedQuestions
        });

    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving questions'
        });
    }
};

// @desc    Get question details with answers
// @route   GET /api/qa/questions/:id
// @access  Public
exports.getQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        // Get question
        const [question] = await promisePool.query(
            `SELECT 
                q.*,
                u.name as author_name
            FROM qa_questions q
            LEFT JOIN users u ON q.user_id = u.id AND q.is_anonymous = FALSE
            WHERE q.id = ?`,
            [id]
        );

        if (question.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        // Increment views
        await promisePool.query(
            'UPDATE qa_questions SET views = views + 1 WHERE id = ?',
            [id]
        );

        // Get answers
        const [answers] = await promisePool.query(
            `SELECT 
                a.*,
                u.name as author_name
            FROM qa_answers a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.question_id = ?
            ORDER BY a.is_accepted DESC, a.upvotes DESC, a.created_at ASC`,
            [id]
        );

        res.status(200).json({
            success: true,
            question: {
                ...question[0],
                author_name: question[0].is_anonymous ? 'Anonymous' : question[0].author_name,
                answers
            }
        });

    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving question'
        });
    }
};

// @desc    Submit answer to question
// @route   POST /api/qa/questions/:id/answers
// @access  Private
exports.submitAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer, isExpert } = req.body;
        const userId = req.user.id;

        if (!answer) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an answer'
            });
        }

        // Check if question exists
        const [question] = await promisePool.query(
            'SELECT id, status FROM qa_questions WHERE id = ?',
            [id]
        );

        if (question.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        // Create answer
        await promisePool.query(
            `INSERT INTO qa_answers (question_id, user_id, answer, is_expert) 
             VALUES (?, ?, ?, ?)`,
            [id, userId, answer, isExpert || false]
        );

        // Update question status if first answer
        if (question[0].status === 'pending') {
            await promisePool.query(
                'UPDATE qa_questions SET status = "answered" WHERE id = ?',
                [id]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Answer submitted successfully'
        });

    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error submitting answer'
        });
    }
};

// @desc    Upvote question or answer
// @route   POST /api/qa/upvote
// @access  Private
exports.toggleUpvote = async (req, res) => {
    try {
        const { targetType, targetId } = req.body;
        const userId = req.user.id;

        if (!['question', 'answer'].includes(targetType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid target type'
            });
        }

        // Check if already upvoted
        const [existing] = await promisePool.query(
            'SELECT id FROM qa_upvotes WHERE user_id = ? AND target_type = ? AND target_id = ?',
            [userId, targetType, targetId]
        );

        if (existing.length > 0) {
            // Remove upvote
            await promisePool.query(
                'DELETE FROM qa_upvotes WHERE id = ?',
                [existing[0].id]
            );

            // Decrement count
            const table = targetType === 'question' ? 'qa_questions' : 'qa_answers';
            await promisePool.query(
                `UPDATE ${table} SET upvotes = upvotes - 1 WHERE id = ?`,
                [targetId]
            );

            return res.status(200).json({
                success: true,
                message: 'Upvote removed',
                action: 'removed'
            });
        } else {
            // Add upvote
            await promisePool.query(
                'INSERT INTO qa_upvotes (user_id, target_type, target_id) VALUES (?, ?, ?)',
                [userId, targetType, targetId]
            );

            // Increment count
            const table = targetType === 'question' ? 'qa_questions' : 'qa_answers';
            await promisePool.query(
                `UPDATE ${table} SET upvotes = upvotes + 1 WHERE id = ?`,
                [targetId]
            );

            return res.status(200).json({
                success: true,
                message: 'Upvote added',
                action: 'added'
            });
        }

    } catch (error) {
        console.error('Toggle upvote error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error toggling upvote'
        });
    }
};
