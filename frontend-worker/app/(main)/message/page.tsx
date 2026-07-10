/**
 * 留言板页面 — Message Board Page
 *
 * 【页面用途】
 * 用户留言板，支持用户发表对系统的使用感受或建议。页面分为两部分：
 * 上部分是留言发表区域（输入框 + 提交按钮），下部分是所有历史留言的列表。
 * 留言按时间倒序排列，每条留言显示用户 ID（或匿名）、内容和发表时间。
 * 发表后自动刷新留言列表，确保用户立即看到自己的留言。
 */

"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import { TextArea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api, type Msg } from "@/lib/api";
import { MessageSquare, Send } from "lucide-react";

export default function MessagePage() {
  // 留言列表数据
  const [msgs, setMsgs] = useState<Msg[]>([]);
  // 用户正在输入的留言内容
  const [content, setContent] = useState("");
  // 提交中的锁定状态，防止重复提交
  const [submitting, setSubmitting] = useState(false);

  /**
   * 加载留言列表 —— 从 API 获取所有留言并更新状态
   */
  const load = () => api.msg.list().then(setMsgs).catch(() => {});
  // 组件挂载时加载留言列表
  useEffect(() => { load(); }, []);

  /**
   * 提交留言 —— 校验内容非空后调用 API 发布，
   * 成功后清空输入框并刷新列表
   */
  const submit = async () => {
    // 去除首尾空格后判空
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.msg.create(content);
      setContent("");    // 清空输入框
      await load();      // 重新加载留言列表
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">💬 留言板</h1>

      {/* 留言发表区域 */}
      <GlassCard className="!p-5 mb-6">
        {/* 多行文本输入框 */}
        <TextArea
          placeholder="写下您对系统的使用感受或建议..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        {/* 提交按钮：右对齐，提交中禁用并显示不同文案 */}
        <div className="flex justify-end mt-3">
          <Button variant="primary" disabled={submitting} onClick={submit}>
            <Send size={14} /> {submitting ? "发表中..." : "发表留言"}
          </Button>
        </div>
      </GlassCard>

      {/* 装饰性分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-6" />
      <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4">所有留言</h2>

      {/* 留言列表：无留言时显示引导文案，有留言时遍历展示 */}
      {!msgs.length ? (
        <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">暂无留言，快来发表第一条吧</div>
      ) : (
        <div className="flex flex-col gap-3">
          {msgs.map(m => (
            <GlassCard key={m.id} className="!p-4">
              {/* 留言头部：用户 ID（或匿名）+ 发布时间 */}
              <div className="flex items-center justify-between mb-2">
                <Badge>{m.user_id ?? "匿名"}</Badge>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(m.created_at!).toLocaleString("zh-CN")}
                </span>
              </div>
              {/* 留言正文 */}
              <p className="text-sm text-slate-600 dark:text-slate-300">{m.content}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
