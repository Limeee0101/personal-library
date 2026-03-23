const express = require('express');
const router = express.Router();
const { getOne, getAll, run } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await getAll(`
      SELECT c.*, COUNT(bc.book_id) as book_count
      FROM categories c
      LEFT JOIN book_categories bc ON c.id = bc.category_id
      LEFT JOIN books b ON bc.book_id = b.id AND b.user_id = $1
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.name
    `, [userId]);

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建分类
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '分类名称不能为空' });
    }

    // 检查名称是否重复
    const existing = await getOne('SELECT * FROM categories WHERE name = $1 AND user_id = $2', [name.trim(), userId]);
    if (existing) {
      return res.status(400).json({ error: '分类名称已存在' });
    }

    const result = await run(
      'INSERT INTO categories (name, color, user_id) VALUES ($1, $2, $3) RETURNING id',
      [name.trim(), color || '#2C3E50', userId]
    );

    const newCategory = await getOne('SELECT * FROM categories WHERE id = $1', [result.lastInsertRowid]);
    res.status(201).json({ category: newCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新分类
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, color } = req.body;

    const existing = await getOne('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: '分类不存在' });
    }

    // 检查名称是否重复
    if (name && name !== existing.name) {
      const duplicate = await getOne('SELECT * FROM categories WHERE name = $1 AND user_id = $2 AND id != $3', [name.trim(), userId, id]);
      if (duplicate) {
        return res.status(400).json({ error: '分类名称已存在' });
      }
    }

    await run(
      'UPDATE categories SET name = $1, color = $2 WHERE id = $3 AND user_id = $4',
      [name?.trim() || existing.name, color || existing.color, id, userId]
    );

    const updatedCategory = await getOne('SELECT * FROM categories WHERE id = $1', [id]);
    res.json({ category: updatedCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除分类
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: '分类不存在' });
    }

    await run('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
