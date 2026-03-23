const express = require('express');
const router = express.Router({ mergeParams: true });
const { getOne, getAll, run } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取书籍的书评
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    // 验证书籍属于当前用户
    const book = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [bookId, userId]);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    const review = await getOne('SELECT * FROM reviews WHERE book_id = $1 AND user_id = $2', [bookId, userId]);
    res.json({ review: review || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建书评
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;
    const { content, rating, reading_start_date, reading_end_date } = req.body;

    const book = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [bookId, userId]);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    // 检查是否已有书评
    const existing = await getOne('SELECT * FROM reviews WHERE book_id = $1 AND user_id = $2', [bookId, userId]);
    if (existing) {
      return res.status(400).json({ error: '该书籍已有书评' });
    }

    const result = await run(`
      INSERT INTO reviews (book_id, content, rating, reading_start_date, reading_end_date, user_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [bookId, content || '', rating, reading_start_date, reading_end_date, userId]);

    const newReview = await getOne('SELECT * FROM reviews WHERE id = $1', [result.lastInsertRowid]);
    res.status(201).json({ review: newReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新书评
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;
    const { content, rating, reading_start_date, reading_end_date } = req.body;

    const existing = await getOne('SELECT * FROM reviews WHERE book_id = $1 AND user_id = $2', [bookId, userId]);
    if (!existing) {
      return res.status(404).json({ error: '书评不存在' });
    }

    await run(`
      UPDATE reviews SET content = $1, rating = $2, reading_start_date = $3, reading_end_date = $4, updated_date = CURRENT_TIMESTAMP
      WHERE book_id = $5 AND user_id = $6
    `, [
      content !== undefined ? content : existing.content,
      rating !== undefined ? rating : existing.rating,
      reading_start_date !== undefined ? reading_start_date : existing.reading_start_date,
      reading_end_date !== undefined ? reading_end_date : existing.reading_end_date,
      bookId,
      userId
    ]);

    const updatedReview = await getOne('SELECT * FROM reviews WHERE book_id = $1', [bookId]);
    res.json({ review: updatedReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除书评
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    const existing = await getOne('SELECT * FROM reviews WHERE book_id = $1 AND user_id = $2', [bookId, userId]);
    if (!existing) {
      return res.status(404).json({ error: '书评不存在' });
    }

    await run('DELETE FROM reviews WHERE book_id = $1 AND user_id = $2', [bookId, userId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
