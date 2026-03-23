const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

// 搜索书籍
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }

    const results = await bookService.searchBooks(q.trim());
    res.json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取书籍版本（豆瓣通常不需要）
router.get('/editions/:bookId', async (req, res) => {
  try {
    const editions = await bookService.getEditions(req.params.bookId);
    res.json({ editions });
  } catch (error) {
    res.json({ editions: [] });
  }
});

module.exports = router;
