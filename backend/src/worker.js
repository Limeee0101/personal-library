import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

const app = new Hono();

// CORS配置
app.use('/*', cors({
  origin: ['http://localhost:3000', 'https://personal-library-amber.vercel.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// JWT密钥
const JWT_SECRET = 'my-secret-key-2024';

// 数据库查询辅助函数
async function query(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).all();
  return result.results;
}

async function queryOne(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).first();
  return result;
}

async function execute(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).run();
  return result;
}

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

// 认证中间件
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '请先登录' }, 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = await jwt.verify(token, JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ error: '登录已过期' }, 401);
  }
};

// ========== 认证路由 ==========

// 注册
app.post('/api/auth/register', async (c) => {
  const { username, password, nickname } = await c.req.json();
  const db = c.env.DB;

  if (!username || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400);
  }

  if (username.length < 2 || username.length > 20) {
    return c.json({ error: '用户名长度应为2-20个字符' }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: '密码长度至少6个字符' }, 400);
  }

  const existing = await queryOne(db, 'SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    return c.json({ error: '用户名已被使用' }, 400);
  }

  // 使用Web Crypto API加密密码
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const result = await execute(db, 'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)', [username, hashedPassword, nickname || username]);

  const user = await queryOne(db, 'SELECT id, username, nickname, avatar FROM users WHERE id = ?', [result.meta.last_row_id]);

  // 生成JWT
  const token = await jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

  return c.json({ user, token }, 201);
});

// 登录
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  const db = c.env.DB;

  if (!username || !password) {
    return c.json({ error: '请输入用户名和密码' }, 400);
  }

  const user = await queryOne(db, 'SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }

  // 验证密码
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (user.password !== hashedPassword) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }

  const token = await jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar
    },
    token
  });
});

// 获取当前用户
app.get('/api/auth/me', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  const userInfo = await queryOne(db, 'SELECT id, username, nickname, avatar FROM users WHERE id = ?', [user.id]);
  if (!userInfo) {
    return c.json({ error: '用户不存在' }, 404);
  }

  return c.json({ user: userInfo });
});

// ========== 分类路由 ==========

app.get('/api/categories', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  const categories = await query(db, `
    SELECT c.*, COUNT(bc.book_id) as book_count
    FROM categories c
    LEFT JOIN book_categories bc ON c.id = bc.category_id
    LEFT JOIN books b ON bc.book_id = b.id AND b.user_id = ?
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.name
  `, [user.id, user.id]);

  return c.json({ categories });
});

app.post('/api/categories', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { name, color } = await c.req.json();

  if (!name || name.trim().length === 0) {
    return c.json({ error: '分类名称不能为空' }, 400);
  }

  const existing = await queryOne(db, 'SELECT * FROM categories WHERE name = ? AND user_id = ?', [name.trim(), user.id]);
  if (existing) {
    return c.json({ error: '分类名称已存在' }, 400);
  }

  const result = await execute(db, 'INSERT INTO categories (name, color, user_id) VALUES (?, ?, ?)', [name.trim(), color || '#2C3E50', user.id]);

  const newCategory = await queryOne(db, 'SELECT * FROM categories WHERE id = ?', [result.meta.last_row_id]);

  return c.json({ category: newCategory }, 201);
});

app.put('/api/categories/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { id } = c.req.param();
  const { name, color } = await c.req.json();

  const existing = await queryOne(db, 'SELECT * FROM categories WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!existing) {
    return c.json({ error: '分类不存在' }, 404);
  }

  await execute(db, 'UPDATE categories SET name = ?, color = ? WHERE id = ?', [name?.trim() || existing.name, color || existing.color, id]);

  const updated = await queryOne(db, 'SELECT * FROM categories WHERE id = ?', [id]);

  return c.json({ category: updated });
});

app.delete('/api/categories/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await queryOne(db, 'SELECT * FROM categories WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!existing) {
    return c.json({ error: '分类不存在' }, 404);
  }

  await execute(db, 'DELETE FROM categories WHERE id = ?', [id]);

  return c.json({ message: '删除成功' });
});

// ========== 书籍路由 ==========

