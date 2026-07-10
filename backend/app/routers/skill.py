# ---- 第三方依赖导入 ----
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession          # 异步数据库会话
from sqlalchemy import text                               # 原生 SQL 查询
from typing import List                                   # 列表类型标注

# ---- 项目内部模块导入 ----
from app.database import get_db                           # 获取数据库会话的依赖
from app.schemas.schemas import SkillCreate, SkillResponse  # Pydantic 数据模型
from app.routers.auth import get_current_user, require_admin  # 认证与权限依赖

# 创建 API 路由器，所有路由以 /api/skill 为前缀
router = APIRouter(prefix="/api/skill", tags=["填报技巧"])


@router.get("/list", response_model=List[SkillResponse])
async def list_skills(db: AsyncSession = Depends(get_db)):
    """
    获取填报技巧列表。

    查询所有技巧文章，按发布时间倒序排列（最新的在前），
    以便用户第一时间看到最新发布的内容。

    参数:
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        List[SkillResponse]: 技巧响应对象列表。
    """
    result = await db.execute(
        text("SELECT id, title, content, publisher, created_at FROM skill ORDER BY created_at DESC")
    )
    rows = result.fetchall()
    # 将数据库行记录映射为 SkillResponse 响应模型
    return [
        SkillResponse(id=r[0], title=r[1], content=r[2], publisher=r[3], created_at=r[4])
        for r in rows
    ]


@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: int, db: AsyncSession = Depends(get_db)):
    """
    获取填报技巧详情。

    根据技巧文章 ID 查询单条记录。若不存在则返回 404 错误。

    参数:
        skill_id (int): 技巧文章的唯一标识 ID（路径参数）。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        SkillResponse: 技巧响应对象。

    异常:
        HTTPException 404: 指定 ID 的技巧文章不存在。
    """
    result = await db.execute(
        text("SELECT id, title, content, publisher, created_at FROM skill WHERE id = :id"),
        {"id": skill_id}
    )
    row = result.fetchone()
    if not row:                                           # 未找到对应技巧文章
        raise HTTPException(status_code=404, detail="技巧不存在")
    return SkillResponse(id=row[0], title=row[1], content=row[2], publisher=row[3], created_at=row[4])


@router.post("/create")
async def create_skill(
    data: SkillCreate,                    # 技巧创建请求体
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员添加填报技巧。

    将技巧文章插入数据库，发布者自动设为当前管理员用户名。

    参数:
        data (SkillCreate): 包含标题和内容的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "添加成功" 的响应。
    """
    await db.execute(
        text("INSERT INTO skill (title, content, publisher) VALUES (:title, :content, :publisher)"),
        {"title": data.title, "content": data.content, "publisher": admin["username"]}
    )
    await db.commit()                     # 提交事务
    return {"message": "添加成功"}


@router.put("/{skill_id}")
async def update_skill(
    skill_id: int,                        # 要更新的技巧文章 ID
    data: SkillCreate,                    # 技巧更新请求体
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员更新填报技巧。

    更新技巧文章的标题和内容（覆盖更新）。

    参数:
        skill_id (int): 要更新的技巧文章 ID（路径参数）。
        data (SkillCreate): 包含新标题和新内容的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "更新成功" 的响应。
    """
    await db.execute(
        text("UPDATE skill SET title = :title, content = :content WHERE id = :id"),
        {"title": data.title, "content": data.content, "id": skill_id}
    )
    await db.commit()
    return {"message": "更新成功"}


@router.delete("/{skill_id}")
async def delete_skill(
    skill_id: int,                        # 要删除的技巧文章 ID
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员删除填报技巧。

    根据技巧文章 ID 物理删除数据库记录。

    参数:
        skill_id (int): 要删除的技巧文章 ID（路径参数）。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "删除成功" 的响应。
    """
    await db.execute(text("DELETE FROM skill WHERE id = :id"), {"id": skill_id})
    await db.commit()                     # 提交删除事务
    return {"message": "删除成功"}
