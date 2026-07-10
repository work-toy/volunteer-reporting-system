/*
 * 认证模块布局组件（Auth Layout）
 *
 * 这是 (auth) 路由组下的共享布局文件，适用于所有与认证相关的页面，
 * 包括：身份选择页（/select）、用户登录（/user-login）、用户注册（/user-register）、
 * 管理员登录（/admin-login）。
 *
 * 该布局提供了一个全屏居中的卡片式容器，确保所有认证页面的视觉风格统一。
 * 子页面只需提供卡片内部的表单内容，无需重复处理外层布局结构。
 * 使用 min-h-screen 保证在短内容时也能撑满整个视口高度。
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // 渲染一个全屏居中的容器，内边距 p-4 防止在小屏幕上贴边
  // flex + items-center + justify-center 实现水平和垂直双向居中
  return <div className="min-h-screen flex items-center justify-center p-4">{children}</div>;
}
