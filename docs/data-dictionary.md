# 数据库数据字典

> 维护者：鲁瑜  
> 最后更新：2026-07-08

## 表总览

| 表名 | 说明 | 核心功能 |
|------|------|----------|
| admin | 管理员表 | 后台登录、数据管理 |
| users | 用户表 | 考生注册、登录 |
| university | 高校信息表 | 院校库展示、分数匹配 |
| major | 专业信息表 | 专业列表、志愿选择 |
| skill | 填报技巧表 | 技巧文章展示 |
| message | 留言板 | 用户反馈 |
| view_history | 浏览记录 | 用户行为分析 |
| score | 成绩表 | 成绩录入、位次换算 |
| admission_data | 历年录取数据 | 分数匹配、推荐引擎 |
| application | 志愿填报表 | 志愿填报模拟 |

## 核心表字段说明

### university（高校信息表）
| 字段 | 类型 | 说明 | 用途 |
|------|------|------|------|
| ranking | INT | 综合排名 | 列表排序 |
| min_score | INT | 历史最低录取分 | 估分匹配 |
| province | VARCHAR | 所在省份 | 筛选过滤 |

### application（志愿填报表）
| 字段 | 类型 | 说明 | 用途 |
|------|------|------|------|
| priority | INT | 志愿顺序（1开始） | 排序展示 |
| status | VARCHAR | draft/submitted | 提交流程 |

## 索引策略

| 表 | 索引 | 类型 | 用途 |
|----|------|------|------|
| university | idx_ranking | 排序 | 排名展示 |
| university | idx_min_score | 范围 | 分数匹配查询 |
| university | idx_province | 分组 | 省份筛选 |
| application | idx_user_status | 复合 | 用户志愿状态查询 |

## 外键关系

```
admin 1:N university — 管理员管理高校
admin 1:N major — 管理员管理专业
university 1:N major — 高校拥有专业
user 1:N score — 用户成绩
user 1:N application — 用户志愿
university 1:N admission_data — 高校录取数据
```
