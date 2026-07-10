/**
 * 填报技巧页面 — Skill / Tips Page
 *
 * 【页面用途】
 * 展示高考志愿填报相关的技巧和建议文章。文章由专家或系统发布，
 * 以时间倒序排列，每条技巧包含标题、发布人、内容正文和发布日期。
 * 内容支持多行文本展示（whitespace-pre-wrap），适合呈现带格式的段落文本。
 */

"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import { api, type Skill } from "@/lib/api";
import { Lightbulb } from "lucide-react";

export default function SkillPage() {
  // 填报技巧列表
  const [skills, setSkills] = useState<Skill[]>([]);
  // 组件挂载时从 API 获取填报技巧数据
  useEffect(() => { api.skill.list().then(setSkills).catch(() => {}); }, []);

  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">💡 填报技巧</h1>

      {/* 条件渲染：无数据时展示空状态，有数据时渲染卡片列表 */}
      {!skills.length ? (
        <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">暂无填报技巧</div>
      ) : (
        <div className="flex flex-col gap-4">
          {skills.map(s => (
            /* 每条技巧以 GlassCard 卡片展示 */
            <GlassCard key={s.id} className="!p-6">
              {/* 卡片头部：标题 + 发布人标签 */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 dark:text-white">{s.title}</h3>
                {/* 发布人信息，无发布人时显示"系统" */}
                <Badge>{s.publisher ? `发布人: ${s.publisher}` : "系统"}</Badge>
              </div>
              {/* 技巧正文：保留原格式（换行、空格等） */}
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{s.content}</p>
              {/* 发布日期（底部），转为中文日期格式 */}
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                {s.created_at ? new Date(s.created_at).toLocaleDateString("zh-CN") : ""}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
