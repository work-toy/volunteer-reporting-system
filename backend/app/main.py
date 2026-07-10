"""
应用入口 — 高考志愿辅助填报系统后端

本文件是 FastAPI 应用的入口模块，负责：
  - 创建 FastAPI 应用实例，配置标题、描述和版本号
  - 添加 CORS 中间件，允许前端开发服务器跨域访问 API
  - 注册各个功能模块的路由（认证、高校、专业、填报技巧、留言）
  - 定义根路径和健康检查接口
  - 应用启动时预热数据库连接池，避免首次请求延迟

启动命令（项目根目录下）:
    uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# 导入各个功能模块的路由器
# 每个路由器对应一组相关的 API 端点，按业务领域划分
from app.routers import auth, university, major, skill, message, score, application
from app.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理

    startup:
        - 预热数据库连接池：发送探针查询，使 SQLAlchemy 在第一个用户请求
          到达前就建立好连接池中的连接，避免首次请求的额外延迟。
    shutdown:
        - 关闭数据库引擎，释放所有连接池中的连接。
    """
    # startup: 预热连接池
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    # shutdown: 释放连接池
    await engine.dispose()


# 创建 FastAPI 应用实例
# 这是整个后端应用的入口对象，Uvicorn 将加载此对象提供 HTTP 服务
app = FastAPI(
    title="高考志愿辅助填报系统",
    description="《数据库系统》课程设计 - 后端API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 配置：允许前端（Vite 开发服务器）跨域访问
# CORS（跨域资源共享）机制用于控制浏览器是否允许来自不同源的网页访问本 API。
# 此处仅开放两个本地开发地址，生产环境应替换为实际的前端部署域名。
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,   # 允许跨域请求携带 Cookie（如 JWT token 通过 Cookie 传递时）
    allow_methods=["*"],      # 允许所有 HTTP 方法（GET, POST, PUT, DELETE, OPTIONS 等）
    allow_headers=["*"],      # 允许所有自定义请求头
)

# 注册路由
# 每个 include_router 调用会将对应模块中定义的所有路由注册到应用上。
# 路由前缀和标签在各模块的 APIRouter 创建时定义。
app.include_router(auth.router)
app.include_router(university.router)
app.include_router(major.router)
app.include_router(skill.router)
app.include_router(message.router)
app.include_router(score.router)
app.include_router(application.router)


@app.get("/")
async def root():
    """根路径接口 — 返回 API 欢迎信息和文档地址

    Returns:
        dict: 包含欢迎消息和 Swagger 文档 URL 的字典
    """
    return {
        "message": "欢迎使用高考志愿辅助填报系统 API",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    """健康检查接口 — 用于监控系统是否正常运行

    负载均衡器或容器编排平台（如 Docker、K8s）可定期调用此接口
    判断服务是否存活。返回 {"status": "ok"} 表示服务正常。

    Returns:
        dict: 包含状态信息的字典，{"status": "ok"} 表示服务正常运行
    """
    return {"status": "ok"}
