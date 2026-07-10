"""
数据库会话管理 — 高考志愿辅助填报系统后端

本文件负责：
  - 创建异步 SQLAlchemy 引擎（engine），管理与 MySQL 数据库的连接池
  - 创建异步会话工厂（async_sessionmaker），用于生成数据库会话
  - 提供 FastAPI 依赖注入函数 get_db()，确保每个请求使用独立的数据库会话，
    并在请求结束后自动关闭会话，释放连接回连接池
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import DATABASE_URL

# 创建异步数据库引擎
# engine 是 SQLAlchemy 的核心接口，负责管理与数据库的连接池。
#   - DATABASE_URL: 从 config.py 中读取的异步 MySQL 连接字符串
#   - echo=True:    在控制台输出所有 SQL 语句（开发调试用，生产环境应关闭）
#   - pool_size=10: 连接池中保持的持久连接数，避免每次请求都重新建立 TCP 连接
#   - max_overflow=20: 当连接池中的连接被占满时，允许额外创建的最大连接数（突发流量）
engine = create_async_engine(DATABASE_URL, echo=False, pool_size=10, max_overflow=20)

# 创建异步会话工厂
# async_sessionmaker 是用于创建 AsyncSession 实例的工厂。
#   - expire_on_commit=False: 提交事务后不自动过期会话中的对象，
#     这样在事务提交后仍然可以访问模型对象的属性（惰性加载场景需要）
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI 依赖注入：获取数据库会话

    作为 FastAPI 的依赖（Depends）使用，提供请求维度的数据库会话管理。

    Yields:
        AsyncSession: SQLAlchemy 异步数据库会话对象

    用法:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...

    说明:
        - 使用 async with 上下文管理器确保会话被正确获取和释放
        - try/finally 保证即使在请求处理过程中抛出异常，会话也会被关闭
        - 每个请求独立获取一个会话，避免线程安全问题
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
