/**
 * 高校信息列表页面 — University List Page
 *
 * 【页面用途】
 * 展示全国高校的列表视图，提供按关键词搜索和按省份筛选的功能。
 * 用户可以通过搜索框输入高校名称模糊查询，或从下拉框中选择省份进行过滤。
 * 每条高校记录以卡片形式展示：排名、名称、所在省份和最低录取分数，
 * 点击后可跳转至该高校的详情页面。
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { api, type Uni } from "@/lib/api";
import { Search, ArrowRight, BarChart3 } from "lucide-react";

export default function UniversityPage() {
  // 高校列表数据
  const [list, setList] = useState<Uni[]>([]);
  // 省份列表（用于下拉筛选框）
  const [provinces, setProvinces] = useState<string[]>([]);
  // 搜索关键词
  const [keyword, setKeyword] = useState("");
  // 选中的省份过滤器
  const [province, setProvince] = useState("");

  /**
   * 执行搜索 —— 根据当前关键词和省份构造查询参数，调用 API 获取结果
   */
  const search = async () => {
    const p: Record<string, string> = {};
    if (keyword) p.keyword = keyword;   // 非空关键词加入参数
    if (province) p.province = province; // 非空省份加入参数
    setList(await api.uni.list(p));
  };

  // 组件挂载时获取省份列表（供下拉框使用）
  useEffect(() => { api.uni.provinces().then(r => setProvinces(r.provinces)).catch(() => {}); }, []);
  // 组件挂载时执行一次初始搜索（无过滤条件，展示全部）
  useEffect(() => { search(); }, []);

  // 分数段分布统计
  const buckets = [
    { label: "700+", min: 700, max: 999, color: "bg-rose-400" },
    { label: "650-699", min: 650, max: 699, color: "bg-orange-400" },
    { label: "600-649", min: 600, max: 649, color: "bg-amber-400" },
    { label: "550-599", min: 550, max: 599, color: "bg-emerald-400" },
    { label: "500-549", min: 500, max: 549, color: "bg-sky-400" },
    { label: "450-499", min: 450, max: 499, color: "bg-blue-400" },
    { label: "400-449", min: 400, max: 449, color: "bg-indigo-400" },
    { label: "<400", min: 0, max: 399, color: "bg-slate-400" },
  ];
  const dist = buckets.map(b => ({
    ...b,
    count: list.filter(u => u.min_score && u.min_score >= b.min && u.min_score <= b.max).length,
  }));
  const maxCount = Math.max(...dist.map(d => d.count), 1);

  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">🏛 高校信息</h1>

      {/* 分数段分布统计 */}
      {list.length > 0 && (
        <GlassCard className="!p-5 mb-6">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <BarChart3 size={14} /> 分数段分布
          </h3>
          <div className="flex items-end gap-2 h-24">
            {dist.map(d => {
              const h = Math.max(8, (d.count / maxCount) * 80);
              return (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{d.count}</span>
                  <div className="w-full rounded-t-md" style={{ height: h }}>
                    <div className={`w-full h-full rounded-t-md ${d.color}`} style={{ opacity: 0.7 }} />
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">{d.label}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* 搜索与筛选区域 —— 使用 GlassCard 作为容器 */}
      <GlassCard className="!p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* 关键词输入框 */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="搜索高校名称..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}  // 回车触发搜索
            />
          </div>
          {/* 省份筛选下拉框 */}
          <div className="w-36">
            <Select label="省份" value={province} onChange={setProvince} placeholder="全部省份" options={[{value: "", label: "全部省份"}, ...provinces.map(p => ({value: p, label: p}))]} />
          </div>
          {/* 搜索按钮 */}
          <Button onClick={search}><Search size={14} /> 搜索</Button>
        </div>
      </GlassCard>

      {/* 列表区域：无数据时显示空状态提示，有数据时渲染卡片列表 */}
      {!list.length ? (
        <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">暂无数据</div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map(u => (
            <Link key={u.id} href={`/university/${u.id}`}>
              <GlassCard className="!p-4 flex items-center justify-between group cursor-pointer">
                {/* 左侧：排名徽标 + 高校名称 + 省份/分数信息 */}
                <div className="flex items-center gap-4">
                  {/* 排名徽标，加粗显示 */}
                  <Badge variant="primary" className="!text-sm !font-bold min-w-[32px] text-center">{u.ranking}</Badge>
                  <div>
                    {/* 高校名称，hover 时变色 */}
                    <div className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{u.name}</div>
                    {/* 省份和最低分辅助信息 */}
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{u.province ?? "-"} · 最低 {u.min_score ?? "-"}分</div>
                  </div>
                </div>
                {/* 右侧箭头指示可点击进入详情 */}
                <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