app.get('/api/books', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { category, sort = 'added_date', order = 'desc' } = c.req.query();

  let sql = `SELECT DISTINCT b.* FROM books b WHERE b.user_id = ?`;
  const params = [user.id];

  if (category) {
    sql += ` AND EXISTS (SELECT 1 FROM book_categories bc WHERE bc.book_id = b.id AND bc.category_id = ?)`;
    params.push(category);
  }

  const validSorts = ['added_date', 'title', 'author', 'publish_year'];
  const sortColumn = validSorts.includes(sort) ? sort : 'added_date';
  const orderDir = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  sql += ` ORDER BY b.${sortColumn} ${orderDir}`;

  const books = await query(db, sql, params);

  const booksWithCategories = await Promise.all(books.map(async (book) => {
    const categories = await query(db, `
      SELECT c.* FROM categories c
      JOIN book_categories bc ON c.id = bc.category_id
      WHERE bc.book_id = ? AND c.user_id = ?
    `, [book.id, user.id]);
    return { ...book, categories };
  }));

  return c.json({ books: booksWithCategories, total: booksWithCategories.length });
});

app.get('/api/books/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { id } = c.req.param();

  const book = await queryOne(db, 'SELECT * FROM books WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!book) {
    return c.json({ error: '书籍不存在' }, 404);
  }

  const categories = await query(db, `
    SELECT c.* FROM categories c
    JOIN book_categories bc ON c.id = bc.category_id
    WHERE bc.book_id = ? AND c.user_id = ?
  `, [id, user.id]);

  const notes = await query(db, 'SELECT * FROM notes WHERE book_id = ? AND user_id = ? ORDER BY updated_date DESC', [id, user.id]);

  const review = await queryOne(db, 'SELECT * FROM reviews WHERE book_id = ? AND user_id = ?', [id, user.id]);

  return c.json({ book: { ...book, categories, notes, review } });
});

