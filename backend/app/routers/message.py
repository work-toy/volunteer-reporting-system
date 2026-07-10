# ---- 第三方依赖导入 ----
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession          # 异步数据库会话
from sqlalchemy import text                               # 原生 SQL 查询
from typing import List                                   # 列表类型标注

# ---- 项目内部模块导入 ----
from app.database import get_db                           # 获取数据库会话的依赖
from app.schemas.schemas import MessageCreate, MessageResponse  # Pydantic 数据模型
from app.routers.auth import get_current_user, require_admin  # 认证与权限依赖

# 创建 API 路由器，所有路由以 /api/message 为前缀
router = APIRouter(prefix="/api/message", tags=["留言板"])


@router.get("/list", response_model=List[MessageResponse])
async def list_messages(db: AsyncSession = Depends(get_db)):
    """
    获取留言列表（按时间倒序）。

    查询所有留言记录，按发布时间倒序排列（最新的留言显示在最前面）。

    参数:
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        List[MessageResponse]: 留言响应对象列表。
    """
    result = await db.execute(
        text("SELECT id, user_id, content, created_at FROM message ORDER BY created_at DESC")
    )
    rows = result.fetchall()
    # 将数据库行记录映射为 MessageResponse 响应模型
    return [
        MessageResponse(id=r[0], user_id=r[1], content=r[2], created_at=r[3])
        for r in rows
    ]


@router.post("/create")
async def create_message(
    data: MessageCreate,                  # 留言创建请求体
    db: AsyncSession = Depends(get_db),   # 数据库会话
    current_user=Depends(get_current_user),  # 需要用户登录后才能留言
):
    """
    用户发布留言（需要登录）。

    将留言内容插入数据库，留言用户自动设为当前登录用户。
    未登录用户调用此接口会收到 401 未授权错误。

    参数:
        data (MessageCreate): 包含留言内容的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        current_user: 由 get_current_user 注入的当前登录用户信息。

    返回:
        dict: 包含 "message": "留言成功" 的响应。
    """
    await db.execute(
        text("INSERT INTO message (user_id, content) VALUES (:uid, :content)"),
        {"uid": current_user["username"], "content": data.content}
    )
    await db.commit()                     # 提交事务
    return {"message": "留言成功"}


@router.delete("/{msg_id}")
async def delete_message(
    msg_id: int,                          # 要删除的留言 ID
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员删除留言。

    根据留言 ID 物理删除数据库记录。

    参数:
        msg_id (int): 要删除的留言 ID（路径参数）。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "删除成功" 的响应。
    """
    await db.execute(text("DELETE FROM message WHERE id = :id"), {"id": msg_id})
    await db.commit()                     # 提交删除事务
    return {"message": "删除成功"}
