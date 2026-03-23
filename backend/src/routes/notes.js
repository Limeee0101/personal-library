const express = require('express');
const router = express.Router({ mergeParams: true });
const { getOne, getAll, run } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取书籍的所有笔记
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    // 验证书籍属于当前用户
    const book = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [bookId, userId]);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    const notes = await getAll(`
      SELECT * FROM notes WHERE book_id = $1 AND user_id = $2 ORDER BY updated_date DESC
    `, [bookId, userId]);

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单条笔记
router.get('/:noteId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteId } = req.params;
    const note = await getOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);

    if (!note) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建笔记
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;
    const { title, content } = req.body;

    const book = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [bookId, userId]);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    const result = await run(`
      INSERT INTO notes (book_id, title, content, user_id)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [bookId, title || '无标题笔记', content || '', userId]);

    const newNote = await getOne('SELECT * FROM notes WHERE id = $1', [result.lastInsertRowid]);
    res.status(201).json({ note: newNote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新笔记
router.put('/:noteId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteId } = req.params;
    const { title, content } = req.body;

    const existing = await getOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
    if (!existing) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    await run(`
      UPDATE notes SET title = $1, content = $2, updated_date = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
    `, [
      title !== undefined ? title : existing.title,
      content !== undefined ? content : existing.content,
      noteId,
      userId
    ]);

    const updatedNote = await getOne('SELECT * FROM notes WHERE id = $1', [noteId]);
    res.json({ note: updatedNote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除笔记
router.delete('/:noteId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteId } = req.params;

    const existing = await getOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
    if (!existing) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    await run('DELETE FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
