/**
 * 主布局组件 — Main Layout
 *
 * 【页面用途】
 * 这是登录后用户主界面的布局外壳。它包裹了所有 (main) 路由组下的页面，
 * 提供统一的页面结构：顶部导航栏（Header）+ 左侧侧边栏（Sidebar）+ 中央内容区。
 * 同时在此处完成登录状态校验，未登录或管理员用户将被自动重定向到 /select 页面。
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Home, Building2, TrendingUp, Lightbulb, MessageSquare } from "lucide-react";

// 用户导航菜单配置 —— 定义侧边栏中显示的菜单项
// 每一项包含路由地址（href）、显示标签（label）和图标（icon）
const USER_NAV = [
  { href: "/home", label: "系统首页", icon: "🏠" },
  { href: "/score", label: "成绩录入", icon: "📝" },
  { href: "/university", label: "高校信息", icon: "🏛" },
  { href: "/recommend", label: "估分选大学", icon: "📊" },
  { href: "/application", label: "志愿填报", icon: "🎯" },
  { href: "/risk", label: "风险预警", icon: "⚠️" },
  { href: "/skill", label: "填报技巧", icon: "💡" },
  { href: "/message", label: "留言板", icon: "💬" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // 获取全局认证状态（来自 Zustand store）
  const auth = useAuthStore();
  const router = useRouter();

  // 组件挂载时初始化认证状态（从 localStorage 读取 token 等）
  useEffect(() => { auth.init(); }, []);
  // 等 hydrated 完成后才判断是否跳转，避免刷新时误跳到 /select
  useEffect(() => { if (auth.hydrated && (!auth.isLoggedIn || auth.isAdmin)) router.replace("/select"); }, [auth.hydrated, auth.isLoggedIn, auth.isAdmin]);

  // 条件渲染：初始化中或未登录或管理员时直接返回 null，
  // 搭配上面的 useEffect 跳转，确保安全
  if (!auth.hydrated || !auth.isLoggedIn || auth.isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col pt-14">
      {/* 页面顶部导航栏 */}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧用户侧边栏，传入导航菜单项 */}
        <Sidebar items={USER_NAV} title="用户菜单" />
        {/* 中央主内容区，子页面内容在此渲染 */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
