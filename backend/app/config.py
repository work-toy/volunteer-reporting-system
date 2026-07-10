"""
配置文件 — 高考志愿辅助填报系统后端

本文件集中管理应用的所有配置项，包括：
  - 数据库连接配置（主机、端口、用户、密码、数据库名）
  - JWT（JSON Web Token）认证配置（密钥、算法、过期时间）

任何与环境相关的敏感参数都应在此处统一定义，方便维护和修改。
"""

# 数据库配置
# DATABASE_CONFIG 字典定义了 MySQL 数据库的连接参数。
# 这些参数将被组装成 SQLAlchemy 所需的异步数据库 URL。
DATABASE_CONFIG = {
    "host": "localhost",      # 数据库主机地址，本地开发时使用 localhost
    "port": 3307,            # 数据库端口号，非标准 3306 端口
    "user": "root",          # 数据库登录用户名
    "password": "root123",   # 数据库登录密码（生产环境应使用环境变量或密钥管理服务）
    "database": "gaokao",    # 数据库名称，存储高考志愿相关数据
}

# 构建异步数据库连接 URL
# 使用 aiomysql 作为异步 MySQL 驱动，charset=utf8mb4 支持完整的 Unicode（包括 emoji）
DATABASE_URL = (
    f"mysql+aiomysql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}"
    f"@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}"
    f"/{DATABASE_CONFIG['database']}?charset=utf8mb4"
)

# JWT 配置
# SECRET_KEY 用于签名 JWT token，生产环境应替换为足够复杂且保密的随机字符串
SECRET_KEY = "gaokao-helper-secret-key-2024"
ALGORITHM = "HS256"                        # JWT 签名算法，HS256 为 HMAC-SHA256
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8小时  # Token 过期时间（分钟），设定为 8 小时
