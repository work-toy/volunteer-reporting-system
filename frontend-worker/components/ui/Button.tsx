/**
 * Button.tsx — 通用按钮组件
 *
 * 功能：
 * - 基于毛玻璃样式（glass-btn）的按钮
 * - 支持三种风格变体：默认、主要（indigo）、危险（rose）
 * - 支持两种尺寸：sm（小）和 md（中，默认）
 * - 透传所有原生 <button> 属性（onClick、disabled、type 等）
 *
 * Props：
 * - variant?: "default" | "primary" | "danger"
 * - size?: "sm" | "md"
 * - className?: 额外的自定义样式类
 * - children: 按钮内容
 * - ...props: 其余原生 button 属性
 */

"use client";

// 继承 React 的 ButtonHTMLAttributes，同时添加自定义的 variant 和 size
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md";
}

export default function Button({ variant = "default", size = "md", className = "", children, ...props }: Props) {
  // 根据 size 选择对应的内边距和字号
  // sm: 小按钮，紧凑 padding；md: 中等按钮，常规 padding
  const sizeCls = size === "sm" ? "px-3 py-1.5 text-xs rounded-lg" : "px-5 py-2.5 text-sm rounded-xl";
  // 根据 variant 选择颜色方案
  // primary: 靛蓝色（indigo），常用于主要操作按钮
  // danger: 玫瑰红色（rose），常用于删除/危险操作
  // default: 不额外覆盖颜色，沿用 glass-btn 的默认样式
  const colorCls = variant === "primary"
    ? "!bg-indigo-500 !text-white !border-indigo-400 hover:!bg-indigo-600"
    : variant === "danger"
    ? "!bg-rose-500 !text-white !border-rose-400 hover:!bg-rose-600"
    : "";

  return (
    // 合并基础样式 + 尺寸样式 + 颜色样式 + 用户自定义样式
    // 使用 !important 前缀覆盖 glass-btn 的默认颜色
    <button className={`glass-btn font-medium ${sizeCls} ${colorCls} ${className}`} {...props}>
      {children}
    </button>
  );
}
