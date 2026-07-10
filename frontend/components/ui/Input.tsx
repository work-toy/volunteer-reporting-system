/**
 * Input.tsx — 表单输入组件集合
 *
 * 本文件导出三个组件：
 *
 * 1. Input  — 标准文本输入框，带可选的 label
 * 2. TextArea — 多行文本输入框，带可选的 label
 * 3. Select — 下拉选择框，带可选的 label
 *
 * 共同特点：
 * - 使用毛玻璃输入框样式（glass-input）
 * - 每个组件都透传其原生 HTML 属性
 * - 可选 label 显示在输入框上方，使用小号灰色字体
 */

"use client";

// 继承原生 input 属性，额外添加可选的 label
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Input — 标准文本输入框
 *
 * 用法：
 *   <Input label="用户名" placeholder="请输入" />
 *   <Input value={val} onChange={handleChange} />
 */
export default function Input({ label, className = "", ...props }: Props) {
  return (
    <div>
      {/*
       * 如果传入了 label 则渲染一个 <label> 元素
       * 样式：小号加粗文字，灰色，与输入框间距 1.5
       */}
      {label && <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>}
      {/*
       * 毛玻璃风格的输入框
       * glass-input 由全局 CSS 定义，包含背景、边框和焦点效果
       * 用户自定义 className 通过模板字符串拼接在最后
       */}
      <input className={`glass-input ${className}`} {...props} />
    </div>
  );
}

/**
 * TextArea — 多行文本输入框
 *
 * 额外特性：
 * - 继承 Props（含 label）以及 TextareaHTMLAttributes
 * - 最小高度 90px（min-h-[90px]）
 * - 允许用户垂直拖拽调整大小（resize-y）
 */
export function TextArea({ label, className = "", ...props }: Props & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>}
      <textarea className={`glass-input min-h-[90px] resize-y ${className}`} {...props} />
    </div>
  );
}

/**
 * Select — 下拉选择框
 *
 * 额外特性：
 * - 继承原生 <select> 属性和可选的 label
 * - 使用 SVG 内联背景图自定义下拉箭头（默认箭头通过 appearance-none 隐藏）
 * - 箭头颜色为 slate-400 (#94a3b8)，位置在右侧居中
 */
export function Select({ label, className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>}
      {/*
       * appearance-none 移除浏览器默认的下拉箭头样式
       * style 中的 backgroundImage 为自定义的向下箭头 SVG（base64 编码）
       * background 位置在右侧 12px 处垂直居中
       */}
      <select className={`glass-input appearance-none cursor-pointer bg-[length:14px] bg-[right_14px_center] pr-11 ${className}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='%236366f1' d='M7 9.5L2 4.5h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat" }} {...props}>
        {children}
      </select>
    </div>
  );
}
