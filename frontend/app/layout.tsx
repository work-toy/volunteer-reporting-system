/**
 * 根布局组件 — RootLayout
 *
 * 这是 Next.js 应用的根布局文件，包裹所有页面。
 * 定义了全局 HTML 结构、SEO 元信息、字体和背景样式。
 * 采用玻璃拟态（Glassmorphism）设计风格。
 */

import type { Metadata } from "next";
import "./globals.css";

/**
 * 页面元数据（Metadata）
 * 用于 SEO 和浏览器标签页显示。
 * title — 页面标题
 * description — 页面描述，搜索引擎会将其显示在搜索结果中
 */
export const metadata: Metadata = {
  title: "高考志愿辅助填报系统",
  description: "《数据库系统》课程设计",
};

/**
 * 根布局组件
 *
 * @param children - 子页面组件，由 Next.js 自动传入当前路由对应的页面内容
 *
 * 布局细节：
 * - lang="zh-CN" — 声明页面语言为简体中文，有利于 SEO 和浏览器翻译
 * - suppressHydrationWarning — 抑制 SSR 与客户端渲染不一致时的警告
 *   因为某些背景样式在服务端和客户端可能产生差异
 * - min-h-screen — 最小高度占满视口高度
 * - bg-slate-50 / dark:bg-slate-950 — 浅色/深色模式下的背景色
 * - 两层渐变背景装饰（固定定位）实现动态渐变效果
 *   - 第一层使用 .bg-gradient-animate 实现流动渐变动画
 *   - 第二/三层使用大模糊半径的圆形制造柔和光晕效果
 * - -z-10 确保装饰背景在所有内容的下层
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        {/*
          渐变背景装饰层
          fixed 定位脱离文档流，覆盖整个视口
          inset-0 等价于 top:0; right:0; bottom:0; left:0
          -z-10 将其置于所有内容之后
        */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/*
            主渐变动画层
            bg-gradient-animate 类定义了一个 45 度角的多色渐变，
            通过 animation 驱动 background-position 产生流动效果
            浅色模式不透明度 50%，深色模式降低到 20% 避免过亮
          */}
          <div className="absolute inset-0 bg-gradient-animate opacity-50 dark:opacity-20" />
          {/*
            左上角紫色光晕
            使用 blur-[100px] 大模糊半径产生柔和发光效果
            w-[40%] h-[40%] 相对视口大小
          */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 blur-[100px] rounded-full" />
          {/*
            右下角紫色光晕
            与左上角对称，营造深度感
          */}
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 blur-[100px] rounded-full" />
        </div>
        {/* 子页面内容由 Next.js 自动注入 */}
        {children}
      </body>
    </html>
  );
}
