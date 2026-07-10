/**
 * 后台管理首页 (AdminDashboard)
 *
 * 页面用途：
 *   后台管理系统的入口仪表盘页面。以卡片网格的形式展示所有后台管理
 *   功能的快速入口，方便管理员一键跳转到各管理模块。每个卡片包含
 *   功能图标、模块名称和简短的功能描述。
 *
 * 导航入口：
 *   - 高校管理 → /admin/universities
 *   - 专业管理 → /admin/majors
 *   - 技巧管理 → /admin/skills
 *   - 留言管理 → /admin/messages
 */

"use client";

import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";

// 后台功能快捷入口配置
// 每项包含：路由(href)、模块名称(label)、功能描述(desc)、显示图标(icon)
const LINKS = [
  { href: "/admin/universities", label: "高校管理", desc: "添加 / 编辑 / 删除高校信息", icon: "🏛" },
  { href: "/admin/majors", label: "专业管理", desc: "添加 / 编辑 / 删除专业信息", icon: "📚" },
  { href: "/admin/skills", label: "技巧管理", desc: "发布 / 编辑 / 删除填报技巧", icon: "💡" },
  { href: "/admin/messages", label: "留言管理", desc: "查看 / 删除用户留言", icon: "💬" },
];

export default function AdminDashboard() {
  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">📊 管理首页</h1>

      {/* 功能入口卡片网格：使用响应式网格布局，在中等屏幕以上显示为两列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {LINKS.map(l => (
          <Link key={l.href} href={l.href}>
            {/* GlassCard 是毛玻璃效果的卡片容器组件 */}
            <GlassCard className="!p-5 cursor-pointer group">
              {/* 模块图标 */}
              <div className="text-2xl mb-2">{l.icon}</div>
              {/* 模块名称（悬停时文字变色，增强交互反馈） */}
              <div className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{l.label}</div>
              {/* 模块功能简短描述 */}
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{l.desc}</div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* 管理员操作提示卡片 */}
      <GlassCard className="!p-5">
        <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">🛠 管理员操作提示</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          欢迎进入系统管理后台。您可以在此管理高校信息、专业信息、填报技巧以及用户留言。所有修改将立即生效。
        </p>
      </GlassCard>
    </div>
  );
}
