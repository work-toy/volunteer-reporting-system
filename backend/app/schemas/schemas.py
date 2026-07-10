from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ========== 用户认证 ==========
class UserLogin(BaseModel):
    """用户登录请求模式

    用户（考生）使用此模式提交登录凭据。

    Attributes:
        user_id: 用户唯一标识 ID
        password: 登录密码
    """
    user_id: str
    password: str


class AdminLogin(BaseModel):
    """管理员登录请求模式

    管理员使用此模式提交登录凭据。

    Attributes:
        admin_id: 管理员唯一标识 ID
        password: 登录密码
    """
    admin_id: str
    password: str


class TokenResponse(BaseModel):
    """登录成功后的令牌响应模式

    认证成功后，后端返回 JWT 访问令牌及相关信息。

    Attributes:
        access_token: JWT 字符串，客户端需在后续请求的 Authorization 头中携带此令牌
        token_type:   令牌类型，固定为 "bearer"（Bearer 认证方案）
        role:         用户角色，"user" 表示普通用户，"admin" 表示管理员
        username:     登录用户的名称（昵称或账号名），供前端界面展示
    """
    access_token: str
    token_type: str = "bearer"
    role: str  # "user" or "admin"
    username: str


# ========== 高校 ==========
class UniversityBase(BaseModel):
    """高校基础信息模式

    包含高校最核心的字段，作为创建和响应模式的公共基类。

    Attributes:
        name:        高校名称（必填）
        ranking:     高校综合排名（可选）
        description: 高校简介（可选）
        min_score:   历史最低录取分数（可选）
        province:    所在省份/直辖市/自治区（可选）
    """
    name: str
    ranking: Optional[int] = None
    description: Optional[str] = None
    min_score: Optional[int] = None
    province: Optional[str] = None


class UniversityCreate(UniversityBase):
    """创建高校请求模式

    直接继承 UniversityBase，所有字段含义相同。
    使用独立类名的好处是未来可以为创建操作添加额外的校验逻辑（如字段必填约束）而不影响其他模式。
    """
    pass


class UniversityUpdate(BaseModel):
    """更新高校信息请求模式

    与 UniversityCreate 不同，所有字段均为可选。
    这样客户端可以只提交需要修改的字段，实现局部更新（PATCH 语义）。

    Attributes:
        name:        高校名称（可选，不传则不修改）
        ranking:     高校排名（可选）
        description: 高校简介（可选）
        min_score:   历史最低分数（可选）
        province:    所在省份（可选）
    """
    name: Optional[str] = None
    ranking: Optional[int] = None
    description: Optional[str] = None
    min_score: Optional[int] = None
    province: Optional[str] = None


class UniversityResponse(UniversityBase):
    """高校信息响应模式

    继承 UniversityBase 的所有字段，并扩展数据库生成的字段。
    用于 API 响应中返回完整的高校数据。

    Attributes:
        id:         高校 ID（数据库自增主键）
        created_at: 记录创建时间
    """
    id: int
    created_at: Optional[datetime] = None

    class Config:
        # from_attributes = True 表示允许从 ORM 模型对象创建此 Pydantic 实例
        # 这使得 SQLAlchemy 模型可以直接转换为 Pydantic 响应模式
        from_attributes = True


# ========== 专业 ==========
class MajorBase(BaseModel):
    """专业基础信息模式

    定义专业数据的核心字段，作为创建和响应模式的公共基类。

    Attributes:
        name:           专业名称（必填）
        description:    专业简介（可选）
        university_id:  所属高校 ID（可选），建立专业与高校的关联
    """
    name: str
    description: Optional[str] = None
    university_id: Optional[int] = None


class MajorCreate(MajorBase):
    """创建专业请求模式

    继承 MajorBase，用于客户端提交新增专业的请求数据。
    """
    pass


class MajorResponse(MajorBase):
    """专业信息响应模式

    继承 MajorBase 的所有字段，并扩展数据库生成的字段。

    Attributes:
        id:         专业 ID（数据库自增主键）
        created_at: 记录创建时间
    """
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 填报技巧 ==========
class SkillBase(BaseModel):
    """填报技巧基础信息模式

    定义填报技巧的核心字段，作为创建和响应模式的公共基类。

    Attributes:
        title:   技巧标题（必填）
        content: 技巧正文内容（必填）
    """
    title: str
    content: str


class SkillCreate(SkillBase):
    """创建填报技巧请求模式

    继承 SkillBase，用于管理员提交新增技巧文章的请求数据。
    """
    pass


class SkillResponse(SkillBase):
    """填报技巧响应模式

    继承 SkillBase 的所有字段，并扩展数据库生成的字段。

    Attributes:
        id:         技巧 ID（数据库自增主键）
        publisher:  发布人（管理员 ID）
        created_at: 发布时间
    """
    id: int
    publisher: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 留言 ==========
class MessageCreate(BaseModel):
    """创建留言请求模式

    用户提交留言时使用的请求体。

    Attributes:
        content: 留言正文内容（必填）
    """
    content: str


class MessageResponse(BaseModel):
    """留言响应模式

    返回留言数据的完整信息，包含数据库生成的字段。

    Attributes:
        id:         留言 ID（数据库自增主键）
        user_id:    留言用户 ID
        content:    留言正文内容
        created_at: 留言时间
    """
    id: int
    user_id: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 估分查询 ==========
class ScoreQuery(BaseModel):
    """估分查询请求模式

    用户输入自己的高考预估分数，系统据此推荐合适的高校。

    Attributes:
        score: 用户的高考估分（必填），整数类型
    """
    score: int


class UniversityRecommend(BaseModel):
    """高校推荐结果模式

    系统根据用户的估分，返回匹配的高校列表，每所高校附带匹配度标签。

    Attributes:
        id:          高校 ID
        name:        高校名称
        ranking:     高校排名（可选）
        min_score:   历史最低录取分数（可选）
        province:    所在省份（可选）
        match_degree: 匹配程度，取值为 "稳妥"（分数远高于最低线）、
                      "冲刺"（分数接近最低线，有一定风险）或
                      "保底"（分数明显高于最低线，基本可录取）
    """
    id: int
    name: str
    ranking: Optional[int] = None
    min_score: Optional[int] = None
    province: Optional[str] = None
    match_degree: str  # "稳妥" / "冲刺" / "保底"

# ========== 成绩录入 ==========
class ScoreCreate(BaseModel):
    score: int
    rank: Optional[int] = None
    year: int


class ScoreResponse(BaseModel):
    id: int
    score: int
    rank: Optional[int] = None
    year: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 志愿填报 ==========
class ApplicationAdd(BaseModel):
    university_id: int
    major_id: Optional[int] = None
    priority: int


class ApplicationUpdate(BaseModel):
    major_id: Optional[int] = None
    priority: Optional[int] = None


class ApplicationResponse(BaseModel):
    id: int
    user_id: str
    university_id: int
    major_id: Optional[int] = None
    priority: int
    status: str = "draft"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    university_name: Optional[str] = None
    major_name: Optional[str] = None

    class Config:
        from_attributes = True


class ApplicationReorder(BaseModel):
    ids: list[int]


# ========== 风险预警 ==========
class RiskWarningResponse(BaseModel):
    total: int
    reach: int
    stable: int
    safe: int
    has_duplicate: bool = False
    has_reverse: bool = False
    warnings: list[str] = []
    suggestion: str = ""
