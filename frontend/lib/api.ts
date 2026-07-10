/**
 * API 客户端模块
 *
 * 封装了与后端 FastAPI 服务的所有 HTTP 通信。
 * 自动处理 JWT 身份验证令牌的注入和错误处理。
 * 提供类型化的接口定义和按模块分组的 API 方法。
 */

/**
 * API 基础路径
 * 所有请求都会拼接到此路径之后。
 * 生产部署时可通过环境变量配置为实际后端地址。
 */
const BASE = "/api";

/**
 * 通用请求函数
 *
 * 封装 fetch API，自动注入认证令牌和 JSON 内容类型头，
 * 并对非 2xx 响应进行统一的错误处理。
 *
 * @typeParam T - 响应数据的类型
 * @param path - API 路径（相对于 BASE 的路径，如 "/university/list"）
 * @param opts - 可选的 fetch 配置项（method, body 等）
 * @returns 解析后的 JSON 响应数据，类型为 T
 * @throws 当请求失败或后端返回错误时抛出 Error
 */
/** 最大重试次数 */
const MAX_RETRIES = 2;

/** 是否开启 API 调试日志 */
const DEBUG_API = process.env.NODE_ENV === "development";

/**
 * 通用请求函数
 *
 * 封装 fetch API，自动注入认证令牌和 JSON 内容类型头，
 * 对非 2xx 响应进行统一的错误处理，支持超时控制和自动重试。
 */
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  // 构建请求头：默认内容类型为 JSON
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // 如果存在令牌，则添加 Authorization 头（Bearer 认证方案）
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // 调试日志：记录 API 调用
  if (DEBUG_API) {
    console.debug(`[API] ${opts.method || "GET"} ${path}`, opts.body || "");
  }

  // 带超时控制的 fetch 封装，最多重试 MAX_RETRIES 次
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s 超时

    try {
      // 发起 fetch 请求：拼接完整 URL 并合并请求配置
      const res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers,
        signal: controller.signal,
      });

      // 如果响应状态码不是 2xx，统一处理错误
      if (!res.ok) {
        // Token 过期或未授权，跳转到登录页
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          if (typeof window !== "undefined") {
            window.location.href = "/select";
          }
          throw new Error("登录已过期，请重新登录");
        }
        // 500 服务器错误且未达到重试上限时继续重试
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          lastError = new Error(`服务器错误(${res.status})，正在重试...`);
          continue;
        }
        // 尝试从响应体中解析错误详情
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || `请求失败(${res.status})`);
      }

      // 成功时直接解析并返回 JSON 数据
      return res.json();
    } catch (e: any) {
      lastError = e;
      // 如果是网络错误或超时且未达到重试上限，继续重试
      if (e.name === 'AbortError' && attempt < MAX_RETRIES) {
        console.warn(`请求超时，第 ${attempt + 1} 次重试: ${path}`);
        continue;
      }
      if (e.message?.includes('Failed to fetch') && attempt < MAX_RETRIES) {
        console.warn(`网络错误，第 ${attempt + 1} 次重试: ${path}`);
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error("请求失败");
}

// ─── 数据类型定义 ───

/** 大学 / 高校信息 */
export interface Uni {
  id: number;                    // 大学唯一 ID
  name: string;                  // 大学名称
  ranking?: number | null;       // 综合排名
  description?: string | null;   // 描述 / 简介
  min_score?: number | null;     // 最低录取分数线
  province?: string | null;      // 所在省份
  created_at?: string            // 数据创建时间
}

/** 专业信息 */
export interface Major {
  id: number;                    // 专业唯一 ID
  name: string;                  // 专业名称
  description?: string | null;   // 专业描述
  university_id?: number | null  // 所属大学 ID
}

/** 高考小贴士 / 技巧文章 */
export interface Skill {
  id: number;                    // 文章唯一 ID
  title: string;                 // 文章标题
  content: string;               // 文章内容
  publisher?: string;            // 发布者
  created_at?: string            // 发布时间
}

/** 留言 / 消息 */
export interface Msg {
  id: number;                    // 消息唯一 ID
  user_id: string;               // 发送者用户 ID
  content: string;               // 消息内容
  created_at?: string            // 发送时间
}

/** 历年录取数据 */
export interface AdmissionYear {
  id: number;
  university_id: number;
  year: number;
  min_score?: number | null;
  min_rank?: number | null;
  avg_score?: number | null;
  enrollment_num?: number | null;
  batch?: string | null;
}

/** 院校推荐结果（用于智能推荐功能） */
export interface RecResult {
  id: number;                    // 大学 ID
  name: string;                  // 大学名称
  ranking?: number;              // 排名
  min_score?: number;            // 最低分数线
  province?: string;             // 省份
  match_degree: string           // 匹配度描述（如 "高度匹配"）
}

/** 身份认证响应（登录成功后的返回数据） */
export interface AuthRes {
  access_token: string;          // JWT 访问令牌
  role: string;                  // 用户角色（"user" 或 "admin"）
  username: string               // 用户名
}

/** 成绩记录 */
export interface ScoreRecord {
  id?: number;
  score: number;
  rank?: number | null;
  year: number;
  created_at?: string;
}

/** 志愿记录 */
export interface ApplicationItem {
  id: number;
  user_id: string;
  university_id: number;
  major_id?: number | null;
  priority: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  university_name?: string | null;
  major_name?: string | null;
}

/** 风险预警结果 */
export interface RiskWarning {
  total: number;
  reach: number;
  stable: number;
  safe: number;
  has_duplicate: boolean;
  has_reverse: boolean;
  warnings: string[];
  suggestion: string;
}

// ─── API 方法集合 ───

/**
 * api 对象 — 所有后端接口的调用入口
 *
 * 按模块分组（auth, uni, major, skill, msg），
 * 每个方法都已绑定好请求路径、HTTP 方法和类型签名。
 *
 * 使用示例：
 *   const data = await api.uni.list({ province: "北京" });
 *   const res = await api.auth.userLogin({ user_id: "001", password: "xxx" });
 */
export const api = {
  /**
   * 认证模块
   * 处理用户和管理员的登录与注册
   */
  auth: {
    /** 普通用户登录 */
    userLogin: (d: { user_id: string; password: string }) =>
      request<AuthRes>("/auth/user/login", { method: "POST", body: JSON.stringify(d) }),

    /** 普通用户注册 */
    userRegister: (d: { user_id: string; password: string }) =>
      request("/auth/user/register", { method: "POST", body: JSON.stringify(d) }),

    /** 管理员登录 */
    adminLogin: (d: { admin_id: string; password: string }) =>
      request<AuthRes>("/auth/admin/login", { method: "POST", body: JSON.stringify(d) }),
  },

  /**
   * 大学模块
   * 大学的增删改查、智能推荐、省份列表
   */
  uni: {
    /** 获取大学列表，支持按省份等参数过滤 */
    list: (p?: Record<string, string>) => {
      // 如果传入了查询参数，拼接到 URL 查询字符串中
      const q = p ? "?" + new URLSearchParams(p).toString() : "";
      return request<Uni[]>(`/university/list${q}`);
    },

    /** 根据 ID 获取单个大学详情 */
    get: (id: number) => request<Uni>(`/university/${id}`),

    /** 新增大学 */
    create: (d: Partial<Uni>) =>
      request("/university/create", { method: "POST", body: JSON.stringify(d) }),

    /** 更新大学信息 */
    update: (id: number, d: Partial<Uni>) =>
      request(`/university/${id}`, { method: "PUT", body: JSON.stringify(d) }),

    /** 删除大学 */
    delete: (id: number) => request(`/university/${id}`, { method: "DELETE" }),

    /** 根据高考分数智能推荐院校 */
    recommend: (score: number) =>
      request<RecResult[]>("/university/recommend", {
        method: "POST",
        body: JSON.stringify({ score }),
      }),

    /** 获取历年录取数据 */
    admission: (id: number) => request<AdmissionYear[]>(`/university/${id}/admission`),

    /** 获取可供筛选的省份列表 */
    provinces: () => request<{ provinces: string[] }>("/university/provinces/list"),
  },

  /**
   * 专业模块
   * 专业的增删改查
   */
  major: {
    /** 获取专业列表，可选按大学筛选 */
    list: (uid?: number) =>
      request<Major[]>(`/major/list${uid ? "?university_id=" + uid : ""}`),

    /** 新增专业 */
    create: (d: Partial<Major>) =>
      request("/major/create", { method: "POST", body: JSON.stringify(d) }),

    /** 更新专业信息 */
    update: (id: number, d: Partial<Major>) =>
      request(`/major/${id}`, { method: "PUT", body: JSON.stringify(d) }),

    /** 删除专业 */
    delete: (id: number) => request(`/major/${id}`, { method: "DELETE" }),
  },

  /**
   * 高考小贴士模块
   * 技巧文章的增删改查
   */
  skill: {
    /** 获取所有小贴士文章列表 */
    list: () => request<Skill[]>("/skill/list"),

    /** 发布新文章 */
    create: (d: { title: string; content: string }) =>
      request("/skill/create", { method: "POST", body: JSON.stringify(d) }),

    /** 更新文章内容 */
    update: (id: number, d: { title: string; content: string }) =>
      request(`/skill/${id}`, { method: "PUT", body: JSON.stringify(d) }),

    /** 删除文章 */
    delete: (id: number) => request(`/skill/${id}`, { method: "DELETE" }),
  },

  /**
   * 留言模块
   * 用户留言的查看、发布和删除
   */
  msg: {
    /** 获取所有留言列表 */
    list: () => request<Msg[]>("/message/list"),

    /** 发布新留言 */
    create: (content: string) =>
      request("/message/create", {
        method: "POST",
        body: JSON.stringify({ content }),
      }),

    /** 删除指定留言 */
    delete: (id: number) => request(`/message/${id}`, { method: "DELETE" }),
  },

  /**
   * 成绩录入模块
   */
  score: {
    /** 录入成绩 */
    entry: (d: { score: number; rank?: number | null; year: number }) =>
      request<ScoreRecord>("/score/entry", { method: "POST", body: JSON.stringify(d) }),

    /** 获取成绩历史 */
    history: () => request<ScoreRecord[]>("/score/history"),

    /** 获取最新成绩 */
    latest: () => request<ScoreRecord>("/score/latest"),
  },

  /**
   * 志愿填报模块
   */
  application: {
    /** 获取志愿列表 */
    list: () => request<ApplicationItem[]>("/application/list"),

    /** 添加志愿 */
    add: (d: { university_id: number; major_id?: number | null; priority: number }) =>
      request<ApplicationItem>("/application/add", { method: "POST", body: JSON.stringify(d) }),

    /** 修改志愿 */
    update: (id: number, d: { major_id?: number | null; priority?: number }) =>
      request<ApplicationItem>(`/application/${id}`, { method: "PUT", body: JSON.stringify(d) }),

    /** 删除志愿 */
    delete: (id: number) => request(`/application/${id}`, { method: "DELETE" }),

    /** 重排志愿 */
    reorder: (ids: number[]) =>
      request("/application/reorder", { method: "POST", body: JSON.stringify({ ids }) }),

    /** 提交志愿 */
    submit: () => request<{ message: string; count?: number }>("/application/submit", { method: "POST" }),

    /** 撤销提交 */
    withdraw: () => request<{ message: string; count?: number }>("/application/withdraw", { method: "POST" }),

    /** 风险预警 */
    checkRisk: () => request<RiskWarning>("/application/check-risk"),
  },
};
