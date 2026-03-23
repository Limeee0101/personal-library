require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://personal-library-amber.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
};

// 中间件
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/search', require('./routes/search'));
app.use('/api/books', require('./routes/books'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/books/:bookId/notes', require('./routes/notes'));
app.use('/api/books/:bookId/review', require('./routes/reviews'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  await initDatabase();
});
