/**
 * Sidebar.tsx — 侧边栏导航组件
 *
 * 功能：
 * - 根据传入的 items 数组渲染一组导航链接
 * - 高亮当前激活（与 pathname 匹配）的导航项
 * - 支持自定义分组标题（默认为"菜单"）
 *
 * Props：
 * - items: NavItem[] — 导航项列表，每项包含 href（链接）、label（显示文字）和可选的 icon
 * - title?: string — 侧边栏分组标题（默认"菜单"）
 *
 * 样式特点：
 * - 固定宽度 208px（w-52），毛玻璃效果
 * - 激活项以 indigo-500 背景高亮，带阴影
 * - 未激活项 hover 时显示半透明白色背景
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 导航项的类型定义
// href: 跳转路径（如 "/dashboard"）
// label: 显示文字
// icon: 可选的图标（通常为 emoji 或 SVG 字符串）
interface NavItem { href: string; label: string; icon?: string }

export default function Sidebar({ items, title = "菜单" }: { items: NavItem[]; title?: string }) {
  // 获取当前的 URL 路径，用于判断导航项是否处于激活状态
  const pathname = usePathname();

  return (
    <nav className="w-52 shrink-0 glass border-r border-white/20 dark:border-white/5 p-3 flex flex-col gap-0.5">
      {/*
       * 分组标题
       * 小号大写文字（uppercase），间距宽松（tracking-widest）
       */}
      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-3 py-2 tracking-widest uppercase">{title}</div>
      {items.map((item) => {
        // 判断当前项是否激活：路径完全匹配
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isActive
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-medium"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/40"
            }`}
          >
            {/*
             * 如果 item.icon 存在，则渲染为文字/SVG 图标
             * 放在 label 之前，间距由 gap-2.5 控制
             */}
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
