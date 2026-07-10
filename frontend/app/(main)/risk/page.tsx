"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { api, type RiskWarning } from "@/lib/api";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function RiskPage() {
  const [risk, setRisk] = useState<RiskWarning | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.application.checkRisk();
      setRisk(data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">⚠️ 风险预警</h1>

      <Button variant="default" onClick={load} disabled={loading} className="mb-6">
        <RefreshCw size={14} /> 重新分析
      </Button>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-12">分析中...</p>
      ) : !risk ? (
        <p className="text-sm text-slate-400 text-center py-12">获取数据失败</p>
      ) : risk.total === 0 ? (
        <GlassCard className="!p-8 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-2">暂无志愿数据</p>
          <p className="text-xs text-slate-400 mb-4">请先添加志愿后再进行风险分析</p>
          <Link href="/application">
            <Button variant="primary">去添加志愿</Button>
          </Link>
        </GlassCard>
      ) : (
        <>
          {/* 冲稳保分布 */}
          <GlassCard className="!p-6 mb-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">🎯 冲稳保分布</h2>
            <div className="flex items-center justify-center gap-8 mb-4">
              <svg width="140" height="140" viewBox="0 0 32 32" className="shrink-0">
                {(() => {
                  const total = risk.reach + risk.stable + risk.safe;
                  if (total === 0) return <circle cx="16" cy="16" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="2" />;
                  const toDeg = (c: number) => (c / total) * 360;
                  const polar = (deg: number, r: number) => {
                    const a = ((deg - 90) * Math.PI) / 180;
                    return [16 + r * Math.cos(a), 16 + r * Math.sin(a)];
                  };
                  const slices = [
                    { deg: toDeg(risk.reach), color: "#fb7185" },
                    { deg: toDeg(risk.stable), color: "#34d399" },
                    { deg: toDeg(risk.safe), color: "#60a5fa" },
                  ];
                  let cur = 0;
                  return slices.map((s, i) => {
                    if (s.deg <= 0) return null;
                    const d = s.deg >= 359.9 ? 359.9 : s.deg;
                    const [x1, y1] = polar(cur, 15.9);
                    const [x2, y2] = polar(cur + d, 15.9);
                    const large = d > 180 ? 1 : 0;
                    cur += d;
                    return <path key={i} d={`M16,16 L${x1},${y1} A15.9,15.9 0 ${large} 1 ${x2},${y2} Z`} fill={s.color} />;
                  });
                })()}
                <circle cx="16" cy="16" r="10" fill="white" className="dark:fill-slate-800" />
                <text x="16" y="14" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="5" fontWeight="bold">
                  {risk.reach + risk.stable + risk.safe}
                </text>
                <text x="16" y="19" textAnchor="middle" className="fill-slate-400" fontSize="3.5">个志愿</text>
              </svg>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  { label: "冲刺", color: "bg-rose-400", count: risk.reach },
                  { label: "稳妥", color: "bg-emerald-400", count: risk.stable },
                  { label: "保底", color: "bg-blue-400", count: risk.safe },
                ].map(t => {
                  const total = risk.reach + risk.stable + risk.safe;
                  const pct = total > 0 ? ((t.count / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={t.label} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${t.color}`} />
                      <span className="text-slate-600 dark:text-slate-300">{t.label}</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{t.count}</span>
                      <span className="text-slate-400 text-xs">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-slate-400">建议比例：冲刺 20% / 稳妥 40% / 保底 40%</p>
          </GlassCard>

          {/* 检查项 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                {risk.has_duplicate ? <AlertTriangle size={16} className="text-amber-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">重复院校</span>
              </div>
              <p className="text-xs text-slate-400">{risk.has_duplicate ? "存在重复院校" : "无重复院校"}</p>
            </GlassCard>
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                {risk.has_reverse ? <AlertTriangle size={16} className="text-amber-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">分数倒挂</span>
              </div>
              <p className="text-xs text-slate-400">{risk.has_reverse ? "存在分数倒挂" : "顺序合理"}</p>
            </GlassCard>
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                {risk.total < 6 ? <AlertTriangle size={16} className="text-amber-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">志愿数量</span>
              </div>
              <p className="text-xs text-slate-400">{risk.total} 个（建议至少 6 个）</p>
            </GlassCard>
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                {risk.warnings.length > 0 ? <AlertTriangle size={16} className="text-rose-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">综合评估</span>
              </div>
              <p className="text-xs text-slate-400">{risk.warnings.length > 0 ? `${risk.warnings.length} 项预警` : "志愿方案合理"}</p>
            </GlassCard>
          </div>

          {/* 预警详情 */}
          {risk.warnings.length > 0 && (
            <GlassCard className="!p-6 mb-6 !bg-amber-50/50 dark:!bg-amber-900/10">
              <h2 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> 预警详情
              </h2>
              <ul className="flex flex-col gap-2">
                {risk.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span> {w}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* 改进建议 */}
          <GlassCard className="!p-6 !bg-indigo-50/50 dark:!bg-indigo-900/10">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-2">💡 改进建议</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{risk.suggestion}</p>
          </GlassCard>
        </>
      )}
    </div>
  );
}
