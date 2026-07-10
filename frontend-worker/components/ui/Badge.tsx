/**
 * Badge.tsx — 徽章/标签组件
 *
 * 功能：
 * - 显示一个小型的状态标签，常用于表示分类、状态或计数
 * - 支持五种风格变体，每种变体在浅色/深色模式下有不同颜色
 *
 * Props：
 * - variant?: "default" | "primary" | "success" | "danger" | "accent"
 * - children: React.ReactNode — 徽章内显示的内容（文字/数字/图标）
 * - className?: 额外的自定义样式类
 *
 * 变体说明：
 * - default: 灰色（中性），适用于普通标签
 * - primary: 靛蓝色（indigo），适用于主要分类
 * - success: 翠绿色（emerald），适用于成功/已完成状态
 * - danger: 玫瑰红色（rose），适用于错误/警告状态
 * - accent: 琥珀色（amber），适用于强调/高亮
 */

"use client";

interface Props { variant?: "default" | "primary" | "success" | "danger" | "accent"; children: React.ReactNode; className?: string }

// 变体对应的颜色映射表
// 浅色模式使用浅色背景 + 深色文字
// 深色模式使用半透明背景 + 浅色文字
const variants = {
  default: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  primary: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  success: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  danger: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  accent: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

export default function Badge({ variant = "default", className = "", children }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
