const { Pool } = require('pg');

// PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 查询辅助函数
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('执行查询', { text: text.substring(0, 50), duration, rows: res.rowCount });
  return res;
};

// 获取单行
const getOne = async (text, params) => {
  const res = await query(text, params);
  return res.rows[0];
};

// 获取多行
const getAll = async (text, params) => {
  const res = await query(text, params);
  return res.rows;
};

// 执行语句（INSERT/UPDATE/DELETE）
const run = async (text, params) => {
  const res = await query(text, params);
  return { lastInsertRowid: res.rows[0]?.id, changes: res.rowCount };
};

// 初始化数据库表
async function initDatabase() {
  try {
    // 用户表
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(100),
        avatar VARCHAR(500),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 书籍表
    await query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        author VARCHAR(200),
        publisher VARCHAR(200),
        isbn VARCHAR(50),
        open_library_id VARCHAR(100),
        cover_url VARCHAR(500),
        publish_year INTEGER,
        page_count INTEGER,
        description TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 分类表
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#2C3E50',
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, user_id)
      )
    `);

    // 书籍-分类关联表
    await query(`
      CREATE TABLE IF NOT EXISTS book_categories (
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (book_id, category_id)
      )
    `);

    // 笔记表
    await query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        title VARCHAR(200),
        content TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 书评表
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        content TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        reading_start_date DATE,
        reading_end_date DATE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_id, user_id)
      )
    `);

    // 创建索引
    await query(`CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notes_book ON notes(book_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

module.exports = { query, getOne, getAll, run, initDatabase, pool };
