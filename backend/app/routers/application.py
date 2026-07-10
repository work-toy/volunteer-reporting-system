from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List

from app.database import get_db
from app.schemas.schemas import (
    ApplicationAdd, ApplicationUpdate, ApplicationResponse, ApplicationReorder, RiskWarningResponse
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/application", tags=["志愿填报"])


def _build_app(row) -> ApplicationResponse:
    """将数据库行记录转换为 ApplicationResponse"""
    return ApplicationResponse(
        id=row[0], user_id=row[1], university_id=row[2],
        major_id=row[3], priority=row[4], status=row[5],
        created_at=row[6], updated_at=row[7],
        university_name=row[8] if len(row) > 8 else None,
        major_name=row[9] if len(row) > 9 else None,
    )


@router.get("/list", response_model=List[ApplicationResponse])
async def list_applications(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """获取当前用户的志愿列表

    按 priority 升序排列（第1志愿在最前面）。
    """
    result = await db.execute(
        text("SELECT a.id, a.user_id, a.university_id, a.major_id, a.priority, a.status, "
             "a.created_at, a.updated_at, u.name AS uni_name, m.name AS major_name "
             "FROM application a "
             "LEFT JOIN university u ON a.university_id = u.id "
             "LEFT JOIN major m ON a.major_id = m.id "
             "WHERE a.user_id = :uid ORDER BY a.priority ASC"),
        {"uid": current_user["username"]}
    )
    return [_build_app(r) for r in result.fetchall()]


@router.post("/add", response_model=ApplicationResponse)
async def add_application(
    data: ApplicationAdd,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """添加志愿"""
    username = current_user["username"]

    # 检查是否已存在同一优先级的志愿
    existing = await db.execute(
        text("SELECT id FROM application WHERE user_id = :uid AND priority = :p AND status = 'draft'"),
        {"uid": username, "p": data.priority}
    )
    if existing.fetchone():
        raise HTTPException(status_code=400, detail=f"第 {data.priority} 志愿已存在，请选择其他顺序")

    await db.execute(
        text("INSERT INTO application (user_id, university_id, major_id, priority) "
             "VALUES (:uid, :uni_id, :maj_id, :p)"),
        {"uid": username, "uni_id": data.university_id, "maj_id": data.major_id, "p": data.priority}
    )
    await db.commit()

    # 获取刚插入的记录
    new_id = (await db.execute(text("SELECT LAST_INSERT_ID()"))).scalar()
    result = await db.execute(
        text("SELECT a.id, a.user_id, a.university_id, a.major_id, a.priority, a.status, "
             "a.created_at, a.updated_at, u.name AS uni_name, m.name AS major_name "
             "FROM application a "
             "LEFT JOIN university u ON a.university_id = u.id "
             "LEFT JOIN major m ON a.major_id = m.id "
             "WHERE a.id = :id"), {"id": new_id}
    )
    return _build_app(result.fetchone())


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: int,
    data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """修改志愿（专业或优先级）"""
    username = current_user["username"]

    # 检查志愿所属
    result = await db.execute(
        text("SELECT id FROM application WHERE id = :id AND user_id = :uid"),
        {"id": app_id, "uid": username}
    )
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="志愿不存在")

    fields = []
    params = {"id": app_id}
    if data.major_id is not None:
        fields.append("major_id = :maj_id")
        params["maj_id"] = data.major_id
    if data.priority is not None:
        # 检查目标优先级是否被占用
        existing = await db.execute(
            text("SELECT id FROM application WHERE user_id = :uid AND priority = :p AND id != :id AND status = 'draft'"),
            {"uid": username, "p": data.priority, "id": app_id}
        )
        if existing.fetchone():
            raise HTTPException(status_code=400, detail=f"第 {data.priority} 志愿已被占用")
        fields.append("priority = :p")
        params["p"] = data.priority

    if not fields:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    await db.execute(
        text(f"UPDATE application SET {', '.join(fields)} WHERE id = :id"),
        params
    )
    await db.commit()

    result = await db.execute(
        text("SELECT a.id, a.user_id, a.university_id, a.major_id, a.priority, a.status, "
             "a.created_at, a.updated_at, u.name AS uni_name, m.name AS major_name "
             "FROM application a "
             "LEFT JOIN university u ON a.university_id = u.id "
             "LEFT JOIN major m ON a.major_id = m.id "
             "WHERE a.id = :id"), {"id": app_id}
    )
    return _build_app(result.fetchone())


@router.delete("/{app_id}")
async def delete_application(
    app_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """删除志愿"""
    result = await db.execute(
        text("DELETE FROM application WHERE id = :id AND user_id = :uid"),
        {"id": app_id, "uid": current_user["username"]}
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="志愿不存在")
    return {"message": "删除成功"}


@router.post("/reorder")
async def reorder_applications(
    data: ApplicationReorder,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """批量重排志愿顺序

    传入按新顺序排列的志愿 ID 列表，系统按列表顺序重置 priority。
    """
    username = current_user["username"]
    for idx, app_id in enumerate(data.ids):
        priority = idx + 1
        await db.execute(
            text("UPDATE application SET priority = :p WHERE id = :id AND user_id = :uid"),
            {"p": priority, "id": app_id, "uid": username}
        )
    await db.commit()
    return {"message": "重排成功"}


@router.post("/submit")
async def submit_applications(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """提交志愿（将 draft 状态改为 submitted）"""
    result = await db.execute(
        text("UPDATE application SET status = 'submitted' "
             "WHERE user_id = :uid AND status = 'draft'"),
        {"uid": current_user["username"]}
    )
    await db.commit()
    if result.rowcount == 0:
        return {"message": "没有待提交的志愿"}
    return {"message": f"已提交 {result.rowcount} 个志愿", "count": result.rowcount}


@router.get("/check-risk", response_model=RiskWarningResponse)
async def check_risk(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """风险预警检查

    分析当前用户的志愿列表，检查：
    1. 冲/稳/保 比例是否合理
    2. 是否有重复院校
    3. 是否有分数倒挂（高分排后面）
    4. 志愿数量是否充足
    """
    username = current_user["username"]

    # 获取志愿列表（含院校分数）
    result = await db.execute(
        text("SELECT a.id, a.priority, u.id AS uni_id, u.name AS uni_name, u.min_score "
             "FROM application a "
             "JOIN university u ON a.university_id = u.id "
             "WHERE a.user_id = :uid AND a.status = 'draft' "
             "ORDER BY a.priority ASC"),
        {"uid": username}
    )
    rows = result.fetchall()

    warnings = []
    total = len(rows)
    reach = stable = safe = 0
    has_duplicate = False
    has_reverse = False

    if total == 0:
        return RiskWarningResponse(
            total=0, reach=0, stable=0, safe=0,
            warnings=["当前没有志愿，请先添加志愿"],
            suggestion="至少添加 6 个志愿，合理分配冲稳保梯度"
        )

    # 获取用户最新成绩
    score_result = await db.execute(
        text("SELECT score FROM score WHERE user_id = :uid ORDER BY year DESC LIMIT 1"),
        {"uid": username}
    )
    user_score_row = score_result.fetchone()

    # 分类冲稳保（如果有用户成绩）
    seen_uni_ids = set()
    prev_score = None
    if user_score_row:
        user_score = user_score_row[0]
        for r in rows:
            app_id, priority, uni_id, uni_name, min_score = r
            # 去重检查
            if uni_id in seen_uni_ids:
                has_duplicate = True
            seen_uni_ids.add(uni_id)

            # 冲稳保分类（使用 admission_data 或 university.min_score）
            if min_score:
                diff = user_score - min_score
                if diff >= 30:
                    safe += 1
                elif diff >= 0:
                    stable += 1
                else:
                    reach += 1

            # 分数倒挂检查
            if prev_score is not None and min_score:
                if prev_score < min_score:
                    has_reverse = True
            prev_score = min_score
    else:
        # 没有成绩记录，无法分类
        reach = safe = stable = 0
        warnings.append("暂未录入成绩，无法进行冲稳保分析")

    # 生成预警信息
    if total < 6:
        warnings.append(f"志愿数量偏少（{total}个），建议至少填报 6 个")

    if reach == 0:
        warnings.append("没有冲刺院校，建议适当增加冲刺志愿")
    if safe == 0:
        warnings.append("没有保底院校，存在滑档风险")
    if stable == 0:
        warnings.append("没有稳妥院校，志愿梯度不合理")

    total_graded = reach + stable + safe
    if total_graded > 0:
        reach_pct = reach / total_graded * 100
        stable_pct = stable / total_graded * 100
        safe_pct = safe / total_graded * 100
        if safe_pct < 20:
            warnings.append(f"保底比例偏低（{safe_pct:.0f}%），建议提高到 30-40%")
        if reach_pct > 50:
            warnings.append(f"冲刺比例过高（{reach_pct:.0f}%），请合理控制风险")

    if has_duplicate:
        warnings.append("存在重复院校，请检查")
    if has_reverse:
        warnings.append("存在分数倒挂（高分院校排在低分院校后面），请调整顺序")

    # 生成建议
    suggestion = (
        f"建议按 2:4:4 比例分配冲稳保："
        f"约 {max(1, total // 5)} 个冲刺、{max(2, total * 2 // 5)} 个稳妥、{max(2, total * 2 // 5)} 个保底"
    )
    if not user_score_row:
        suggestion = "请先录入高考成绩，系统将根据分数进行精准的风险分析"

    return RiskWarningResponse(
        total=total, reach=reach, stable=stable, safe=safe,
        has_duplicate=has_duplicate, has_reverse=has_reverse,
        warnings=warnings, suggestion=suggestion
    )


@router.post("/withdraw")
async def withdraw_applications(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """撤销提交（将 submitted 状态改回 draft）"""
    result = await db.execute(
        text("UPDATE application SET status = 'draft' "
             "WHERE user_id = :uid AND status = 'submitted'"),
        {"uid": current_user["username"]}
    )
    await db.commit()
    if result.rowcount == 0:
        return {"message": "没有已提交的志愿"}
    return {"message": f"已撤销 {result.rowcount} 个志愿的提交", "count": result.rowcount}
