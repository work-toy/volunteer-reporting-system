from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.database import get_db
from app.schemas.schemas import ScoreCreate, ScoreResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/score", tags=["成绩录入"])


@router.post("/entry", response_model=ScoreResponse)
async def entry_score(
    data: ScoreCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """录入高考成绩"""
    username = current_user["username"]
    await db.execute(
        text("INSERT INTO score (user_id, score, `rank`, year) VALUES (:uid, :score, :r, :year)"),
        {"uid": username, "score": data.score, "r": data.rank, "year": data.year or 2025}
    )
    await db.commit()
    new_id = (await db.execute(text("SELECT LAST_INSERT_ID()"))).scalar()
    return ScoreResponse(id=new_id, score=data.score, rank=data.rank, year=data.year or 2025, created_at=None)


@router.get("/history", response_model=list[ScoreResponse])
async def score_history(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """获取成绩记录列表"""
    result = await db.execute(
        text("SELECT id, user_id, score, COALESCE(`rank`, 0), year, created_at "
             "FROM score WHERE user_id = :uid ORDER BY year DESC"),
        {"uid": current_user["username"]}
    )
    return [ScoreResponse(id=r[0], score=r[2], rank=r[3] if r[3] else None, year=r[4] or 2025, created_at=r[5]) for r in result.fetchall()]


@router.get("/latest", response_model=ScoreResponse)
async def score_latest(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """获取最新成绩记录"""
    result = await db.execute(
        text("SELECT id, user_id, score, COALESCE(`rank`, 0), year, created_at "
             "FROM score WHERE user_id = :uid ORDER BY year DESC LIMIT 1"),
        {"uid": current_user["username"]}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="暂无成绩记录")
    return ScoreResponse(id=row[0], score=row[2], rank=row[3] if row[3] else None, year=row[4] or 2025, created_at=row[5])
