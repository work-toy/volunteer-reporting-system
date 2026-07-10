/*
 * 用户登录页面（User Login Page）
 *
 * 位于 /user-login 路由，供普通用户（考生）使用账号密码登录系统。
 * 登录成功后，会将服务端返回的 JWT Token、用户名和角色信息存入
 * Zustand 全局状态，并跳转到用户主页（/home）。
 *
 * 主要流程：
 * 1. 用户填写账号和密码
 * 2. 前端进行基本的非空校验
 * 3. 调用后端 API 进行身份验证
 * 4. 验证通过后存储认证信息并跳转
 * 5. 验证失败则显示错误提示
 *
 * 该页面还提供"立即注册"和"返回选择"的导航链接。
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { User } from "lucide-react";

export default function UserLoginPage() {
  // 表单状态：用户输入的账号
  const [uid, setUid] = useState("");
  // 表单状态：用户输入的密码
  const [pw, setPw] = useState("");
  // 错误提示信息，登录失败时由 catch 块填充
  const [err, setErr] = useState("");
  // 加载状态，防止重复提交，登录过程中禁用按钮并显示"登录中..."
  const [loading, setLoading] = useState(false);
  // Zustand 认证状态管理实例
  const auth = useAuthStore();
  // Next.js 路由实例
  const router = useRouter();

  /**
   * 登录处理函数
   * 校验表单 -> 调用后端 API -> 处理成功（存储 token 并跳转）或失败（显示错误）
   */
  const login = async () => {
    setErr("");               // 每次提交前清除之前的错误信息
    if (!uid || !pw) { setErr("请填写账号和密码"); return; }  // 前端非空校验
    setLoading(true);         // 开启加载状态，禁用按钮
    try {
      // 调用 API 层封装的用户登录接口，发送账号密码到后端
      const res = await api.auth.userLogin({ user_id: uid, password: pw });
      // 登录成功：将 access_token、角色（user）和用户名存入全局状态
      auth.setAuth(res.access_token, "user", res.username);
      // 跳转到用户主页
      router.push("/home");
    } catch (e: any) { setErr(e.message); }  // 捕获网络错误或后端返回的业务错误
    finally { setLoading(false); }            // 无论成功还是失败，都关闭加载状态
  };

  return (
    <div className="glass-card p-8 w-full max-w-sm">
      {/* 页面头部：用户图标和标题 */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-3"><User size={22} className="text-white" /></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">用户登录</h2>
      </div>
      {/* 错误提示条：仅在 err 有内容时渲染，使用红色主题 */}
      {err && <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2.5 mb-3">{err}</div>}
      <div className="flex flex-col gap-3.5">
        {/* 账号输入框：支持 Enter 键快速提交 */}
        <div><label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">账号</label><input className="glass-input" placeholder="请输入账号" value={uid} onChange={e => setUid(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
        {/* 密码输入框：type="password" 隐藏输入内容，支持 Enter 键快速提交 */}
        <div><label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">密码</label><input className="glass-input" type="password" placeholder="请输入密码" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
        {/* 登录按钮：loading 时禁用并显示"登录中..." */}
        <button className="glass-btn !bg-indigo-500 !text-white !border-indigo-400 hover:!bg-indigo-600 py-2.5 text-sm font-medium mt-1" disabled={loading} onClick={login}>{loading ? "登录中..." : "登 录"}</button>
      </div>
      {/* 装饰性分割线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-5" />
      {/* 注册入口：提示没有账号的用户点击注册 */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">没有账号？<Link href="/user-register" className="text-indigo-500 hover:text-indigo-400">立即注册</Link></p>
      {/* 返回按钮：方便用户回到身份选择页重新选择 */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1.5"><Link href="/select" className="hover:text-slate-600 dark:hover:text-slate-300">← 返回选择</Link></p>
    </div>
  );
}
