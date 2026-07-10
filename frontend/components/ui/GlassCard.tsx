/**
 * GlassCard.tsx — 毛玻璃卡片容器组件
 *
 * 功能：
 * - 提供一个带有毛玻璃效果（glass-card）的通用卡片容器
 * - 可选 hover 时微小的缩放效果（scale 1.01），增强交互反馈
 * - 透传所有原生 <div> 属性（onClick、id、style 等）
 *
 * Props：
 * - children: React.ReactNode — 卡片内容
 * - className?: string — 额外的自定义样式类
 * - hover?: boolean — 是否启用 hover 缩放效果（默认 true）
 * - ...props — 其余原生 div 属性
 *
 * 样式特点：
 * - 默认内边距 p-5
 * - 使用 glass-card 类（由全局 CSS 定义毛玻璃效果）
 * - 浅色/深色模式自动适配
 */

"use client";

export default function GlassCard({ children, className = "", hover = true, ...props }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <>
    {/*
     * glass-card 提供毛玻璃背景、边框和阴影效果
     * 当 hover 为 true 时添加 hover:scale-[1.01] 实现轻微的放大效果
     * 用户自定义的 className 拼接在最后
     * ...props 透传剩余的原生 div 属性
     */}
    <div className={`glass-card p-5 ${hover ? "hover:scale-[1.01]" : ""} ${className}`} {...props}>
      {children}
    </div>
    </>
  );
}
