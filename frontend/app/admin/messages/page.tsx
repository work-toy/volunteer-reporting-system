/**
 * 留言管理页面 (MsgManagePage)
 *
 * 页面用途：
 *   提供用户留言的查看和删除功能。管理员可以：
 *   1. 查看所有用户留言列表（以卡片形式展示留言者信息、内容和时间）
 *   2. 删除留言（需二次确认）
 *
 * 设计特点：
 *   - 留言以卡片列表形式展示，每张卡片包含用户标识、留言时间和内容
 *   - 不提供编辑功能，留言一经发布不可修改（仅可删除）
 *   - 匿名留言的用户ID显示为"匿名"
 *   - 删除操作有二次确认弹窗
 */

"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import { api, type Msg } from "@/lib/api";
import { Trash2 } from "lucide-react";

export default function MsgManagePage() {
  // 留言列表数据
  const [msgs, setMsgs] = useState<Msg[]>([]);

  /**
   * 删除留言
   * 使用浏览器原生 confirm 弹窗进行二次确认，防止误删
   * @param id - 要删除的留言 ID
   */
  const del = async (id: number) => {
    if (!confirm("确认删除这条留言？")) return;
    try { await api.msg.delete(id); setMsgs(await api.msg.list()); }
    catch {} // 删除失败时静默处理（不打扰用户）
  };

  // 页面初始化时加载留言列表
  useEffect(() => { api.msg.list().then(setMsgs).catch(() => {}); }, []);

  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">💬 留言管理</h1>

      {!msgs.length ? (
        // 留言列表为空时的占位提示
        <div className="text-center py-12 text-sm text-slate-400">暂无留言</div>
      ) : (
        // 留言卡片列表：每张卡片展示一条留言
        <div className="flex flex-col gap-3">
          {msgs.map(m => (
            <GlassCard key={m.id} className="!p-4 flex items-start justify-between">
              {/* 左侧：留言内容区域 */}
              <div className="flex-1">
                {/* 用户标识和时间戳 */}
                <div className="flex items-center gap-2 mb-1">
                  {/* 用户ID用 Badge 标签显示，匿名显示为"匿名" */}
                  <Badge>{m.user_id ?? "匿名"}</Badge>
                  {/* 留言时间，格式化为中文本地时间字符串 */}
                  <span className="text-xs text-slate-400">{new Date(m.created_at!).toLocaleString("zh-CN")}</span>
                </div>
                {/* 留言正文内容 */}
                <p className="text-sm text-slate-600 dark:text-slate-300">{m.content}</p>
              </div>
              {/* 右侧：删除按钮 */}
              <button onClick={() => del(m.id)} className="glass-btn !p-2 rounded-lg hover:!text-rose-500 shrink-0 ml-4">
                <Trash2 size={14} />
              </button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
