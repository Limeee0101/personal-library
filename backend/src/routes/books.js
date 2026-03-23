const express = require('express');
const router = express.Router({ mergeParams: true });
const { getOne, getAll, run } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有书籍
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, sort = 'added_date', order = 'desc' } = req.query;

    let queryStr = `
      SELECT DISTINCT b.* FROM books b
      WHERE b.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (category) {
      queryStr += `
        AND EXISTS (
          SELECT 1 FROM book_categories bc
          WHERE bc.book_id = b.id AND bc.category_id = $${paramIndex}
        )
      `;
      params.push(category);
    }

    const validSorts = ['added_date', 'title', 'author', 'publish_year'];
    const sortColumn = validSorts.includes(sort) ? sort : 'added_date';
    const orderDir = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    queryStr += ` ORDER BY b.${sortColumn} ${orderDir}`;

    const books = await getAll(queryStr, params);

    // 为每本书获取分类
    const booksWithCategories = await Promise.all(books.map(async (book) => {
      const categories = await getAll(`
        SELECT c.* FROM categories c
        JOIN book_categories bc ON c.id = bc.category_id
        WHERE bc.book_id = $1 AND c.user_id = $2
      `, [book.id, userId]);

      return { ...book, categories };
    }));

    res.json({ books: booksWithCategories, total: booksWithCategories.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单本书籍详情
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const book = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    // 获取分类
    const categories = await getAll(`
      SELECT c.* FROM categories c
      JOIN book_categories bc ON c.id = bc.category_id
      WHERE bc.book_id = $1 AND c.user_id = $2
    `, [id, userId]);

    // 获取笔记
    const notes = await getAll(`
      SELECT * FROM notes WHERE book_id = $1 AND user_id = $2 ORDER BY updated_date DESC
    `, [id, userId]);

    // 获取书评
    const review = await getOne('SELECT * FROM reviews WHERE book_id = $1 AND user_id = $2', [id, userId]);

    res.json({ book: { ...book, categories, notes, review } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加书籍到书架
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title, author, publisher, isbn, open_library_id,
      cover_url, publish_year, page_count, description, categoryIds
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: '书名不能为空' });
    }

    // 检查是否已存在
    if (open_library_id) {
      const existing = await getOne('SELECT * FROM books WHERE open_library_id = $1 AND user_id = $2', [open_library_id, userId]);
      if (existing) {
        return res.status(400).json({ error: '该书籍已在书架中' });
      }
    }

    const result = await run(`
      INSERT INTO books (title, author, publisher, isbn, open_library_id, cover_url, publish_year, page_count, description, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
    `, [title, author, publisher, isbn, open_library_id, cover_url, publish_year, page_count, description, userId]);

    const bookId = result.lastInsertRowid;

    // 添加分类关联
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await run('INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)', [bookId, categoryId]);
      }
    }

    const newBook = await getOne('SELECT * FROM books WHERE id = $1', [bookId]);
    res.status(201).json({ book: newBook });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新书籍信息
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, author, publisher, page_count, description } = req.body;

    const existing = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    await run(`
      UPDATE books SET title = $1, author = $2, publisher = $3, page_count = $4, description = $5
      WHERE id = $6 AND user_id = $7
    `, [
      title || existing.title,
      author || existing.author,
      publisher || existing.publisher,
      page_count || existing.page_count,
      description || existing.description,
      id,
      userId
    ]);

    const updatedBook = await getOne('SELECT * FROM books WHERE id = $1', [id]);
    res.json({ book: updatedBook });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除书籍
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    await run('DELETE FROM books WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新书籍分类
router.put('/:id/categories', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { categoryIds } = req.body;

    // 验证书籍属于当前用户
    const book = await getOne('SELECT * FROM books WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    // 删除现有关联
    await run('DELETE FROM book_categories WHERE book_id = $1', [id]);

    // 添加新关联
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await run('INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)', [id, categoryId]);
      }
    }

    const categories = await getAll(`
      SELECT c.* FROM categories c
      JOIN book_categories bc ON c.id = bc.category_id
      WHERE bc.book_id = $1 AND c.user_id = $2
    `, [id, userId]);

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
