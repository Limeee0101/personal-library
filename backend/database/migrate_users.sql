-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 为现有表添加user_id字段
ALTER TABLE books ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE categories ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE reviews ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 为user_id创建索引
CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
