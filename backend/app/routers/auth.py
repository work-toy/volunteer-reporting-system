# ---- 标准库与第三方依赖导入 ----
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession          # 异步数据库会话
from sqlalchemy import text                               # 原生 SQL 查询
from jose import jwt, JWTError                            # JWT 编解码与异常
from datetime import datetime, timedelta                  # 时间计算
from typing import Optional                               # 可选类型标注

# ---- 项目内部模块导入 ----
from app.database import get_db                           # 获取数据库会话的依赖
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES  # JWT 配置
from app.schemas.schemas import UserLogin, AdminLogin, TokenResponse       # Pydantic 数据模型

# 创建 API 路由器，所有路由以 /api/auth 为前缀，标签用于 Swagger 文档分组
router = APIRouter(prefix="/api/auth", tags=["认证"])


def create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    创建 JWT 访问令牌。

    将传入的 data 字典编码为 JWT，并设置过期时间。
    如果未指定 expires_delta，则使用配置中的默认过期时长。

    参数:
        data (dict): 要编码到 Token 中的载荷数据（例如用户名、角色）。
        expires_delta (Optional[timedelta]): 自定义 Token 过期时间差，默认为 None。

    返回:
        str: 编码后的 JWT 字符串。
    """
    to_encode = data.copy()                                            # 复制原始数据，避免修改传入的字典
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))  # 计算过期时间
    to_encode.update({"exp": expire})                                  # 将过期时间加入载荷
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)      # 使用 HS256 算法编码


async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    解析 JWT Token，获取当前登录用户信息（依赖注入函数）。

    从请求头 Authorization 中提取 Bearer Token，解码后返回用户身份信息。
    如果 Token 缺失、格式错误或已过期，则抛出 401 异常。

    参数:
        authorization (Optional[str]): HTTP 请求头中的 Authorization 值，默认为 None。

    返回:
        dict: 包含 "username"（用户名）和 "role"（角色）的字典。

    异常:
        HTTPException 401: 未提供 Token、格式不正确或 Token 已过期/无效。
    """
    if not authorization or not authorization.startswith("Bearer "):    # 检查请求头是否存在且格式正确
        raise HTTPException(status_code=401, detail="未登录或Token无效")
    token = authorization.split(" ")[1]                                # 去掉 "Bearer " 前缀，提取纯 Token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # 解码 JWT，验证签名和过期时间
        return {
            "username": payload.get("sub"),   # 从载荷中获取用户名（sub 字段）
            "role": payload.get("role"),       # 从载荷中获取角色（user 或 admin）
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token已过期或无效")


async def require_admin(current_user: dict = Depends(get_current_user)):
    """
    要求当前用户为管理员（依赖注入函数）。

    在校验用户身份的基础上进一步检查角色是否为 "admin"。
    若角色不符，则抛出 403 权限拒绝异常。

    参数:
        current_user (dict): 由 get_current_user 注入的当前用户信息。

    返回:
        dict: 当前用户信息字典。

    异常:
        HTTPException 403: 当前用户不是管理员。
    """
    if current_user["role"] != "admin":       # 检查用户角色字段
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return current_user                       # 验证通过，返回用户信息


@router.post("/user/login", response_model=TokenResponse)
async def user_login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    用户登录接口。

    校验用户名和密码，验证通过后返回 JWT 访问令牌。

    参数:
        login_data (UserLogin): 包含 user_id 和 password 的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        TokenResponse: 包含 access_token、角色和用户名的响应模型。

    异常:
        HTTPException 401: 账号不存在或密码错误。
    """
    # 根据用户名查询用户记录
    result = await db.execute(
        text("SELECT user_id, password FROM users WHERE user_id = :uid"),
        {"uid": login_data.user_id}
    )
    user = result.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="账号不存在")

    # 比对明文密码（生产环境应使用哈希加密）
    if user[1] != login_data.password:
        raise HTTPException(status_code=401, detail="密码错误")

    # 生成 JWT，载荷中包含用户名和角色
    token = create_token({"sub": login_data.user_id, "role": "user"})
    return TokenResponse(access_token=token, role="user", username=login_data.user_id)


@router.post("/user/register")
async def user_register(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    用户注册接口。

    检查用户名是否已被占用，若无则创建新用户记录。

    参数:
        login_data (UserLogin): 包含 user_id 和 password 的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        dict: 包含注册成功消息和用户 ID。

    异常:
        HTTPException 400: 账号已存在。
    """
    # 先检查用户名是否已被注册
    result = await db.execute(
        text("SELECT user_id FROM users WHERE user_id = :uid"),
        {"uid": login_data.user_id}
    )
    if result.fetchone():
        raise HTTPException(status_code=400, detail="账号已存在")

    # 插入新用户记录（明文存储，生产环境应加密）
    await db.execute(
        text("INSERT INTO users (user_id, password) VALUES (:uid, :pw)"),
        {"uid": login_data.user_id, "pw": login_data.password}
    )
    await db.commit()                    # 提交事务
    return {"message": "注册成功", "user_id": login_data.user_id}


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(login_data: AdminLogin, db: AsyncSession = Depends(get_db)):
    """
    管理员登录接口。

    校验管理员账号和密码，验证通过后返回 JWT 访问令牌（角色为 admin）。

    参数:
        login_data (AdminLogin): 包含 admin_id 和 password 的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        TokenResponse: 包含 access_token、角色为 "admin" 和用户名的响应模型。

    异常:
        HTTPException 401: 管理员账号或密码错误。
    """
    # 根据管理员 ID 查询记录
    result = await db.execute(
        text("SELECT admin_id, password FROM admin WHERE admin_id = :aid"),
        {"aid": login_data.admin_id}
    )
    admin = result.fetchone()
    # 验证管理员是否存在以及密码是否匹配
    if not admin or admin[1] != login_data.password:
        raise HTTPException(status_code=401, detail="管理员账号或密码错误")

    # 生成 JWT，角色设为 admin
    token = create_token({"sub": login_data.admin_id, "role": "admin"})
    return TokenResponse(access_token=token, role="admin", username=login_data.admin_id)
