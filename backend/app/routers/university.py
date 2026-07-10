# ---- 第三方依赖导入 ----
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession          # 异步数据库会话
from sqlalchemy import text                               # 原生 SQL 查询
from typing import List, Optional                         # 列表与可选类型标注

# ---- 项目内部模块导入 ----
from app.database import get_db                           # 获取数据库会话的依赖
from app.schemas.schemas import (
    UniversityCreate, UniversityUpdate, UniversityResponse, UniversityRecommend, ScoreQuery
)                                                        # Pydantic 数据模型
from app.routers.auth import get_current_user, require_admin  # 认证与权限依赖

# 创建 API 路由器，所有路由以 /api/university 为前缀
router = APIRouter(prefix="/api/university", tags=["高校信息"])


@router.get("/list", response_model=List[UniversityResponse])
async def list_universities(
    province: Optional[str] = None,       # 按省份筛选，可选
    keyword: Optional[str] = None,        # 按关键词（名称/描述）模糊搜索，可选
    db: AsyncSession = Depends(get_db),   # 异步数据库会话
):
    """
    获取高校列表（支持按省份和关键词筛选）。

    动态拼接 SQL WHERE 子句，实现多条件组合查询。
    结果按排名（ranking）升序排列。

    参数:
        province (Optional[str]): 省份筛选条件，例如 "北京市"。
        keyword (Optional[str]): 关键词，模糊匹配高校名称或描述。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        List[UniversityResponse]: 高校响应对象列表。
    """
    # 基础 SQL：选取所有需要的字段，WHERE 1=1 简化后续条件拼接
    sql = "SELECT id, name, ranking, description, min_score, province, created_at FROM university WHERE 1=1"
    params = {}
    if province:                                     # 如果指定了省份，添加筛选条件
        sql += " AND province = :province"
        params["province"] = province
    if keyword:                                      # 如果指定了关键词，在名称和描述中模糊匹配
        sql += " AND (name LIKE :kw OR description LIKE :kw2)"
        params["kw"] = f"%{keyword}%"
        params["kw2"] = f"%{keyword}%"
    sql += " ORDER BY ranking ASC"                   # 按排名升序排列，排名越靠前越靠前

    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    # 将数据库行记录转换为 Pydantic 响应模型列表
    return [
        UniversityResponse(
            id=r[0], name=r[1], ranking=r[2],
            description=r[3], min_score=r[4], province=r[5],
            created_at=r[6]
        )
        for r in rows
    ]


@router.get("/{uni_id}", response_model=UniversityResponse)
async def get_university(uni_id: int, db: AsyncSession = Depends(get_db)):
    """
    获取高校详情。

    根据高校 ID 查询单条记录，若不存在则返回 404 错误。

    参数:
        uni_id (int): 高校的唯一标识 ID（路径参数）。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        UniversityResponse: 高校响应对象。

    异常:
        HTTPException 404: 指定 ID 的高校不存在。
    """
    result = await db.execute(
        text("SELECT id, name, ranking, description, min_score, province, created_at FROM university WHERE id = :id"),
        {"id": uni_id}
    )
    row = result.fetchone()
    if not row:                                         # 未找到对应记录
        raise HTTPException(status_code=404, detail="高校不存在")
    # 将数据库行记录映射为响应对象
    return UniversityResponse(
        id=row[0], name=row[1], ranking=row[2],
        description=row[3], min_score=row[4], province=row[5],
        created_at=row[6]
    )


