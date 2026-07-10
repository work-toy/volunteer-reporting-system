/**
 * 系统首页页面 — Home Page
 *
 * 【页面用途】
 * 用户登录后看到的第一个页面（仪表盘）。以卡片网格的形式展示四个核心功能模块的快捷入口，
 * 同时从后端 API 获取高校排行数据，展示排行榜 TOP 5 的高校列表，
 * 方便用户快速浏览顶尖高校及其录取分数。
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import { api, type Uni } from "@/lib/api";
import { Building2, TrendingUp, Lightbulb, MessageSquare, ArrowRight, PenLine, ClipboardList, AlertTriangle } from "lucide-react";

// 快速入口配置 —— 定义了首页上功能卡片的配置
const LINKS = [
  { href: "/score", label: "成绩录入", desc: "录入高考分数和位次，用于智能推荐", icon: PenLine, color: "text-violet-500" },
  { href: "/university", label: "高校信息", desc: "查看全国高校排名、简介、历史录取分数", icon: Building2, color: "text-indigo-500" },
  { href: "/recommend", label: "估分选大学", desc: "输入高考分数，智能推荐可报考的高校", icon: TrendingUp, color: "text-emerald-500" },
  { href: "/application", label: "志愿填报", desc: "模拟填报志愿，排序和提交志愿表", icon: ClipboardList, color: "text-sky-500" },
  { href: "/risk", label: "风险预警", desc: "分析志愿方案，检查冲稳保比例和风险", icon: AlertTriangle, color: "text-rose-500" },
  { href: "/skill", label: "填报技巧", desc: "专家分享的高考志愿填报技巧与建议", icon: Lightbulb, color: "text-amber-500" },
  { href: "/message", label: "留言板", desc: "发表您对系统的使用感受和建议", icon: MessageSquare, color: "text-teal-500" },
];

export default function HomePage() {
  // 存储排行前 5 的高校列表
  const [top5, setTop5] = useState<Uni[]>([]);
  // 组件挂载时异步获取高校列表并取前 5 条
  useEffect(() => { api.uni.list().then(d => setTop5(d.slice(0, 5))).catch(() => {}); }, []);

  return (
    <div>
      {/* 页面标题区域 */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">系统首页</h1>
      </div>

      {/* 功能快捷入口卡片网格 —— 2 列布局，展示 4 个核心功能 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {LINKS.map(l => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href}>
              <GlassCard className="flex items-start gap-4 !p-5 cursor-pointer group">
                {/* 图标容器：圆角背景 + 主题色 */}
                <div className={`w-10 h-10 rounded-xl bg-white/60 dark:bg-slate-700/60 flex items-center justify-center ${l.color} shrink-0`}>
                  <Icon size={20} />
                </div>
                {/* 文字区域：标题 + 描述 */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{l.label}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{l.desc}</div>
                </div>
                {/* 右侧箭头图标，hover 时变色 */}
                <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors mt-1 shrink-0" />
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* 高校排行 TOP 5 区域 —— 仅在获取到数据时渲染 */}
      {top5.length > 0 && (
        <GlassCard>
          {/* 区域标题 */}
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-500" /> 高校排行 TOP 5
          </h2>
          {/* 排行表格 */}
          <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50">
            <table className="w-full text-sm">
              {/* 表头：排名、高校名称、最低分 */}
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">排名</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">高校名称</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500 dark:text-slate-400">最低分</th>
                </tr>
              </thead>
              {/* 表格数据行：遍历 top5 列表展示 */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {top5.map((u, i) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* 排名列：前三名使用 primary 样式徽标 */}
                    <td className="px-4 py-2.5"><Badge variant={i < 3 ? "primary" : "default"}>{u.ranking}</Badge></td>
                    {/* 高校名称列：可点击跳转到高校详情页 */}
                    <td className="px-4 py-2.5">
                      <Link href={`/university/${u.id}`} className="text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">{u.name}</Link>
                    </td>
                    {/* 最低分列：无数据时显示 "-" */}
                    <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{u.min_score ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
