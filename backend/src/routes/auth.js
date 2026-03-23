const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getOne, run, query } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度应为2-20个字符' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6个字符' });
    }

    // 检查用户名是否已存在
    const existing = await getOne('SELECT id FROM users WHERE username = $1', [username]);
    if (existing) {
      return res.status(400).json({ error: '用户名已被使用' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await run(
      'INSERT INTO users (username, password, nickname) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, nickname || username]
    );

    const user = await getOne('SELECT id, username, nickname, avatar, created_date FROM users WHERE id = $1', [result.lastInsertRowid]);
    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    // 查找用户
    const user = await getOne('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getOne('SELECT id, username, nickname, avatar, created_date FROM users WHERE id = $1', [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const userId = req.user.id;

    await run(
      'UPDATE users SET nickname = $1, avatar = $2 WHERE id = $3',
      [nickname, avatar, userId]
    );

    const user = await getOne('SELECT id, username, nickname, avatar FROM users WHERE id = $1', [userId]);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

module.exports = router;