@router.post("/create")
async def create_university(
    data: UniversityCreate,               # 高校创建请求体
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员添加高校。

    将高校信息插入数据库，记录操作为当前管理员。

    参数:
        data (UniversityCreate): 包含名称、排名、描述、最低分数、省份等信息的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "添加成功" 的响应。
    """
    await db.execute(
        text("INSERT INTO university (name, ranking, description, min_score, province, admin_id) "
             "VALUES (:name, :ranking, :desc, :score, :province, :admin)"),
        {
            "name": data.name, "ranking": data.ranking,
            "desc": data.description, "score": data.min_score,
            "province": data.province, "admin": admin["username"]
        }
    )
    await db.commit()                     # 提交事务，持久化数据
    return {"message": "添加成功"}


@router.put("/{uni_id}")
async def update_university(
    uni_id: int,                          # 要更新的高校 ID
    data: UniversityUpdate,               # 高校更新请求体（所有字段均为可选）
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员更新高校信息。

    动态拼接 UPDATE 语句，仅更新请求体中非 None 的字段。
    同时记录最后操作的管理员。

    参数:
        uni_id (int): 要更新的高校 ID（路径参数）。
        data (UniversityUpdate): 包含可选更新字段的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "更新成功" 的响应。

    异常:
        HTTPException 400: 请求体中没有提供任何需要更新的字段。
    """
    fields = []                           # 存储 SET 子句中的字段表达式
    params = {"id": uni_id}               # 参数化查询参数，初始包含 ID

    # 逐个字段检查，只将非 None 的字段加入更新列表
    if data.name is not None:
        fields.append("name = :name")
        params["name"] = data.name
    if data.ranking is not None:
        fields.append("ranking = :ranking")
        params["ranking"] = data.ranking
    if data.description is not None:
        fields.append("description = :desc")
        params["desc"] = data.description
    if data.min_score is not None:
        fields.append("min_score = :score")
        params["score"] = data.min_score
    if data.province is not None:
        fields.append("province = :province")
        params["province"] = data.province

    if not fields:                        # 没有任何字段需要更新
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    # 自动记录操作管理员
    fields.append("admin_id = :admin")
    params["admin"] = admin["username"]

    # 用逗号拼接所有 SET 子句，生成完整 UPDATE 语句
    sql = f"UPDATE university SET {', '.join(fields)} WHERE id = :id"
    await db.execute(text(sql), params)
    await db.commit()
    return {"message": "更新成功"}


@router.delete("/{uni_id}")
async def delete_university(
    uni_id: int,                          # 要删除的高校 ID
    db: AsyncSession = Depends(get_db),   # 数据库会话
    admin=Depends(require_admin),         # 需要管理员权限
):
    """
    管理员删除高校。

    根据高校 ID 物理删除记录。

    参数:
        uni_id (int): 要删除的高校 ID（路径参数）。
        db (AsyncSession): 异步数据库会话（依赖注入）。
        admin: 由 require_admin 注入的当前管理员用户信息。

    返回:
        dict: 包含 "message": "删除成功" 的响应。
    """
    await db.execute(text("DELETE FROM university WHERE id = :id"), {"id": uni_id})
    await db.commit()                     # 提交删除事务
    return {"message": "删除成功"}


@router.post("/recommend", response_model=List[UniversityRecommend])
async def recommend_university(
    query: ScoreQuery,                    # 用户输入的高考分数查询
    db: AsyncSession = Depends(get_db),   # 数据库会话
):
    """
    估分选大学：根据分数推荐可报考的高校。

    调用存储过程 sp_search_university_by_score 获取分数线相近的高校，
    然后根据分数差将结果分为"冲刺""稳妥""保底"三个等级。

    参数:
        query (ScoreQuery): 包含用户高考分数的请求体。
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        List[UniversityRecommend]: 推荐高校列表，每项包含匹配程度标签。
    """
    # 调用存储过程，根据分数获取推荐高校
    result = await db.execute(
        text("CALL sp_search_university_by_score(:score)"),
        {"score": query.score}
    )
    rows = result.fetchall()

    # 遍历结果，根据分数差计算匹配程度
    universities = []
    for r in rows:
        # 计算考生的分数与高校最低录取分的差值
        score_diff = query.score - (r[4] or 0)    # r[4] 是 min_score 字段
        if score_diff >= 30:                      # 高出 30 分以上，适合作为保底选择
            match = "保底"
        elif score_diff >= 0:                     # 高出 0-30 分，比较稳妥
            match = "稳妥"
        else:                                     # 低于最低录取分，可以尝试冲刺
            match = "冲刺"

        universities.append(UniversityRecommend(
            id=r[0], name=r[1], ranking=r[2],
            min_score=r[4], province=r[5], match_degree=match
        ))

    return universities


@router.get("/provinces/list")
async def list_provinces(db: AsyncSession = Depends(get_db)):
    """
    获取所有省份列表（用于前端筛选下拉框）。

    从大学表中 DISTINCT 查询所有非空的省份字段，按字母/拼音排序。

    参数:
        db (AsyncSession): 异步数据库会话（依赖注入）。

    返回:
        dict: 包含 "provinces" 键的字典，值为省份名称字符串列表。
    """
    result = await db.execute(
        text("SELECT DISTINCT province FROM university WHERE province IS NOT NULL ORDER BY province")
    )
    provinces = [r[0] for r in result.fetchall()]
    return {"provinces": provinces}


@router.get("/{uni_id}/admission")
async def get_admission_data(
    uni_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取高校历年录取数据"""
    result = await db.execute(
        text("SELECT id, university_id, year, min_score, min_rank, avg_score, enrollment_num, batch "
             "FROM admission_data WHERE university_id = :uid ORDER BY year DESC"),
        {"uid": uni_id}
    )
    rows = result.fetchall()
    return [
        {
            "id": r[0], "university_id": r[1], "year": r[2],
            "min_score": r[3], "min_rank": r[4],
            "avg_score": r[5], "enrollment_num": r[6], "batch": r[7]
        }
        for r in rows
    ]
