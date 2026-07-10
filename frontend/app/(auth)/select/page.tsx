/*
 * 身份选择页面（Select Page）
 *
 * 这是用户进入系统后看到的第一个交互页面，位于 /select 路由。
 * 用户需要在此页面选择自己的身份：普通用户（考生）或管理员。
 *
 * 功能说明：
 * - 页面加载时（useEffect）初始化认证状态，检查本地存储中是否已有登录信息
 * - 已登录用户点击按钮时直接跳转到对应主页（用户跳 /home，管理员跳 /admin）
 * - 未登录用户则跳转到对应的登录页面
 * - 使用毛玻璃（glass）风格的 UI 设计，提供现代美观的视觉体验
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { GraduationCap, User, Shield } from "lucide-react";

export default function SelectPage() {
  // 使用 Zustand 全局状态管理库获取认证状态和方法
  const auth = useAuthStore();
  // 获取 Next.js 路由实例，用于编程式导航
  const router = useRouter();

  // 组件挂载时调用 auth.init() 从 localStorage 中恢复登录状态
  // 空数组依赖确保只在首次渲染时执行一次
  useEffect(() => { auth.init(); }, []);

  /**
   * 导航处理函数：根据用户当前的登录状态决定跳转目标
   * @param path - 原始目标路径（登录页路径），仅在未登录时使用
   */
  const go = (path: string) => {
    // 已登录用户的处理：根据角色直接跳转到对应的主页面
    if (auth.isLoggedIn && auth.role === "user") router.push("/home");
    else if (auth.isLoggedIn && auth.role === "admin") router.push("/admin");
    // 未登录用户：跳转到参数指定的登录页面
    else router.push(path);
  };

  return (
    <div className="glass-card p-10 w-full max-w-md text-center">
      {/* 页面头部图标：学士帽图标，代表高考志愿填报主题 */}
      <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30">
        <GraduationCap size={28} className="text-white" />
      </div>
      {/* 页面主标题 */}
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-1">高考志愿辅助填报系统</h1>
      {/* 课程设计副标题 */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">《数据库系统》课程设计</p>
      {/* 装饰性分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mb-8" />
      {/* 提示用户选择身份 */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">请选择您的身份</p>
      <div className="flex flex-col gap-3">
        {/* "我是用户" 按钮：点击后尝试跳转到用户主页或用户登录页 */}
        <button onClick={() => go("/user-login")} className="glass-btn flex items-center justify-center gap-3 py-3.5 px-6 text-sm font-medium hover:!bg-white/60 dark:hover:!bg-slate-700/60">
          <User size={18} className="text-indigo-500" />
          我是用户
        </button>
        {/* "我是管理员" 按钮：点击后尝试跳转到管理后台或管理员登录页 */}
        <button onClick={() => go("/admin-login")} className="glass-btn flex items-center justify-center gap-3 py-3.5 px-6 text-sm font-medium hover:!bg-white/60 dark:hover:!bg-slate-700/60">
          <Shield size={18} className="text-indigo-500" />
          我是管理员
        </button>
      </div>
    </div>
  );
}
