/**
 * Next.js 配置文件
 *
 * 本文件为 Next.js 应用的构建和运行时配置。
 * 主要包含 API 请求代理规则，将前端发往 /api/* 的请求转发到后端 FastAPI 服务。
 */

import type { NextConfig } from "next";

/**
 * Next.js 配置对象
 * 使用类型 NextConfig 确保配置项的类型安全
 */
const nextConfig: NextConfig = {
  /**
   * rewrites 重写规则
   * 将前端 /api/* 路径的请求代理到后端服务地址。
   * 开发环境下后端运行在 localhost:8000。
   */
  async rewrites() {
    return [
      {
        // 前端请求路径模式：匹配所有以 /api/ 开头的路径
        source: "/api/:path*",
        // 目标地址：转发到后端 FastAPI 服务的对应路径
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
