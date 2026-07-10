# ---- 第三方依赖导入 ----
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession          # 异步数据库会话
from sqlalchemy import text                               # 原生 SQL 查询
from typing import List                                   # 列表类型标注

# ---- 项目内部模块导入 ----
from app.database import get_db                           # 获取数据库会话的依赖
from app.schemas.schemas import MajorCreate, MajorResponse  # Pydantic 数据模型
from app.routers.auth import get_current_user, require_admin  # 认证与权限依赖

# 创建 API 路由器，所有路由以 /api/major 为前缀
router = APIRouter(prefix="/api/major", tags=["专业信息"])


@router.get("/list", response_model=List[MajorResponse])
async def list_majors(
    university_id: int = None,            # 按高校 ID 筛选，可选；若为 None 则返回全部
    db: AsyncSession = Depends(get_db),   # 异步数据库会话
):
    """
    获取专业列表（可按高校筛选）。

    当指定 university_id 时只返回该高校下的专业，
    否则返回所有专业，按 ID 升序排列。

    参数:
        university_id (int, optional): 高校 ID，用于按学校筛选专业，默认为 None。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        List[MajorResponse]: 专业响应对象列表。
    """
    # 构建基础 SQL 查询
    sql = "SELECT id, name, description, university_id, created_at FROM major"
    params = {}
    if university_id:                                     # 若指定了高校 ID，添加 WHERE 条件
        sql += " WHERE university_id = :uni_id"
        params["uni_id"] = university_id
    sql += " ORDER BY id ASC"                             # 按 ID 升序排列

    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    # 将每行数据库记录映射为 MajorResponse 响应模型
    return [
        MajorResponse(id=r[0], name=r[1], description=r[2], university_id=r[3], created_at=r[4])
        for r in rows
    ]


@router.get("/{major_id}", response_model=MajorResponse)
async def get_major(major_id: int, db: AsyncSession = Depends(get_db)):
    """
    获取专业详情。

    根据专业 ID 查询单条记录。若不存在则返回 404 错误。

    参数:
        major_id (int): 专业的唯一标识 ID（路径参数）。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        MajorResponse: 专业响应对象。

    异常:
        HTTPException 404: 指定 ID 的专业不存在。
    """
    result = await db.execute(
        text("SELECT id, name, description, university_id, created_at FROM major WHERE id = :id"),
        {"id": major_id}
    )
    row = result.fetchone()
    if not row:                                           # 未找到对应专业
        raise HTTPException(status_code=404, detail="专业不存在")
    # 将数据库行记录映射为响应对象
    return MajorResponse(id=row[0], name=row[1], description=row[2], university_id=row[3], created_at=row[4])


@router.post("/create")
async def create_major(
    data: MajorCreate,                    # 专业创建请求体
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员添加专业。

    将专业信息插入数据库，记录操作为当前管理员。

    参数:
        data (MajorCreate): 包含名称、描述、所属高校 ID 的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "添加成功" 的响应。
    """
    await db.execute(
        text("INSERT INTO major (name, description, university_id, admin_id) "
             "VALUES (:name, :desc, :uni_id, :admin)"),
        {"name": data.name, "desc": data.description, "uni_id": data.university_id, "admin": admin["username"]}
    )
    await db.commit()                     # 提交事务
    return {"message": "添加成功"}


@router.put("/{major_id}")
async def update_major(
    major_id: int,                        # 要更新的专业 ID
    data: MajorCreate,                    # 专业更新请求体
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员更新专业信息。

    更新专业的名称、描述、所属高校等全部字段（覆盖更新）。

    参数:
        major_id (int): 要更新的专业 ID（路径参数）。
        data (MajorCreate): 包含新专业信息的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "更新成功" 的响应。
    """
    await db.execute(
        text("UPDATE major SET name = :name, description = :desc, university_id = :uni_id, admin_id = :admin WHERE id = :id"),
        {"name": data.name, "desc": data.description, "uni_id": data.university_id, "admin": admin["username"], "id": major_id}
    )
    await db.commit()
    return {"message": "更新成功"}


@router.delete("/{major_id}")
async def delete_major(
    major_id: int,                        # 要删除的专业 ID
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员删除专业。

    根据专业 ID 物理删除数据库记录。

    参数:
        major_id (int): 要删除的专业 ID（路径参数）。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "删除成功" 的响应。
    """
    await db.execute(text("DELETE FROM major WHERE id = :id"), {"id": major_id})
    await db.commit()                     # 提交删除事务
    return {"message": "删除成功"}
