"""
数据模型定义 — 高考志愿辅助填报系统后端

本文件使用 SQLAlchemy ORM（对象关系映射）定义所有数据库表对应的 Python 模型类。
每个模型类映射到 MySQL 中的一张表，类的属性对应表中的列。

模型列表：
  - Admin:      管理员表，管理高校、专业、填报技巧等数据
  - User:       用户表，存储普通用户（考生）信息
  - University: 高校表，存储高校基本信息、排名、录取分数线
  - Major:      专业表，存储各高校开设的专业信息
  - Skill:      填报技巧表，管理员发布的志愿填报技巧文章
  - Message:    留言表，用户对系统的留言反馈
  - ViewHistory:浏览历史表，记录用户查看高校的足迹

关系说明：
  - Admin 1:N University — 一个管理员可管理多个高校
  - Admin 1:N Major      — 一个管理员可管理多个专业
  - Admin 1:N Skill      — 一个管理员可发布多个技巧
  - User  1:N Message    — 一个用户可发布多条留言
  - User  1:N ViewHistory — 一个用户有多次浏览记录
  - University 1:N Major — 一个高校有多个专业
  - University 1:N ViewHistory — 一个高校有多条浏览记录
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类

    所有数据模型类都继承自该基类。SQLAlchemy 通过此基类扫描所有子类，
    自动生成对应的 CREATE TABLE 语句（配合 alembic 或 create_all 使用）。
    """
    pass


class Admin(Base):
    """管理员模型 — 映射 admin 表

    管理员是系统的后台操作者，负责管理高校信息、专业信息以及发布填报技巧。

    Attributes:
        admin_id (str):   管理员唯一标识 ID，主键，由人工分配
        password (str):   登录密码，建议存储哈希值而非明文
        created_at (DateTime): 管理员账号创建时间，由数据库自动生成
        universities (relationship): 该管理员管理的高校列表（一对多关系）
        majors (relationship):      该管理员管理的专业列表（一对多关系）
        skills (relationship):      该管理员发布的填报技巧列表（一对多关系）
    """
    __tablename__ = "admin"

    admin_id = Column(String(20), primary_key=True, comment="管理员ID")
    password = Column(String(100), nullable=False, comment="登录密码")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")

    # 关系映射：Admin 与 University、Major、Skill 的一对多关系
    # back_populates 用于建立双向关系，使另一方也能通过对应属性访问到当前对象
    universities = relationship("University", back_populates="admin")
    majors = relationship("Major", back_populates="admin")
    skills = relationship("Skill", back_populates="admin_rel")


class User(Base):
    """用户模型 — 映射 users 表

    用户即使用本系统的高考考生，可以浏览高校和专业信息、发表留言。

    Attributes:
        user_id (str):    用户唯一标识 ID，主键，由系统或人工分配
        password (str):   登录密码
        nickname (str):   用户昵称，可选，用于在前端展示
        created_at (DateTime): 注册时间，由数据库自动生成
        messages (relationship):     该用户发表的留言列表（一对多关系）
        view_history (relationship): 该用户的浏览历史记录列表（一对多关系）
    """
    __tablename__ = "users"

    user_id = Column(String(20), primary_key=True, comment="用户ID")
    password = Column(String(100), nullable=False, comment="登录密码")
    nickname = Column(String(50), nullable=True, comment="昵称")
    created_at = Column(DateTime, server_default=func.now(), comment="注册时间")

    # 关系映射：User 与 Message、ViewHistory 的一对多关系
    messages = relationship("Message", back_populates="user")
    view_history = relationship("ViewHistory", back_populates="user")
    scores = relationship("Score", back_populates="user")
    applications = relationship("Application", back_populates="user")


class University(Base):
    """高校模型 — 映射 university 表

    存储全国各高校的基本信息，是系统的核心数据之一。
    用户可根据高校排名、所在地、最低录取分数等条件查询高校。

    Attributes:
        id (int):          自增主键
        name (str):        高校官方名称
        ranking (int):     高校综合排名（可为空，表示暂无排名数据）
        description (str): 高校简介，包含学校历史、办学特色等
        min_score (int):   历史最低录取分数，用于用户估分匹配
        province (str):    高校所在省份/直辖市/自治区
        admin_id (str):    负责管理该高校信息的管理员 ID
        created_at (DateTime): 记录创建时间
        updated_at (DateTime): 记录最后更新时间，onupdate 会在更新行时自动刷新
        admin (relationship):        管理此高校的管理员对象（多对一关系）
        majors (relationship):       该高校开设的专业列表（一对多关系）
        view_history (relationship): 该高校的浏览记录列表（一对多关系）
    """
    __tablename__ = "university"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="高校名称")
    ranking = Column(Integer, nullable=True, comment="高校排名")
    description = Column(Text, nullable=True, comment="高校简介")
    min_score = Column(Integer, nullable=True, comment="历史最低分数")
    province = Column(String(50), nullable=True, comment="所在省份")
    admin_id = Column(String(20), ForeignKey("admin.admin_id"), nullable=True, comment="管理员")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关系映射
    admin = relationship("Admin", back_populates="universities")
    majors = relationship("Major", back_populates="university")
    view_history = relationship("ViewHistory", back_populates="university")
    admission_data = relationship("AdmissionData", back_populates="university")
    applications = relationship("Application", back_populates="university")


