-- ============================================================
-- 高考志愿辅助填报系统 - D1 (SQLite) 数据库初始化脚本
-- 从 MySQL/SQLAlchemy 模型转换而来
--
-- MySQL → SQLite 变更说明：
--   VARCHAR(n) → TEXT
--   INT → INTEGER
--   DATETIME → TEXT (ISO 8601 格式)
--   AUTO_INCREMENT → SQLite INTEGER PRIMARY KEY 自动处理
--   func.now() server_default → DEFAULT (datetime('now', 'localtime'))
--   onupdate=func.now() → D1/SQLite 不支持，改由应用层处理
--   ENGINE=InnoDB → 删除（SQLite 不需要）
-- ============================================================

-- 启用外键约束（每条连接独立设置，DDL 时也启用）
PRAGMA foreign_keys = ON;

-- ----------------------------
-- 1. 管理员表 admin
-- ----------------------------
CREATE TABLE IF NOT EXISTS admin (
    admin_id    TEXT PRIMARY KEY,
    password    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    comment     TEXT
);

-- ----------------------------
-- 2. 用户表 users
-- ----------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT PRIMARY KEY,
    password    TEXT NOT NULL,
    nickname    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 3. 高校表 university
-- ----------------------------
CREATE TABLE IF NOT EXISTS university (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    ranking     INTEGER,
    description TEXT,
    min_score   INTEGER,
    province    TEXT,
    admin_id    TEXT REFERENCES admin(admin_id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 4. 专业表 major
-- ----------------------------
CREATE TABLE IF NOT EXISTS major (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    description     TEXT,
    university_id   INTEGER REFERENCES university(id),
    admin_id        TEXT REFERENCES admin(admin_id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 5. 填报技巧表 skill
-- ----------------------------
CREATE TABLE IF NOT EXISTS skill (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    publisher   TEXT REFERENCES admin(admin_id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 6. 留言表 message
-- ----------------------------
CREATE TABLE IF NOT EXISTS message (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT REFERENCES users(user_id),
    content     TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 7. 浏览历史表 view_history
-- ----------------------------
CREATE TABLE IF NOT EXISTS view_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT REFERENCES users(user_id),
    university_id   INTEGER REFERENCES university(id),
    viewed_at       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 8. 用户成绩表 score
-- ----------------------------
CREATE TABLE IF NOT EXISTS score (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL REFERENCES users(user_id),
    score       INTEGER NOT NULL,
    rank        INTEGER,
    year        INTEGER NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 9. 历年录取数据表 admission_data
-- ----------------------------
CREATE TABLE IF NOT EXISTS admission_data (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id   INTEGER NOT NULL REFERENCES university(id),
    major_id        INTEGER REFERENCES major(id),
    year            INTEGER NOT NULL,
    min_score       INTEGER,
    min_rank        INTEGER,
    avg_score       INTEGER,
    enrollment_num  INTEGER,
    batch           TEXT
);

-- ----------------------------
-- 10. 志愿填报表 application
-- ----------------------------
CREATE TABLE IF NOT EXISTS application (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL REFERENCES users(user_id),
    university_id   INTEGER NOT NULL REFERENCES university(id),
    major_id        INTEGER REFERENCES major(id),
    priority        INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'draft',
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ----------------------------
-- 索引：提升查询性能
-- ----------------------------
CREATE INDEX IF NOT EXISTS idx_university_name ON university(name);
CREATE INDEX IF NOT EXISTS idx_university_province ON university(province);
CREATE INDEX IF NOT EXISTS idx_university_ranking ON university(ranking);
CREATE INDEX IF NOT EXISTS idx_major_university ON major(university_id);
CREATE INDEX IF NOT EXISTS idx_major_name ON major(name);
CREATE INDEX IF NOT EXISTS idx_score_user ON score(user_id);
CREATE INDEX IF NOT EXISTS idx_admission_university ON admission_data(university_id);
CREATE INDEX IF NOT EXISTS idx_application_user ON application(user_id);
CREATE INDEX IF NOT EXISTS idx_view_history_user ON view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_message_user ON message(user_id);
