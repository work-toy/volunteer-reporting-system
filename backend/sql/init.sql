-- ============================================
-- 高考志愿辅助填报系统 - 数据库初始化脚本
-- 数据库: MySQL 8.0
-- ============================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS gaokao DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gaokao;

-- ============================================
-- 1. 管理员表
-- ============================================
CREATE TABLE IF NOT EXISTS admin (
    admin_id VARCHAR(20) PRIMARY KEY COMMENT '管理员ID',
    password VARCHAR(100) NOT NULL COMMENT '登录密码',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ============================================
-- 2. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(20) PRIMARY KEY COMMENT '用户ID',
    password VARCHAR(100) NOT NULL COMMENT '登录密码',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 3. 高校信息表
-- ============================================
CREATE TABLE IF NOT EXISTS university (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    name VARCHAR(100) NOT NULL COMMENT '高校名称',
    ranking INT DEFAULT NULL COMMENT '高校排名',
    description TEXT COMMENT '高校简介',
    min_score INT DEFAULT NULL COMMENT '历史最低录取分数',
    province VARCHAR(50) DEFAULT NULL COMMENT '所在省份',
    admin_id VARCHAR(20) DEFAULT NULL COMMENT '最后修改管理员',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_ranking (ranking),
    INDEX idx_min_score (min_score),
    INDEX idx_province (province)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='高校信息表';

-- ============================================
-- 4. 专业信息表
-- ============================================
CREATE TABLE IF NOT EXISTS major (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    name VARCHAR(100) NOT NULL COMMENT '专业名称',
    description TEXT COMMENT '专业简介',
    university_id INT DEFAULT NULL COMMENT '所属高校ID',
    admin_id VARCHAR(20) DEFAULT NULL COMMENT '最后修改管理员',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (university_id) REFERENCES university(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专业信息表';

-- ============================================
-- 5. 填报技巧表
-- ============================================
CREATE TABLE IF NOT EXISTS skill (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '技巧编号',
    title VARCHAR(200) NOT NULL COMMENT '技巧标题',
    content TEXT NOT NULL COMMENT '技巧内容',
    publisher VARCHAR(20) DEFAULT NULL COMMENT '发布人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    FOREIGN KEY (publisher) REFERENCES admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='填报技巧表';

-- ============================================
-- 6. 留言板表
-- ============================================
CREATE TABLE IF NOT EXISTS message (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '留言编号',
    user_id VARCHAR(20) DEFAULT NULL COMMENT '留言用户ID',
    content TEXT NOT NULL COMMENT '留言内容',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '留言时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='留言板表';

-- ============================================
-- 7. 浏览记录表
-- ============================================
CREATE TABLE IF NOT EXISTS view_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) DEFAULT NULL COMMENT '用户ID',
    university_id INT DEFAULT NULL COMMENT '高校ID',
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (university_id) REFERENCES university(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_view (user_id, viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='浏览记录表';

-- ============================================
-- 8. 用户成绩表
-- ============================================
CREATE TABLE IF NOT EXISTS score (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL COMMENT '用户ID',
    score INT NOT NULL COMMENT '高考总分',
    `rank` INT DEFAULT NULL COMMENT '全省位次',
    year INT NOT NULL DEFAULT 2025 COMMENT '高考年份',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_year (user_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成绩表';

-- ============================================
-- 9. 历年录取数据表
-- ============================================
CREATE TABLE IF NOT EXISTS admission_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    university_id INT NOT NULL COMMENT '高校ID',
    major_id INT DEFAULT NULL COMMENT '专业ID',
    year INT NOT NULL COMMENT '录取年份',
    min_score INT DEFAULT NULL COMMENT '最低录取分',
    min_rank INT DEFAULT NULL COMMENT '最低录取位次',
    avg_score INT DEFAULT NULL COMMENT '平均录取分',
    enrollment_num INT DEFAULT NULL COMMENT '录取人数',
    batch VARCHAR(20) DEFAULT NULL COMMENT '录取批次',
    FOREIGN KEY (university_id) REFERENCES university(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (major_id) REFERENCES major(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_uni_year (university_id, year),
    INDEX idx_score (min_score),
    INDEX idx_rank (min_rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='历年录取数据表';

-- ============================================
-- 10. 志愿填报表
-- ============================================
CREATE TABLE IF NOT EXISTS application (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL COMMENT '用户ID',
    university_id INT NOT NULL COMMENT '高校ID',
    major_id INT DEFAULT NULL COMMENT '专业ID',
    priority INT NOT NULL COMMENT '志愿顺序',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (university_id) REFERENCES university(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (major_id) REFERENCES major(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='志愿填报表';

-- 视图
CREATE OR REPLACE VIEW v_university_major AS
SELECT u.id AS uni_id, u.name AS uni_name, u.ranking,
       u.description AS uni_description, u.min_score, u.province,
       m.id AS major_id, m.name AS major_name, m.description AS major_description
FROM university u LEFT JOIN major m ON u.id = m.university_id;
