/**
 * Header.tsx — 页面顶部导航栏组件
 */
"use client";

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { LogOut, GraduationCap } from "lucide-react";

export default function Header() {
  const auth = useAuthStore();
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 glass border-b border-white/20 dark:border-white/5">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* 左侧：Logo + 系统名称（不动） */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            <GraduationCap size={18} />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-white">高考志愿辅助填报系统</span>
        </div>

        {/* 右侧：博客Logo + 用户信息 + 退出 */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="relative group">
            <a
              href="https://www.lxpavilion.top/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <svg className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <img src="/favicon.ico" alt="栏轩·阁" className="w-5 h-5" />
            </a>
            <span className="absolute right-0 top-full mt-1.5 text-[10px] font-medium text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
              去博客逛逛
            </span>
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>{auth.isAdmin ? "管理员" : "用户"}：<span className="text-slate-700 dark:text-slate-200 font-medium">{auth.username}</span></span>
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
