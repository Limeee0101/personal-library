# 个人图书馆

一个简约的个人图书馆管理应用，用于管理你的书籍、笔记和书评。

## 功能特性

- **书籍搜索**：通过 Open Library API 搜索书籍，自动获取封面、作者、出版社等信息
- **版本选择**：当搜索结果有多个版本时，用户可选择具体版本
- **书架管理**：网格展示所有书籍，支持分类筛选和排序
- **自定义分类**：用户可创建、编辑分类，为书籍添加多个分类标签
- **笔记功能**：富文本编辑器，支持字体、格式、高亮等
- **书评功能**：记录读后感，支持评分和阅读日期

## 技术栈

- **前端**：React + Vite + React Router + React Quill
- **后端**：Node.js + Express
- **数据库**：SQLite
- **API**：Open Library API

## 快速开始

### 安装依赖

```bash
cd personal-library
npm run install:all
```

### 启动开发服务器

```bash
npm run dev
```

这会同时启动：
- 后端服务：http://localhost:3001
- 前端服务：http://localhost:3000

### 单独启动

```bash
# 仅启动后端
npm run dev:backend

# 仅启动前端
npm run dev:frontend
```

## 项目结构

```
personal-library/
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   ├── services/        # API 服务
│   │   └── styles/          # 样式
│   └── package.json
│
├── backend/                 # Node.js 后端
│   ├── src/
│   │   ├── config/          # 数据库配置
│   │   ├── routes/          # API 路由
│   │   └── services/        # 业务逻辑
│   ├── database/            # SQLite 数据库文件
│   └── package.json
│
└── package.json             # 根目录配置
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/search?q=书名 | 搜索书籍 |
| GET | /api/search/editions/:id | 获取书籍版本 |
| GET/POST | /api/books | 书籍列表/添加 |
| GET/PUT/DELETE | /api/books/:id | 书籍详情/更新/删除 |
| GET/POST | /api/categories | 分类列表/创建 |
| GET/POST/PUT/DELETE | /api/books/:id/notes | 笔记管理 |
| GET/POST/PUT/DELETE | /api/books/:id/review | 书评管理 |

## 界面预览

应用采用米白色和石墨灰为主色调，界面简约清新。

- **首页**：展示统计数据和最近添加的书籍
- **搜索页**：输入书名搜索，选择版本后添加到书架
- **书架页**：网格展示书籍，支持分类筛选
- **书籍详情**：查看书籍信息，编辑笔记和书评
