# 高考志愿辅助填报系统 — API 接口文档

> 版本：v1.0  
> 后端技术栈：FastAPI + SQLAlchemy + MySQL  
> 本文档由后端开发 **彭超** 编写，前端开发 **方禹程** 按此文档对接联调

---

## 目录

1. [通用说明](#1-通用说明)
2. [认证模块](#2-认证模块-auth)
3. [高校信息模块](#3-高校信息模块-university)
4. [专业信息模块](#4-专业信息模块-major)
5. [成绩录入模块](#5-成绩录入模块-score)
6. [志愿填报模块](#6-志愿填报模块-application)
7. [填报技巧模块](#7-填报技巧模块-skill)
8. [留言板模块](#8-留言板模块-message)
9. [健康检查](#9-健康检查)

---

## 1. 通用说明

### 1.1 基础地址

```
开发环境：http://localhost:8000
```

所有 API 路径均以 `/api` 开头。

### 1.2 请求格式

- Content-Type: `application/json`
- 需要登录的接口在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

### 1.3 响应格式

成功响应直接返回 JSON 对象或数组。

错误响应格式：

```json
{
  "detail": "错误描述信息"
}
```

### 1.4 状态码说明

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 无效 |
| 403 | 权限不足（非管理员） |
| 404 | 资源不存在 |

---

## 2. 认证模块 `/api/auth`

### 2.1 用户登录

```
POST /api/auth/user/login
```

**请求体：**

```json
{
  "user_id": "stu001",
  "password": "123456"
}
```

**响应：**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "role": "user",
  "username": "stu001"
}
```

### 2.2 用户注册

```
POST /api/auth/user/register
```

**请求体：**

```json
{
  "user_id": "stu002",
  "password": "123456"
}
```

**响应：**

```json
{
  "message": "注册成功",
  "user_id": "stu002"
}
```

### 2.3 管理员登录

```
POST /api/auth/admin/login
```

**请求体：**

```json
{
  "admin_id": "admin",
  "password": "123456"
}
```

**响应：**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "role": "admin",
  "username": "admin"
}
```

---

## 3. 高校信息模块 `/api/university`

### 3.1 获取高校列表

```
GET /api/university/list
```

**查询参数（可选）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| province | string | 按省份筛选 |
| keyword | string | 按名称模糊搜索 |

**响应：**

```json
[
  {
    "id": 1,
    "name": "清华大学",
    "ranking": 1,
    "description": "中国顶尖高等学府，工科榜首...",
    "min_score": 700,
    "province": "北京",
    "created_at": "2025-01-01T00:00:00"
  },
  {
    "id": 2,
    "name": "北京大学",
    "ranking": 2,
    "description": "中国第一所国立综合性大学...",
    "min_score": 698,
    "province": "北京",
    "created_at": "2025-01-01T00:00:00"
  }
]
```

### 3.2 获取高校详情

```
GET /api/university/{uni_id}
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| uni_id | int | 高校 ID |

**响应：**

```json
{
  "id": 1,
  "name": "清华大学",
  "ranking": 1,
  "description": "中国顶尖高等学府，工科榜首...",
  "min_score": 700,
  "province": "北京",
  "created_at": "2025-01-01T00:00:00"
}
```

### 3.3 获取省份列表

```
GET /api/university/provinces/list
```

**响应：**

```json
{
  "provinces": ["北京", "广东", "上海", "湖北", ...]
}
```

### 3.4 智能推荐（估分选大学）

```
POST /api/university/recommend
```

**请求体：**

```json
{
  "score": 580
}
```

**响应：**

```json
[
  {
    "id": 15,
    "name": "郑州大学",
    "ranking": 50,
    "min_score": 560,
    "province": "河南",
    "match_degree": "稳妥"
  },
  {
    "id": 22,
    "name": "河南大学",
    "ranking": 75,
    "min_score": 530,
    "province": "河南",
    "match_degree": "保底"
  },
  {
    "id": 8,
    "name": "武汉大学",
    "ranking": 9,
    "min_score": 595,
    "province": "湖北",
    "match_degree": "冲刺"
  }
]
```

> **匹配规则：** 分数差 >= 30 → "保底" / >= 0 → "稳妥" / < 0 → "冲刺"

### 3.5 获取历年录取数据

```
GET /api/university/{uni_id}/admission
```

**响应：**

```json
[
  {
    "id": 1,
    "university_id": 1,
    "year": 2025,
    "min_score": 700,
    "min_rank": 85,
    "avg_score": 705,
    "enrollment_num": 180,
    "batch": "本科一批"
  },
  {
    "id": 2,
    "university_id": 1,
    "year": 2024,
    "min_score": 698,
    "min_rank": 92,
    "avg_score": 702,
    "enrollment_num": 175,
    "batch": "本科一批"
  }
]
```

### 3.6 添加高校（管理员）

```
POST /api/university/create
```

**请求头：** `Authorization: Bearer <admin-token>`

**请求体：**

```json
{
  "name": "新乡学院",
  "ranking": 350,
  "description": "一所位于河南新乡的应用型本科院校",
  "min_score": 420,
  "province": "河南"
}
```

**响应：**

```json
{
  "message": "添加成功"
}
```

### 3.7 更新高校信息（管理员）

```
PUT /api/university/{uni_id}
```

**请求体（所有字段可选）：**

```json
{
  "name": "新乡学院（更新后）",
  "min_score": 430
}
```

**响应：**

```json
{
  "message": "更新成功"
}
```

### 3.8 删除高校（管理员）

```
DELETE /api/university/{uni_id}
```

**响应：**

```json
{
  "message": "删除成功"
}
```

---

## 4. 专业信息模块 `/api/major`

### 4.1 获取专业列表

```
GET /api/major/list
```

**查询参数（可选）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| university_id | int | 按高校筛选 |

**响应：**

```json
[
  {
    "id": 1,
    "name": "计算机科学与技术",
    "description": "培养具备计算机软硬件开发能力的高级工程技术人才",
    "university_id": 1,
    "created_at": "2025-01-01T00:00:00"
  },
  {
    "id": 2,
    "name": "电子信息工程",
    "description": "培养电子技术、通信技术领域的高级人才",
    "university_id": 1,
    "created_at": "2025-01-01T00:00:00"
  }
]
```

### 4.2 获取专业详情

```
GET /api/major/{major_id}
```

**响应：**

```json
{
  "id": 1,
  "name": "计算机科学与技术",
  "description": "培养具备计算机软硬件开发能力的高级工程技术人才",
  "university_id": 1,
  "created_at": "2025-01-01T00:00:00"
}
```

### 4.3 添加专业（管理员）

```
POST /api/major/create
```

**请求体：**

```json
{
  "name": "人工智能",
  "description": "培养AI领域的高级应用型人才",
  "university_id": 1
}
```

**响应：**

```json
{
  "message": "添加成功"
}
```

### 4.4 更新专业（管理员）

```
PUT /api/major/{major_id}
```

**请求体：**

```json
{
  "name": "人工智能（更新后）",
  "description": "更新后的专业描述",
  "university_id": 1
}
```

**响应：**

```json
{
  "message": "更新成功"
}
```

### 4.5 删除专业（管理员）

```
DELETE /api/major/{major_id}
```

**响应：**

```json
{
  "message": "删除成功"
}
```

---

## 5. 成绩录入模块 `/api/score`

### 5.1 录入成绩

```
POST /api/score/entry
```

**请求体：**

```json
{
  "score": 580,
  "rank": 35000,
  "year": 2025
}
```

**响应：**

```json
{
  "id": 1,
  "score": 580,
  "rank": 35000,
  "year": 2025,
  "created_at": "2025-07-08T10:30:00"
}
```

### 5.2 获取成绩历史

```
GET /api/score/history
```

**响应：**

```json
[
  {
    "id": 1,
    "score": 580,
    "rank": 35000,
    "year": 2025,
    "created_at": "2025-07-08T10:30:00"
  }
]
```

### 5.3 获取最新成绩

```
GET /api/score/latest
```

**响应：**

```json
{
  "id": 1,
  "score": 580,
  "rank": 35000,
  "year": 2025,
  "created_at": "2025-07-08T10:30:00"
}
```

---

## 6. 志愿填报模块 `/api/application`

### 6.1 获取志愿列表

```
GET /api/application/list
```

**响应：**

```json
[
  {
    "id": 1,
    "user_id": "stu001",
    "university_id": 15,
    "major_id": 30,
    "priority": 1,
    "status": "draft",
    "created_at": "2025-07-10T09:00:00",
    "updated_at": "2025-07-10T09:00:00",
    "university_name": "郑州大学",
    "major_name": "计算机科学与技术"
  },
  {
    "id": 2,
    "user_id": "stu001",
    "university_id": 22,
    "major_id": null,
    "priority": 2,
    "status": "draft",
    "created_at": "2025-07-10T09:05:00",
    "updated_at": "2025-07-10T09:05:00",
    "university_name": "河南大学",
    "major_name": null
  }
]
```

### 6.2 添加志愿

```
POST /api/application/add
```

**请求体：**

```json
{
  "university_id": 15,
  "major_id": 30,
  "priority": 1
}
```

**响应：** 同 6.1 中的单条记录格式

### 6.3 修改志愿

```
PUT /api/application/{app_id}
```

**请求体（所有字段可选）：**

```json
{
  "major_id": 32,
  "priority": 2
}
```

**响应：** 同 6.1 中的单条记录格式

### 6.4 删除志愿

```
DELETE /api/application/{app_id}
```

**响应：**

```json
{
  "message": "删除成功"
}
```

### 6.5 重排志愿顺序

```
POST /api/application/reorder
```

**请求体（传入按新顺序排列的 ID 列表）：**

```json
{
  "ids": [2, 1, 3]
}
```

**响应：**

```json
{
  "message": "重排成功"
}
```

### 6.6 提交志愿

```
POST /api/application/submit
```

将所有草稿状态志愿改为已提交。

**响应：**

```json
{
  "message": "已提交 3 个志愿",
  "count": 3
}
```

### 6.7 撤销提交

```
POST /api/application/withdraw
```

将已提交状态志愿改回草稿。

**响应：**

```json
{
  "message": "已撤销 3 个志愿的提交",
  "count": 3
}
```

### 6.8 风险预警检查

```
GET /api/application/check-risk
```

分析当前用户的志愿列表，检查冲稳保比例、重复院校、分数倒挂等问题。

**响应：**

```json
{
  "total": 4,
  "reach": 1,
  "stable": 2,
  "safe": 1,
  "has_duplicate": false,
  "has_reverse": true,
  "warnings": [
    "志愿数量偏少（4个），建议至少填报 6 个",
    "存在分数倒挂（高分院校排在低分院校后面），请调整顺序"
  ],
  "suggestion": "建议按 2:4:4 比例分配冲稳保：约 1 个冲刺、2 个稳妥、2 个保底"
}
```

---

## 7. 填报技巧模块 `/api/skill`

### 7.1 获取技巧列表

```
GET /api/skill/list
```

**响应：**

```json
[
  {
    "id": 1,
    "title": "如何科学填报高考志愿",
    "content": "高考志愿填报是每位考生和家长面临的重要选择...",
    "publisher": "admin",
    "created_at": "2025-07-08T12:00:00"
  }
]
```

### 7.2 获取技巧详情

```
GET /api/skill/{skill_id}
```

### 7.3 添加技巧（管理员）

```
POST /api/skill/create
```

### 7.4 更新技巧（管理员）

```
PUT /api/skill/{skill_id}
```

### 7.5 删除技巧（管理员）

```
DELETE /api/skill/{skill_id}
```

---

## 8. 留言板模块 `/api/message`

### 8.1 获取留言列表

```
GET /api/message/list
```

**响应：**

```json
[
  {
    "id": 1,
    "user_id": "stu001",
    "content": "请问这个系统的推荐算法准确吗？",
    "created_at": "2025-07-10T14:00:00"
  }
]
```

### 8.2 发布留言

```
POST /api/message/create
```

**请求体：**

```json
{
  "content": "请问这个系统的推荐算法准确吗？"
}
```

**响应：**

```json
{
  "message": "留言成功"
}
```

### 8.3 删除留言（管理员）

```
DELETE /api/message/{msg_id}
```

---

## 9. 健康检查

```
GET /api/health
```

**响应：**

```json
{
  "status": "ok"
}
```

```
GET /
```

**响应：**

```json
{
  "message": "欢迎使用高考志愿辅助填报系统 API",
  "docs": "/docs"
}
```

---

## 附录：数据库表结构

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| admin | 管理员表 | admin_id, password |
| users | 用户表 | user_id, password, nickname |
| university | 高校表 | id, name, ranking, description, min_score, province |
| major | 专业表 | id, name, description, university_id |
| skill | 填报技巧表 | id, title, content, publisher |
| message | 留言板表 | id, user_id, content |
| score | 成绩表 | id, user_id, score, rank, year |
| application | 志愿填报表 | id, user_id, university_id, major_id, priority, status |
| admission_data | 历年录取数据 | id, university_id, major_id, year, min_score, min_rank |
| view_history | 浏览记录 | id, user_id, university_id, viewed_at |

---

> 文档维护者：彭超  
> 最后更新：2026-07-08
