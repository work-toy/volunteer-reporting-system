# 高考志愿辅助填报系统

基于 Next.js + FastAPI + MySQL 的高考志愿辅助填报平台。

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
| `/recommend` | 估分选大学 | 登录用户 |
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
| `DELETE /api/message/{id}` | 删除留言（管理员） |

## 技术栈

| 层 | 技术 |
|----|------|
| **前端** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand |
| **后端** | Python 3.11+, FastAPI, SQLAlchemy (asyncio), aiomysql |
| **数据库** | MySQL 8.0 |
| **认证** | JWT (python-jose) |

## 环境要求

- **Node.js** >= 18
- **npm** >= 8 (或 pnpm)
- **Python** >= 3.11
- **MySQL** >= 8.0

## 快速启动

### 1. 克隆项目

```bash
git clone https://gitee.com/peng-chao2005/gaokao-helper.git
cd gaokao-helper
```

### 2. 数据库初始化

确保 MySQL 服务已启动，然后执行：

```bash
mysql -h localhost -P 3307 -u root -p < backend/sql/init.sql
mysql -h localhost -P 3307 -u root -p < backend/sql/seed.sql
mysql -h localhost -P 3307 -u root -p < backend/sql/sp.sql
```

> **数据库配置**：连接信息在 `backend/app/config.py` 中，默认 `localhost:3307`、用户 `root`、密码 `root123`、数据库 `gaokao`。
> 如果你的 MySQL 端口、账号或密码与上述不同，需要**同步修改两个地方**：一是 mysql 命令中的连接参数（`-P`、`-u`、`-p`），二是 `backend/app/config.py` 中的 `DATABASE_CONFIG`（见下方示例），保证两边的端口/账号/密码一致。
>
> ```python
> # backend/app/config.py
> DATABASE_CONFIG = {
>     "host": "localhost",
>     "port": 3307,    # 按实际 MySQL 端口修改
>     "user": "root",
>     "password": "root123",
>     "database": "gaokao",
> }
> ```
>
> **默认管理员**：`admin` / `123456`
>
> **演示用户**（密码均为 `123456`）：
> - `zhangsan`（620分，6个志愿，数据最全）
> - `gaokao2026`（585分，6个志愿）
> - `wangfang`（645分，5个志愿）
> - `tang` / `lihua` / `zhaoyi`（可手动体验）

### 3. 启动后端

#### 方式 A：使用 uv（推荐）

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 方式 B：使用标准 Python

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> 如果 8000 端口被占用，可将 `--port 8000` 改为其他端口（如 `--port 9000`），同时需要同步修改前端 `frontend/next.config.ts` 中 `rewrites` 代理的目标端口。

### 4. 启动前端（开发模式）

```bash
cd frontend
npm install
npm run dev
```

前端启动后访问：http://localhost:5173

> 前端通过 Next.js 的 `rewrites` 代理将 `/api/*` 请求转发到后端 `http://localhost:8000/api/*`（配置见 `frontend/next.config.ts`）。
> 如果后端端口改了，需同步修改 `frontend/next.config.ts` 中的 `destination` 地址。
> 如需修改前端开发服务器端口，可在命令后加 `--port` 参数：`npm run dev -- --port 3000`。

## 生产模式启动

### 后端

按快速启动第 3 步「方式 B（标准 Python）」安装依赖并激活虚拟环境，
启动时去掉 `--reload` 标志：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

> 生产模式去掉 `--reload` 标志，避免热重载带来的额外开销。
> 也支持使用 `uv` 启动（需先 `uv sync`）：`uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1`

后端启动后访问：
- API 服务：http://localhost:8000
- API 文档（Swagger）：http://localhost:8000/docs

### 前端

```bash
cd frontend
npm install
npm run build   # 预编译为静态文件（JS/CSS 压缩、Tree Shaking、代码优化）
npm start       # 启动生产服务器，端口 3000
```

> 如需修改生产服务器端口，可使用 `-p` 参数：`npm start -- -p 3001`，或设置环境变量 `PORT=3001`。

> **生产模式更快** 

前端启动后访问：http://localhost:3000

> 前端通过 Next.js 的 `rewrites` 代理将 `/api/*` 请求转发到后端 `http://localhost:8000/api/*`（配置见 `frontend/next.config.ts`）。

## 数据概览

系统预置了完整的演示数据，登录后即可体验所有功能：

| 数据 | 数量 | 说明 |
|------|:----:|------|
| **高校** | 112 所 | 覆盖 700~288 分，含顶尖、985、211、一本、二本、专科 |
| **专业** | 178 个 | 前 50 名高校均有详细专业介绍 |
| **录取数据** | 150 条 | 前 50 所高校近 3 年（2023-2025）录取数据 |
| **填报技巧** | 10 篇 | 冲稳保策略、选校建议等 |
| **预置用户** | 6 个 | 各有不同分数段，含成绩和志愿数据 |

## 项目结构

```
gaokao-helper/
├── backend/                    # Python 后端
│   ├── app/
│   │   ├── main.py             # FastAPI 应用入口
│   │   ├── config.py           # 数据库 & JWT 配置
│   │   ├── database.py         # 数据库连接（SQLAlchemy AsyncSession）
│   │   ├── models/
│   │   │   └── models.py       # SQLAlchemy ORM 模型
│   │   ├── routers/
│   │   │   ├── auth.py         # 认证接口（登录/注册）
│   │   │   ├── university.py   # 高校信息接口
│   │   │   ├── major.py        # 专业信息接口
│   │   │   ├── skill.py        # 填报技巧接口
│   │   │   ├── message.py      # 留言板接口
│   │   │   ├── score.py        # 成绩录入接口
│   │   │   └── application.py  # 志愿填报+风险预警接口
│   │   └── schemas/
│   │       └── schemas.py      # Pydantic 数据模型
│   ├── sql/
│   │   ├── init.sql            # 建表 & 基础数据
│   │   ├── seed.sql            # 测试数据
│   │   └── sp.sql              # 存储过程
│   ├── pyproject.toml          # uv 项目配置
│   └── requirements.txt        # pip 依赖
│
├── frontend/                   # Next.js 前端
│   ├── app/
│   │   ├── page.tsx            # 根页面（重定向至 /select）
│   │   ├── layout.tsx          # 根布局
│   │   ├── globals.css         # 全局样式
│   │   ├── (auth)/             # 认证相关页面
│   │   │   ├── select/
│   │   │   ├── user-login/
│   │   │   ├── user-register/
│   │   │   └── admin-login/
│   │   ├── (main)/             # 用户主功能页面
│   │   │   ├── home/
│   │   │   ├── score/          # 成绩录入
│   │   │   ├── university/
│   │   │   ├── recommend/
│   │   │   ├── application/    # 志愿填报
│   │   │   ├── risk/           # 风险预警
│   │   │   ├── skill/
│   │   │   └── message/
│   │   └── admin/              # 管理后台页面
│   │       ├── universities/
│   │       ├── majors/
│   │       ├── skills/
│   │       └── messages/
│   ├── components/             # UI 组件
│   │   ├── ui/                 # 通用组件（Button、Input、Select、Dialog 等）
│   │   └── layout/             # 布局组件（Header、Sidebar）
│   ├── lib/
│   │   └── api.ts              # API 请求封装
│   ├── stores/
│   │   └── authStore.ts        # Zustand 状态管理
│   ├── next.config.ts          # Next.js 配置（含 API 代理）
│   └── package.json
│
└── README.md
```

