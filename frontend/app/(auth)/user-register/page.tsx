/*
 * 用户注册页面（User Register Page）
 *
 * 位于 /user-register 路由，供新用户（考生）注册账号。
 * 注册成功后会自动跳转到用户登录页（/user-login）以便用户立即登录。
 *
 * 主要流程：
 * 1. 用户填写账号、密码和确认密码
 * 2. 前端校验：非空校验 + 两次密码一致性校验
 * 3. 调用后端 API 提交注册信息
 * 4. 注册成功：显示成功提示，延迟 0.8 秒后跳转到登录页
 * 5. 注册失败：显示后端返回的错误信息
 *
 * 注意：注册成功后不直接登录，而是让用户跳转到登录页手动登录，
 * 这是常见的安全设计模式，确保用户明确知道自己的账号密码。
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { UserPlus } from "lucide-react";

export default function UserRegisterPage() {
  // 表单状态：用户设置的账号
  const [uid, setUid] = useState("");
  // 表单状态：用户设置的密码
  const [pw, setPw] = useState("");
  // 表单状态：确认密码（用于校验两次输入是否一致）
  const [pw2, setPw2] = useState("");
  // 提示消息：可以是错误信息（红色）或成功信息（绿色）
  const [msg, setMsg] = useState("");
  // 标记注册是否成功，用于控制提示消息的颜色样式
  const [ok, setOk] = useState(false);
  // 加载状态，防止重复提交
  const [loading, setLoading] = useState(false);

  /**
   * 注册处理函数
   * 校验表单 -> 调用后端 API -> 成功则延迟跳转登录页，失败则显示错误
   */
  const register = async () => {
    setMsg("");               // 每次提交前清除之前的提示信息
    if (!uid || !pw) { setMsg("请填写账号和密码"); return; }  // 非空校验
    if (pw !== pw2) { setMsg("两次密码不一致"); return; }      // 密码一致性校验
    setLoading(true);         // 开启加载状态
    try {
      // 调用 API 层封装的用户注册接口
      await api.auth.userRegister({ user_id: uid, password: pw });
      // 注册成功：设置成功消息，标记 ok 为 true（消息显示为绿色）
      setMsg("注册成功！"); setOk(true);
      // 延迟 800ms 后跳转到登录页，让用户看到成功提示
      setTimeout(() => window.location.href = "/user-login", 800);
    } catch (e: any) { setMsg(e.message); }  // 捕获错误并显示
    finally { setLoading(false); }            // 关闭加载状态
  };

  return (
    <div className="glass-card p-8 w-full max-w-sm">
      {/* 页面头部：用户加号图标和标题 */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-3"><UserPlus size={22} className="text-white" /></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">用户注册</h2>
      </div>
      {/* 提示消息条：根据 ok 状态切换绿色（成功）或红色（错误）主题 */}
      {msg && <div className={`text-xs rounded-lg p-2.5 mb-3 ${ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-rose-50 dark:bg-rose-900/20 text-rose-500"}`}>{msg}</div>}
      <div className="flex flex-col gap-3.5">
        {/* 账号输入框 */}
        <div><label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">账号</label><input className="glass-input" placeholder="请设置账号" value={uid} onChange={e => setUid(e.target.value)} /></div>
        {/* 密码输入框 */}
        <div><label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">密码</label><input className="glass-input" type="password" placeholder="请设置密码" value={pw} onChange={e => setPw(e.target.value)} /></div>
        {/* 确认密码输入框：支持 Enter 键快速提交 */}
        <div><label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">确认密码</label><input className="glass-input" type="password" placeholder="再次输入密码" value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={e => e.key === "Enter" && register()} /></div>
        {/* 注册按钮：loading 时禁用并显示"注册中..." */}
        <button className="glass-btn !bg-indigo-500 !text-white !border-indigo-400 hover:!bg-indigo-600 py-2.5 text-sm font-medium mt-1" disabled={loading} onClick={register}>{loading ? "注册中..." : "注 册"}</button>
      </div>
      {/* 装饰性分割线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-5" />
      {/* 登录入口：提示已有账号的用户去登录 */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">已有账号？<Link href="/user-login" className="text-indigo-500 hover:text-indigo-400">去登录</Link></p>
      {/* 返回按钮：回到身份选择页 */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1.5"><Link href="/select" className="hover:text-slate-600 dark:hover:text-slate-300">← 返回选择</Link></p>
    </div>
  );
}
