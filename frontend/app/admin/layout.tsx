/**
 * 后台管理布局组件 (AdminLayout)
 *
 * 页面用途：
 *   该组件是整个后台管理系统的布局外壳，为所有后台管理页面提供统一的
 *   页面结构（顶部导航栏 + 左侧菜单栏 + 右侧内容区）。同时负责：
 *   1. 初始化用户认证状态
 *   2. 权限校验：仅允许已登录的管理员访问后台页面
 *   3. 提供后台导航菜单数据
 *
 * 路由结构：
 *   /admin               - 管理首页
 *   /admin/universities  - 高校管理
 *   /admin/majors        - 专业管理
 *   /admin/skills        - 技巧管理
 *   /admin/messages      - 留言管理
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { LayoutDashboard, Building2, BookOpen, Lightbulb, MessageSquare } from "lucide-react";

// 后台导航菜单配置项数组
// 每一项包含：跳转链接(href)、显示文本(label)、图标(icon)
const ADMIN_NAV = [
  { href: "/admin", label: "管理首页", icon: "📊" },
  { href: "/admin/universities", label: "高校管理", icon: "🏛" },
  { href: "/admin/majors", label: "专业管理", icon: "📚" },
  { href: "/admin/skills", label: "技巧管理", icon: "💡" },
  { href: "/admin/messages", label: "留言管理", icon: "💬" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 获取全局认证状态（通过 Zustand 状态管理）
  const auth = useAuthStore();
  const router = useRouter();

  // 组件挂载时初始化认证状态（从 localStorage 恢复登录信息）
  useEffect(() => { auth.init(); }, []);
  // 监听登录状态和角色变化：如果用户未登录或不是管理员，则跳转到选择页面
  useEffect(() => { if (auth.hydrated && (!auth.isLoggedIn || !auth.isAdmin)) router.replace("/select"); }, [auth.hydrated, auth.isLoggedIn, auth.isAdmin]);

  // 权限校验未通过时返回空内容（不渲染任何 UI），等待路由跳转
  if (!auth.hydrated || !auth.isLoggedIn || !auth.isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col pt-14">
      {/* 顶部导航栏 */}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏：渲染后台导航菜单 */}
        <Sidebar items={ADMIN_NAV} title="管理菜单" />
        {/* 右侧主内容区域：通过 children 渲染子页面内容 */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