class Major(Base):
    """专业模型 — 映射 major 表

    存储各高校开设的专业信息。专业隶属于某个高校，通过 university_id 外键关联。

    Attributes:
        id (int):          自增主键
        name (str):        专业名称，如"计算机科学与技术"、"临床医学"
        description (str): 专业简介，包含培养目标、主干课程、就业方向等
        university_id (int): 所属高校的 ID，外键关联 university 表
        admin_id (str):      负责管理该专业信息的管理员 ID
        created_at (DateTime): 记录创建时间
        university (relationship): 该专业所属的高校对象（多对一关系）
        admin (relationship):      管理此专业的管理员对象（多对一关系）
    """
    __tablename__ = "major"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="专业名称")
    description = Column(Text, nullable=True, comment="专业简介")
    university_id = Column(Integer, ForeignKey("university.id"), nullable=True, comment="所属高校")
    admin_id = Column(String(20), ForeignKey("admin.admin_id"), nullable=True, comment="管理员")
    created_at = Column(DateTime, server_default=func.now())

    # 关系映射
    university = relationship("University", back_populates="majors")
    admin = relationship("Admin", back_populates="majors")


class Skill(Base):
    """填报技巧模型 — 映射 skill 表

    管理员发布的志愿填报技巧文章，帮助考生合理填报志愿。
    内容包括选学校还是选专业、如何参考往年分数线等实用建议。

    Attributes:
        id (int):      自增主键，技巧编号
        title (str):   技巧标题
        content (str): 技巧正文内容，支持富文本或 Markdown 格式
        publisher (str): 发布人（管理员 ID），外键关联 admin 表
        created_at (DateTime): 发布时间，由数据库自动生成
        admin_rel (relationship): 发布此技巧的管理员对象（多对一关系）
    """
    __tablename__ = "skill"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="技巧编号")
    title = Column(String(200), nullable=False, comment="技巧标题")
    content = Column(Text, nullable=False, comment="技巧内容")
    publisher = Column(String(20), ForeignKey("admin.admin_id"), nullable=True, comment="发布人")
    created_at = Column(DateTime, server_default=func.now(), comment="发布时间")

    # 关系映射：此处属性名 admin_rel 与 Admin 模型中的 skills 对应
    # 使用不同的命名避免了与 reserved word 或已有属性的冲突
    admin_rel = relationship("Admin", back_populates="skills")


class Message(Base):
    """留言模型 — 映射 message 表

    用户对系统的留言反馈。用户可以就高校信息、专业选择等提出疑问或建议。
    此为单向留言功能（用户 -> 系统），暂不包含管理员回复功能。

    Attributes:
        id (int):      自增主键，留言编号
        user_id (str): 留言用户 ID，外键关联 users 表
        content (str): 留言正文内容
        created_at (DateTime): 留言时间，由数据库自动生成
        user (relationship): 发表此留言的用户对象（多对一关系）
    """
    __tablename__ = "message"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="留言编号")
    user_id = Column(String(20), ForeignKey("users.user_id"), nullable=True, comment="留言用户")
    content = Column(Text, nullable=False, comment="留言内容")
    created_at = Column(DateTime, server_default=func.now(), comment="留言时间")

    # 关系映射：Message 与 User 的多对一关系
    user = relationship("User", back_populates="messages")


class ViewHistory(Base):
    """浏览历史模型 — 映射 view_history 表

    记录用户查看高校详情的浏览足迹。可用于：
      - 让用户回顾最近查看过的高校
      - 基于浏览历史做个性化推荐（未来扩展）

    Attributes:
        id (int):       自增主键
        user_id (str):  浏览用户的 ID，外键关联 users 表
        university_id (int): 被查看的高校 ID，外键关联 university 表
        viewed_at (DateTime): 浏览时间戳，由数据库自动生成
        user (relationship):        浏览者用户对象（多对一关系）
        university (relationship):  被浏览的高校对象（多对一关系）
    """
    __tablename__ = "view_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(20), ForeignKey("users.user_id"), nullable=True)
    university_id = Column(Integer, ForeignKey("university.id"), nullable=True)
    viewed_at = Column(DateTime, server_default=func.now())

    # 关系映射
    user = relationship("User", back_populates="view_history")
    university = relationship("University", back_populates="view_history")


class Score(Base):
    """用户成绩模型 — 映射 score 表

    存储用户的高考成绩信息，包括总分、全省位次和考试年份。
    """
    __tablename__ = "score"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(20), ForeignKey("users.user_id"), nullable=False)
    score = Column(Integer, nullable=False, comment="高考总分")
    rank = Column(Integer, nullable=True, comment="全省位次")
    year = Column(Integer, nullable=False, comment="高考年份")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="scores")


class AdmissionData(Base):
    """历年录取数据模型 — 映射 admission_data 表

    存储各高校历年的录取分数线、位次和招生人数等数据。
    """
    __tablename__ = "admission_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    university_id = Column(Integer, ForeignKey("university.id"), nullable=False)
    major_id = Column(Integer, ForeignKey("major.id"), nullable=True)
    year = Column(Integer, nullable=False, comment="录取年份")
    min_score = Column(Integer, nullable=True, comment="最低录取分")
    min_rank = Column(Integer, nullable=True, comment="最低录取位次")
    avg_score = Column(Integer, nullable=True, comment="平均录取分")
    enrollment_num = Column(Integer, nullable=True, comment="录取人数")
    batch = Column(String(20), nullable=True, comment="录取批次")

    university = relationship("University", back_populates="admission_data")


class Application(Base):
    """志愿填报模型 — 映射 application 表

    存储用户提交的志愿填报信息。每个志愿包含院校、专业和优先级。
    """
    __tablename__ = "application"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(20), ForeignKey("users.user_id"), nullable=False)
    university_id = Column(Integer, ForeignKey("university.id"), nullable=False)
    major_id = Column(Integer, ForeignKey("major.id"), nullable=True)
    priority = Column(Integer, nullable=False, comment="志愿顺序")
    status = Column(String(20), default="draft", comment="draft/submitted")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="applications")
    university = relationship("University", back_populates="applications")

