/**
 * Dialog.tsx — 模态对话框组件
 *
 * 功能：
 * - 显示一个居中弹窗，遮罩层覆盖整个视口
 * - 点击遮罩层外部关闭对话框
 * - 打开时禁止页面滚动（overflow: hidden）
 * - 组件卸载时自动恢复页面滚动
 *
 * Props：
 * - open: boolean — 控制对话框显示/隐藏
 * - onClose: () => void — 关闭回调
 * - title: string — 对话框标题
 * - children: React.ReactNode — 对话框内容
 *
 * 样式特点：
 * - 固定定位，z-50 为最高层级
 * - 遮罩层使用半透明白色 + backdrop-blur 毛玻璃模糊效果
 * - 内容卡片使用 glass-card 样式，最大宽度 lg（512px），最大高度 85vh
 * - 右上角有关闭按钮（X 图标）
 */

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Dialog({ open, onClose, title, children }: Props) {
  // 当 open 状态变化时，控制 body 的滚动
  useEffect(() => {
    // 对话框打开时禁止页面滚动
    if (open) document.body.style.overflow = "hidden";
    // 对话框关闭时恢复页面滚动
    else document.body.style.overflow = "";
    // 组件卸载时（例如路由跳转）也要确保恢复滚动
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // open 为 false 时不渲染任何内容
  if (!open) return null;

  return (
    <>
    {/*
     * 最外层容器：固定铺满视口，flex 居中
     * onClick={onClose} 实现"点击遮罩外部关闭"
     * p-4 在小屏幕上留出边距
     */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/*
       * 遮罩层：半透明黑色 + 毛玻璃模糊效果
       * 绝对定位铺满，在内容卡片的下层
       */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      {/*
       * 对话框卡片容器
       * onClick 阻止事件冒泡，避免点击卡片内部触发 onClose
       * relative 确保在遮罩层之上
       * glass-card 提供毛玻璃卡片样式
       * max-w-lg 限制最大宽度为 512px
       * max-h-[85vh] 限制最大高度为视口高度的 85%，超出可滚动
       */}
      <div className="relative glass-card !p-6 w-full max-w-lg max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/*
         * 标题栏区域
         * flex 布局：标题在左，关闭按钮在右
         */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          {/*
           * 关闭按钮
           * 使用 glass-btn 样式，X 图标尺寸为 16px
           */}
          <button onClick={onClose} className="glass-btn !p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>
        {/*
         * 对话框主体内容
         * 由父组件通过 children 传入
         */}
        {children}
      </div>
    </div>
    </>
  );
}
