/**
 * 估分选大学页面 — Score Recommendation Page
 *
 * 【页面用途】
 * 用户输入高考分数后，系统根据分数智能推荐可报考的高校。
 * 推荐结果按匹配度分为三个梯队：保底院校（分数远高于录取线）、
 * 稳妥院校（分数匹配较稳定）和冲刺院校（分数接近录取线可尝试冲刺）。
 * 每个推荐结果都包含高校名称、排名和省份信息，点击可查看详情。
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { api, type RecResult } from "@/lib/api";
import { TrendingUp, Search } from "lucide-react";

function RecommendPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // 用户输入的分数
  const [score, setScore] = useState(searchParams.get("score") || "");
  // 查询加载状态
  const [loading, setLoading] = useState(false);
  // 分组推荐结果：包含三个梯队（保底/稳妥/冲刺），每组有标题、主题色和数据项
  const [groups, setGroups] = useState<{ title: string; color: string; items: RecResult[] }[]>([]);
  const [filter, setFilter] = useState<string>("all");

  /**
   * 执行推荐查询 —— 将用户输入的分数传给后端 API，
   * 获取推荐列表后按匹配度（match_degree）分成三组，
   * 过滤掉空组后更新状态
   */
  const search = async (autoScore?: string) => {
    const s = parseInt(autoScore || score);
    // 输入校验：必须为有效非负整数
    if (isNaN(s) || s < 0) return;
    // 分数写入 URL，返回时保留
    router.replace("/recommend?score=" + s, { scroll: false });
    setLoading(true);
    try {
      const list = await api.uni.recommend(s);
      // 按 match_degree 字段分组：保底 / 稳妥 / 冲刺
      const gs = [
        { title: "🛡 保底院校", color: "success", items: list.filter(u => u.match_degree === "保底") },
        { title: "✅ 稳妥院校", color: "primary", items: list.filter(u => u.match_degree === "稳妥") },
        { title: "🚀 冲刺院校", color: "accent", items: list.filter(u => u.match_degree === "冲刺") },
      ].filter(g => g.items.length); // 过滤掉没有数据的组
      setGroups(gs);
    } catch {}
    finally { setLoading(false); }
  };

  // 页面加载时从 URL 读取分数自动查询
  useEffect(() => {
    const s = searchParams.get("score");
    if (s) { setScore(s); search(s); }
  }, []);

  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">📊 估分选大学</h1>

      {/* 输入区域 */}
      <GlassCard className="!p-6 mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">输入您的高考分数，系统将智能推荐可报考的高校</p>
        <div className="flex items-end gap-4">
          <div className="max-w-xs">
            {/* 分数输入框 */}
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">我的分数</label>
            <input
              className="glass-input"
              type="number"
              placeholder="请输入高考分数"
              value={score}
              onChange={e => setScore(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}  // 回车键触发查询
            />
          </div>
          {/* 推荐按钮，加载中时禁用并显示不同文案 */}
          <Button variant="primary" disabled={loading} onClick={() => search()}>
            <Search size={14} /> {loading ? "查询中..." : "开始推荐"}
          </Button>
        </div>
      </GlassCard>

      {/* 筛选按钮 */}
      {groups.length > 0 && (
        <div className="flex gap-2 mb-4">
          {[
            { key: "all", label: "全部", color: "bg-slate-400" },
            { key: "冲刺", label: "🚀 冲刺", color: "bg-rose-400" },
            { key: "稳妥", label: "✅ 稳妥", color: "bg-emerald-400" },
            { key: "保底", label: "🛡 保底", color: "bg-blue-400" },
          ].map(b => (
            <button
              key={b.key}
              onClick={() => setFilter(b.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === b.key
                  ? b.color + " text-white shadow-lg"
                  : "bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* 初始引导状态：未查询时提示用户输入分数 */}
      {!groups.length && !loading && (
        <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">输入分数后点击「开始推荐」</div>
      )}

      {/* 推荐结果分组展示：遍历保底/稳妥/冲刺三个梯队 */}
      {groups
        .filter(g => filter === "all" || g.title.includes(filter))
        .map(g => (
        <div key={g.title} className="mb-6">
          {/* 分组标题，显示名称和该组高校数量 */}
          <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">{g.title}（{g.items.length}所）</h3>
          <div className="flex flex-col gap-2">
            {g.items.map(u => (
              <Link key={u.id} href={`/university/${u.id}`}>
                <GlassCard className="!p-3 flex items-center justify-between group cursor-pointer" hover={false}>
                  <div className="flex items-center gap-3">
                    {/* 排名徽标（颜色与分组匹配） */}
                    <Badge variant={g.color as any}>{u.ranking}</Badge>
                    {/* 高校名称，hover 时高亮 */}
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{u.name}</span>
                    {/* 省份信息 */}
                    <span className="text-xs text-slate-400 dark:text-slate-500">{u.province}</span>
                  </div>
                  {/* 最低录取分数 */}
                  <Badge variant={g.color as any}>最低 {u.min_score}分</Badge>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecommendPage() {
  return <Suspense fallback={<div className="text-center py-12 text-sm text-slate-400">加载中...</div>}><RecommendPageInner /></Suspense>;
}
