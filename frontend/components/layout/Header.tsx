/**
 * Header.tsx — 页面顶部导航栏组件
 *
 * 功能：
 * - 展示系统 Logo 和名称（"高考志愿辅助填报系统"）
 * - 显示当前登录用户的用户名和身份（管理员/普通用户）
 * - 提供退出登录按钮，点击后清除用户状态并跳转回选择页面
 *
 * 使用到的 Store / 路由：
 * - useAuthStore：获取当前用户信息及 logout 方法
 * - useRouter（Next.js）：退出后跳转至 /select 页面
 *
 * 样式特点：
 * - 固定顶部（fixed top-0），z-40 层级确保悬浮在内容之上
 * - 毛玻璃效果（glass 类）
 * - 底部带有半透明白色/深色边框（border-b border-white/20）
 */

"use client";

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { LogOut, GraduationCap } from "lucide-react";

export default function Header() {
  // 从全局状态中获取认证信息（用户名、是否为管理员及退出方法）
  const auth = useAuthStore();
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 glass border-b border-white/20 dark:border-white/5">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* 左侧：Logo + 系统名称 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            <GraduationCap size={18} />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-white">高考志愿辅助填报系统</span>
        </div>

        {/* 右侧：用户信息 + 退出按钮 */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {/*
           * 根据 auth.isAdmin 显示"管理员"或"用户"
           * auth.username 为当前登录的用户名
           */}
          <span>{auth.isAdmin ? "管理员" : "用户"}：<span className="text-slate-700 dark:text-slate-200 font-medium">{auth.username}</span></span>
          {/*
           * 退出登录按钮
           * 调用 auth.logout() 清除状态，再用 router.push 导航到 /select
           */}
          <button
            onClick={() => { auth.logout(); router.push("/select"); }}
            className="glass-btn !p-1.5 rounded-lg hover:!text-rose-500"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
