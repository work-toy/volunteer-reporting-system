# 高考志愿辅助填报系统

基于 **Next.js + Hono + Cloudflare Workers + D1** 的高考志愿辅助填报平台。

> 🚀 **在线体验**：https://volunteer.lxpavilion.top
>
> 测试账号：`zhangsan` / `123456` | 管理员：`admin` / `123456`

## 功能概览

| 角色 | 功能 |
|------|------|
| **普通用户** | 注册/登录、成绩录入、浏览高校与专业、估分推荐大学、志愿填报、风险预警、查看填报技巧、留言互动 |
| **管理员** | 管理高校信息、管理专业信息、发布填报技巧、管理留言 |

### 页面路由

| 路径 | 页面 | 权限 |
|------|------|------|
| `/select` | 角色选择（用户/管理员） | 公开 |
| `/user-login` | 用户登录 | 公开 |
| `/user-register` | 用户注册 | 公开 |
| `/admin-login` | 管理员登录 | 公开 |
| `/home` | 首页概览 | 登录用户 |
| `/university` | 高校列表（支持按省份/关键词筛选） | 登录用户 |
| `/university/[id]` | 高校详情（含专业列表、历年录取数据） | 登录用户 |
| `/score` | 成绩录入 | 登录用户 |
| `/recommend` | 估分选大学 | 登录用户 |
| `/application` | 志愿填报 | 登录用户 |
| `/risk` | 风险预警 | 登录用户 |
| `/skill` | 填报技巧 | 登录用户 |
| `/message` | 留言板 | 登录用户 |
| `/admin` | 管理后台首页 | 管理员 |
| `/admin/universities` | 高校管理（增删改） | 管理员 |
| `/admin/majors` | 专业管理（增删改） | 管理员 |
| `/admin/skills` | 技巧管理（增删改） | 管理员 |
| `/admin/messages` | 留言管理（删除） | 管理员 |

### API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `POST /api/auth/user/login` | 用户登录 |
| `POST /api/auth/user/register` | 用户注册 |
| `POST /api/auth/admin/login` | 管理员登录 |
| `GET /api/university/list` | 高校列表（支持 `?province=&keyword=`） |
| `GET /api/university/provinces/list` | 省份列表 |
| `GET /api/university/{id}` | 高校详情 |
| `POST /api/university/create` | 添加高校（管理员） |
| `PUT /api/university/{id}` | 更新高校（管理员） |
| `DELETE /api/university/{id}` | 删除高校（管理员） |
| `POST /api/university/recommend` | 估分推荐大学 |
| `GET /api/university/{id}/admission` | 历年录取数据 |
| `GET /api/major/list` | 专业列表（支持 `?university_id=`） |
| `POST /api/major/create` | 添加专业（管理员） |
| `PUT /api/major/{id}` | 更新专业（管理员） |
| `DELETE /api/major/{id}` | 删除专业（管理员） |
| `GET /api/skill/list` | 技巧列表 |
| `POST /api/skill/create` | 发布技巧（管理员） |
| `PUT /api/skill/{id}` | 更新技巧（管理员） |
| `DELETE /api/skill/{id}` | 删除技巧（管理员） |
| `GET /api/message/list` | 留言列表 |
| `POST /api/message/create` | 发布留言 |
| `DELETE /api/message/{id}` | 删除留言（本人或管理员） |
| `GET /api/score/history` | 成绩列表 |
| `GET /api/score/latest` | 最新成绩 |
| `POST /api/score/entry` | 录入成绩 |
| `GET /api/application/list` | 志愿列表（需登录） |
| `POST /api/application/add` | 添加志愿 |
| `POST /api/application/submit` | 提交志愿 |
| `POST /api/application/withdraw` | 撤回志愿 |
| `POST /api/application/reorder` | 重排志愿顺序 |
| `GET /api/application/check-risk` | 风险预警 |

## 技术栈

| 层 | 技术 |
|----|------|
| **前端** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand |
| **后端** | TypeScript, Hono, Cloudflare Workers, D1 (SQLite) |
| **数据库** | Cloudflare D1 (SQLite) |
| **认证** | JWT (HS256) |
| **部署** | Cloudflare Workers (Static Assets + API) |

## 项目结构

```
gaokao-helper/
├── backend/                       # Python 后端（原始版，MySQL）
│   └── app/
│       ├── main.py                # FastAPI 应用入口
│       ├── config.py
│       ├── database.py
│       ├── routers/               # 7 个路由模块
│       ├── models/
│       └── schemas/
│
├── frontend/                      # Next.js 前端（原始版）
│
├── frontend-worker/               # Cloudflare Workers 部署版前端（复制自 frontend）
│   ├── app/                       # 页面组件
│   ├── components/                # UI 组件
│   ├── lib/api.ts                 # API 封装
│   └── next.config.ts             # output: "export"
│
├── worker/                        # Cloudflare Worker API
│   ├── src/
│   │   ├── index.ts               # Hono 应用入口
│   │   ├── middleware.ts           # JWT 认证中间件
│   │   ├── config.ts              # 配置
│   │   ├── types.ts               # 类型定义
│   │   └── routers/               # 7 个路由模块（D1 版）
│   ├── wrangler.jsonc             # Worker 配置（含 D1 + Assets）
│   ├── schema_d1.sql              # D1 建表 SQL
│   └── seed_d1.sql                # 种子数据
│
└── README.md
```

## 部署到 Cloudflare Workers

### 前置要求

- Node.js >= 18
- npm
- [Cloudflare 账号](https://dash.cloudflare.com)

### 1. 初始化 D1 数据库

```bash
cd worker

# 创建数据库
npx wrangler d1 create gaokao-db

# 建表
npx wrangler d1 execute gaokao-db --remote --file=schema_d1.sql

# 导入种子数据
npx wrangler d1 execute gaokao-db --remote --file=seed_d1.sql
```

### 2. 构建前端

```bash
cd frontend-worker
npm install
npm run build   # 生成静态文件到 out/
cp -r out ../worker/dist
```

### 3. 部署 Worker

```bash
cd worker
npm install
npx wrangler deploy
```

> 一个域名全搞定：`https://volunteer.lxpavilion.top`
> - `/` → 前端静态页面
> - `/api/*` → Worker API

## 本地开发

### 后端（Python 版，仅供本地调试）

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev      # 访问 http://localhost:5173
```

> 前端通过 Next.js `rewrites` 将 `/api/*` 代理到 `http://localhost:8000/api/*`

## 数据概览

系统预置了完整的演示数据，登录后即可体验所有功能：

| 数据 | 数量 | 说明 |
|------|:----:|------|
| **高校** | 112 所 | 覆盖 700~288 分，含顶尖、985、211、一本、二本、专科 |
| **专业** | 178 个 | 前 50 名高校均有详细专业介绍 |
| **录取数据** | 150 条 | 前 50 所高校近 3 年（2023-2025）录取数据 |
| **填报技巧** | 10 篇 | 冲稳保策略、选校建议等 |
| **预置用户** | 6 个 | 各有不同分数段，含成绩和志愿数据 |

**演示账号**（密码均为 `123456`）：

| 账号 | 分数 | 说明 |
|------|:----:|------|
| `zhangsan` | 620 | 数据最全，6 个志愿 |
| `gaokao2026` | 585 | 6 个志愿 |
| `wangfang` | 645 | 5 个志愿（冲刺方案） |
| `tang` | 530 | 可手动体验 |
| `lihua` | 480 | 可手动体验 |
| `zhaoyi` | 560 | 可手动体验 |

## License

MIT
