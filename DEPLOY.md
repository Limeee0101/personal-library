# 部署指南

本项目可以免费部署到云平台，以下是详细步骤。

## 架构

- **前端**：Vercel（免费）
- **后端**：Render（免费）
- **数据库**：Neon（免费PostgreSQL）

## 第一步：创建数据库（Neon）

1. 访问 https://neon.tech 注册账号
2. 创建新项目，选择免费套餐
3. 创建完成后，复制连接字符串（格式：`postgresql://...`）

## 第二步：部署后端（Render）

1. 访问 https://render.com 注册账号
2. 点击 "New" → "Web Service"
3. 连接你的 GitHub 仓库
4. 配置：
   - **Name**: personal-library-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js`
5. 添加环境变量：
   - `DATABASE_URL`: 从Neon获取的连接字符串
   - `JWT_SECRET`: 随机字符串（如：`my-super-secret-key-12345`）
   - `NODE_ENV`: `production`
6. 点击 "Create Web Service"

部署完成后，你会得到一个后端URL，如：`https://personal-library-backend.onrender.com`

## 第三步：部署前端（Vercel）

1. 访问 https://vercel.com 注册账号
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置：
   - **Root Directory**: frontend
   - **Framework Preset**: Vite
5. 添加环境变量：
   - `VITE_API_URL`: 你的后端URL
6. 点击 "Deploy"

部署完成后，你会得到一个前端URL，如：`https://personal-library.vercel.app`

## 第四步：更新CORS配置

在后端Render的环境变量中添加：
- `FRONTEND_URL`: 你的前端URL

## 更新 vercel.json

将 `vercel.json` 中的后端URL替换为你的实际后端URL：

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://你的后端地址/api/$1" }
  ]
}
```

## 推送到GitHub

```bash
cd /Users/sunchang/personal-library
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/personal-library.git
git push -u origin main
```

## 免费额度说明

| 平台 | 免费额度 |
|------|---------|
| Vercel | 100GB带宽/月 |
| Render | 750小时/月 |
| Neon | 0.5GB存储，免费项目不休眠 |

## 常见问题

### 数据库连接失败
- 检查 DATABASE_URL 是否正确
- 确保Neon项目处于活跃状态

### CORS错误
- 确保 FRONTEND_URL 环境变量设置正确
- 检查后端是否成功部署

### 前端API请求失败
- 检查 VITE_API_URL 是否正确
- 确保后端服务正常运行
