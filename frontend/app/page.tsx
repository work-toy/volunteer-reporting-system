/*
 * 根页面（Root Page）
 *
 * 这是应用的入口页面（/），其唯一作用是将用户自动重定向到 /select 页面。
 * 由于本项目是一个高考志愿辅助填报系统，用户首次访问时需要先选择身份
 * （普通用户或管理员），因此根路径不展示任何内容，直接跳转到身份选择页。
 * 该组件是 Next.js 的服务器组件，不包含客户端交互逻辑。
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  // 使用 Next.js 的 redirect 函数执行服务端重定向
  // 用户访问 "/" 时自动跳转到 "/select" 页面
  redirect("/select");
}