app.post('/api/books', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const body = await c.req.json();
  const { title, author, publisher, isbn, open_library_id, cover_url, publish_year, page_count, description, categoryIds } = body;

  if (!title) {
    return c.json({ error: '书名不能为空' }, 400);
  }

  const result = await execute(db, `
    INSERT INTO books (title, author, publisher, isbn, open_library_id, cover_url, publish_year, page_count, description, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, author, publisher, isbn, open_library_id, cover_url, publish_year, page_count, description, user.id]);

  const bookId = result.meta.last_row_id;

  if (categoryIds && categoryIds.length > 0) {
    for (const categoryId of categoryIds) {
      await execute(db, 'INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)', [bookId, categoryId]);
    }
  }

  const newBook = await queryOne(db, 'SELECT * FROM books WHERE id = ?', [bookId]);

  return c.json({ book: newBook }, 201);
});

app.delete('/api/books/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await queryOne(db, 'SELECT * FROM books WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!existing) {
    return c.json({ error: '书籍不存在' }, 404);
  }

  await execute(db, 'DELETE FROM books WHERE id = ?', [id]);

  return c.json({ message: '删除成功' });
});

app.put('/api/books/:id/categories', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { id } = c.req.param();
  const { categoryIds } = await c.req.json();

  const book = await queryOne(db, 'SELECT * FROM books WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!book) {
    return c.json({ error: '书籍不存在' }, 404);
  }

  await execute(db, 'DELETE FROM book_categories WHERE book_id = ?', [id]);

  if (categoryIds && categoryIds.length > 0) {
    for (const categoryId of categoryIds) {
      await execute(db, 'INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)', [id, categoryId]);
    }
  }

  const categories = await query(db, `
    SELECT c.* FROM categories c
    JOIN book_categories bc ON c.id = bc.category_id
    WHERE bc.book_id = ? AND c.user_id = ?
  `, [id, user.id]);

  return c.json({ categories });
});

// ========== 笔记路由 ==========

app.get('/api/books/:bookId/notes', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { bookId } = c.req.param();

  const book = await queryOne(db, 'SELECT * FROM books WHERE id = ? AND user_id = ?', [bookId, user.id]);
  if (!book) {
    return c.json({ error: '书籍不存在' }, 404);
  }

  const notes = await query(db, 'SELECT * FROM notes WHERE book_id = ? AND user_id = ? ORDER BY updated_date DESC', [bookId, user.id]);

  return c.json({ notes });
});

app.post('/api/books/:bookId/notes', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { bookId } = c.req.param();
  const { title, content } = await c.req.json();

  const book = await queryOne(db, 'SELECT * FROM books WHERE id = ? AND user_id = ?', [bookId, user.id]);
  if (!book) {
    return c.json({ error: '书籍不存在' }, 404);
  }

  const result = await execute(db, 'INSERT INTO notes (book_id, title, content, user_id) VALUES (?, ?, ?, ?)', [bookId, title || '无标题笔记', content || '', user.id]);

  const newNote = await queryOne(db, 'SELECT * FROM notes WHERE id = ?', [result.meta.last_row_id]);

  return c.json({ note: newNote }, 201);
});

app.put('/api/books/:bookId/notes/:noteId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { noteId } = c.req.param();
  const { title, content } = await c.req.json();

  const existing = await queryOne(db, 'SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, user.id]);
  if (!existing) {
    return c.json({ error: '笔记不存在' }, 404);
  }

  await execute(db, 'UPDATE notes SET title = ?, content = ?, updated_date = CURRENT_TIMESTAMP WHERE id = ?', [title ?? existing.title, content ?? existing.content, noteId]);

  const updated = await queryOne(db, 'SELECT * FROM notes WHERE id = ?', [noteId]);

  return c.json({ note: updated });
});

app.delete('/api/books/:bookId/notes/:noteId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { noteId } = c.req.param();

  const existing = await queryOne(db, 'SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, user.id]);
  if (!existing) {
    return c.json({ error: '笔记不存在' }, 404);
  }

  await execute(db, 'DELETE FROM notes WHERE id = ?', [noteId]);

  return c.json({ message: '删除成功' });
});

// ========== 书评路由 ==========

app.get('/api/books/:bookId/review', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { bookId } = c.req.param();

  const book = await queryOne(db, 'SELECT * FROM books WHERE id = ? AND user_id = ?', [bookId, user.id]);
  if (!book) {
    return c.json({ error: '书籍不存在' }, 404);
  }

  const review = await queryOne(db, 'SELECT * FROM reviews WHERE book_id = ? AND user_id = ?', [bookId, user.id]);

  return c.json({ review: review || null });
});

app.post('/api/books/:bookId/review', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { bookId } = c.req.param();
  const { content, rating, reading_start_date, reading_end_date } = await c.req.json();

  const book = await queryOne(db, 'SELECT * FROM books WHERE id = ? AND user_id = ?', [bookId, user.id]);
  if (!book) {
    return c.json({ error: '书籍不存在' }, 404);
  }

  const existing = await queryOne(db, 'SELECT * FROM reviews WHERE book_id = ? AND user_id = ?', [bookId, user.id]);
  if (existing) {
    return c.json({ error: '该书籍已有书评' }, 400);
  }

  const result = await execute(db, 'INSERT INTO reviews (book_id, content, rating, reading_start_date, reading_end_date, user_id) VALUES (?, ?, ?, ?, ?, ?)', [bookId, content || '', rating, reading_start_date, reading_end_date, user.id]);

  const newReview = await queryOne(db, 'SELECT * FROM reviews WHERE id = ?', [result.meta.last_row_id]);

  return c.json({ review: newReview }, 201);
});

app.put('/api/books/:bookId/review', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { bookId } = c.req.param();
  const { content, rating, reading_start_date, reading_end_date } = await c.req.json();

  const existing = await queryOne(db, 'SELECT * FROM reviews WHERE book_id = ? AND user_id = ?', [bookId, user.id]);
  if (!existing) {
    return c.json({ error: '书评不存在' }, 404);
  }

  await execute(db, 'UPDATE reviews SET content = ?, rating = ?, reading_start_date = ?, reading_end_date = ?, updated_date = CURRENT_TIMESTAMP WHERE book_id = ?', [content ?? existing.content, rating ?? existing.rating, reading_start_date ?? existing.reading_start_date, reading_end_date ?? existing.reading_end_date, bookId]);

  const updated = await queryOne(db, 'SELECT * FROM reviews WHERE book_id = ?', [bookId]);

  return c.json({ review: updated });
});

app.delete('/api/books/:bookId/review', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { bookId } = c.req.param();

  const existing = await queryOne(db, 'SELECT * FROM reviews WHERE book_id = ? AND user_id = ?', [bookId, user.id]);
  if (!existing) {
    return c.json({ error: '书评不存在' }, 404);
  }

  await execute(db, 'DELETE FROM reviews WHERE book_id = ?', [bookId]);

  return c.json({ message: '删除成功' });
});

// ========== 搜索路由（使用豆瓣） ==========

app.get('/api/search', async (c) => {
  const { q } = c.req.query();

  if (!q) {
    return c.json({ results: [] });
  }

  try {
    const response = await fetch(`https://api.douban.com/v2/book/search?q=${encodeURIComponent(q)}&count=20`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = await response.json();

    const results = (data.books || []).map(book => ({
      title: book.title,
      author: book.author?.join(', ') || '未知作者',
      publisher: book.publisher,
      isbn: book.isbn13 || book.isbn10,
      cover_url: book.image,
      publish_year: book.pubdate?.split('-')[0],
      rating: book.rating?.average,
      open_library_id: book.id
    }));

    return c.json({ results });
  } catch (error) {
    return c.json({ results: [], error: '搜索失败' });
  }
});

export default app;
