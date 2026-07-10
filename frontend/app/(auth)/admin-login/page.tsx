/*
 * 管理员登录页面（Admin Login Page）
 *
 * 位于 /admin-login 路由，供管理员使用管理员 ID 和密码登录后台管理系统。
 * 登录成功后，会将服务端返回的 JWT Token、用户名和角色信息存入
 * Zustand 全局状态，并跳转至管理后台（/admin）。
 *
 * 与用户登录的区别：
 * - 使用 admin_id 而非 user_id 进行身份标识
 * - 角色为 "admin" 而非 "user"
 * - 跳转目标为 /admin 管理后台而非 /home 用户主页
 * - 不提供注册入口（管理员账号由系统后台创建）
 *
 * 主要流程：
 * 1. 管理员填写管理员 ID 和密码
 * 2. 前端进行基本的非空校验
 * 3. 调用后端 API 进行身份验证
 * 4. 验证通过后存储认证信息并跳转到管理后台
 * 5. 验证失败则显示错误提示
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  // 表单状态：管理员输入的管理员 ID
  const [aid, setAid] = useState("");
  // 表单状态：管理员输入的密码
  const [pw, setPw] = useState("");
  // 错误提示信息
  const [err, setErr] = useState("");
  // 加载状态，防止重复提交
  const [loading, setLoading] = useState(false);
  // Zustand 认证状态管理实例
  const auth = useAuthStore();
  // Next.js 路由实例
  const router = useRouter();

  /**
   * 管理员登录处理函数
   * 校验表单 -> 调用后端 API -> 处理成功（存储 token 并跳转）或失败（显示错误）
   */
  const login = async () => {
    setErr("");               // 每次提交前清除之前的错误信息
    if (!aid || !pw) { setErr("请填写管理员ID和密码"); return; }  // 前端非空校验
    setLoading(true);         // 开启加载状态
    try {
      // 调用 API 层封装的管理员登录接口，注意使用 admin_id 字段
      const res = await api.auth.adminLogin({ admin_id: aid, password: pw });
      // 登录成功：将 access_token、角色（admin）和管理员名存入全局状态
      auth.setAuth(res.access_token, "admin", res.username);
      // 跳转到管理后台主页
      router.push("/admin");
    } catch (e: any) { setErr(e.message); }  // 捕获和处理错误
    finally { setLoading(false); }            // 关闭加载状态
  };

  return (
    <div className="glass-card p-8 w-full max-w-sm">
      {/* 页面头部：盾牌图标和标题，与管理员的"管理/安全"角色定位一致 */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-3"><Shield size={22} className="text-white" /></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">管理员登录</h2>
      </div>
      {/* 错误提示条：仅在 err 有内容时渲染 */}
      {err && <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2.5 mb-3">{err}</div>}
      <div className="flex flex-col gap-3.5">
        {/* 管理员 ID 输入框：支持 Enter 键快速提交 */}
        <div><label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">管理员ID</label><input className="glass-input" placeholder="请输入管理员ID" value={aid} onChange={e => setAid(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
        {/* 密码输入框：支持 Enter 键快速提交 */}
        <div><label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">密码</label><input className="glass-input" type="password" placeholder="请输入密码" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
        {/* 登录按钮：loading 时禁用并显示"登录中..." */}
        <button className="glass-btn !bg-indigo-500 !text-white !border-indigo-400 hover:!bg-indigo-600 py-2.5 text-sm font-medium mt-1" disabled={loading} onClick={login}>{loading ? "登录中..." : "登 录"}</button>
      </div>
      {/* 装饰性分割线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-5" />
      {/* 返回按钮：回到身份选择页，管理员登录页没有注册入口 */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1.5"><Link href="/select" className="hover:text-slate-600 dark:hover:text-slate-300">← 返回选择</Link></p>
    </div>
  );
}
