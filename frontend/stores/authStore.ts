/**
 * 认证状态管理 — authStore
 *
 * 基于 Zustand 实现的全局认证状态仓库。
 * 管理用户的登录状态、角色（普通用户/管理员）和用户名信息，
 * 并与 localStorage 同步持久化，确保页面刷新后状态不丢失。
 *
 * 为什么使用 Zustand 而不是 Redux？
 * Zustand 的 API 更简洁，不需要 Provider 包裹，
 * 不需要 action/reducer 样板代码，适合中小型应用。
 */

"use client";

import { create } from "zustand";

/**
 * AuthState 接口 — 认证状态的数据结构和操作
 *
 * 状态字段：
 * - token: JWT 访问令牌，用于接口鉴权
 * - role: 用户角色，"user" 表示普通用户，"admin" 表示管理员
 * - username: 当前登录用户的名称
 * - isLoggedIn: 是否已登录（衍生状态，根据 token 是否存在判断）
 * - isAdmin: 是否为管理员（衍生状态，根据 role === "admin" 判断）
 *
 * 操作方法：
 * - init(): 应用初始化时从 localStorage 恢复登录状态
 * - setAuth(): 登录成功后保存认证信息
 * - logout(): 登出，清除所有认证信息
 */
interface AuthState {
  /** JWT 令牌 */
  token: string;
  /** 用户角色："user" | "admin" */
  role: string;
  /** 用户名 */
  username: string;
  /** 是否已登录（token 存在且非空） */
  isLoggedIn: boolean;
  /** 是否为管理员权限 */
  isAdmin: boolean;
  /** 是否已完成 localStorage 状态恢复 */
  hydrated: boolean;
  /** 初始化：从 localStorage 恢复持久化的登录状态 */
  init: () => void;
  /** 设置认证信息（登录成功后调用） */
  setAuth: (token: string, role: string, username: string) => void;
  /** 登出：清除所有认证信息 */
  logout: () => void;
}

/**
 * useAuthStore — 认证状态仓库
 *
 * 通过 create<AuthState> 创建一个带有类型安全的 Zustand store。
 * set 函数用于更新状态（支持部分更新），
 * get 函数用于读取当前状态（此处未使用，保留以备将来扩展）。
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  /* ─── 初始状态 ─── */
  token: "",
  role: "",
  username: "",
  isLoggedIn: false,
  isAdmin: false,
  hydrated: false,

  /* ─── 初始化 ─── */
  /**
   * init — 从 localStorage 恢复登录状态
   *
   * 应用启动（或页面刷新）时调用。
   * 从 localStorage 读取之前 setAuth 保存的 token/role/username，
   * 如果有 token 则表示用户仍处于登录状态。
   *
   * !!token 的妙用：
   * 空字符串 "" 是 falsy 值，!!"" === false
   * 非空字符串是 truthy 值，!!"xxx" === true
   */
  init: () => {
    const token = localStorage.getItem("token") || "";
    const role = localStorage.getItem("role") || "";
    const username = localStorage.getItem("username") || "";
    set({ token, role, username, isLoggedIn: !!token, isAdmin: role === "admin", hydrated: true });
  },

  /* ─── 登录 ─── */
  /**
   * setAuth — 保存认证信息
   *
   * @param token - 后端返回的 JWT 令牌
   * @param role - 用户角色
   * @param username - 用户名
   *
   * 同步写入三个 localStorage 键值对，
   * 以便页面刷新后 init() 能恢复状态。
   * 同时更新 Zustand store 中的对应字段，
   * 并设置 isLoggedIn = true, isAdmin = (role === "admin")。
   */
  setAuth: (token, role, username) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);
    set({ token, role, username, isLoggedIn: true, isAdmin: role === "admin", hydrated: true });
  },

  /* ─── 登出 ─── */
  /**
   * logout — 清除所有认证信息
   *
   * 从 localStorage 移除 token/role/username，
   * 将 store 重置为初始未登录状态。
   * 调用后所有需要认证的 API 请求将因为没有 Authorization 头而被后端拒绝。
   */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    set({ token: "", role: "", username: "", isLoggedIn: false, isAdmin: false, hydrated: true });
  },
}));
