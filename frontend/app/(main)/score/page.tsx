"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api, type ScoreRecord } from "@/lib/api";
import { Save, Clock, Trophy } from "lucide-react";

export default function ScorePage() {
  const [score, setScore] = useState("");
  const [rank, setRank] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.score.history().then(setRecords).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const s = parseInt(score);
    const y = parseInt(year);
    if (isNaN(s) || s < 0 || s > 750) { alert("请输入有效分数（0-750）"); return; }
    if (isNaN(y) || y < 2020 || y > 2030) { alert("请输入有效年份"); return; }
    setSaving(true);
    setMsg("");
    try {
      const r = parseInt(rank);
      await api.score.entry({
        score: s,
        rank: isNaN(r) ? null : r,
        year: y,
      });
      setMsg("成绩录入成功！");
      setScore(""); setRank(""); setYear(new Date().getFullYear().toString());
      const updated = await api.score.history();
      setRecords(updated);
    } catch (e: any) {
      alert(e.message || "录入失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">📝 成绩录入</h1>

      {/* 录入表单 */}
      <GlassCard className="!p-6 mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">输入你的高考成绩，用于智能推荐和风险分析</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">高考总分 *</label>
            <input className="glass-input" type="number" placeholder="如 620" value={score}
              onChange={e => setScore(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">全省位次（可选）</label>
            <input className="glass-input" type="number" placeholder="如 35000" value={rank}
              onChange={e => setRank(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">高考年份</label>
            <input className="glass-input" type="number" value={year}
              onChange={e => setYear(e.target.value)} />
          </div>
        </div>
        <Button variant="primary" disabled={saving} onClick={save}>
          <Save size={14} /> {saving ? "保存中..." : "保存成绩"}
        </Button>
        {msg && <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-3">{msg}</p>}
      </GlassCard>

      {/* 历史记录 */}
      <GlassCard>
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" /> 成绩记录
        </h2>
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">加载中...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">暂无成绩记录</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500">年份</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">总分</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">位次</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">录入时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5"><Badge>{r.year}</Badge></td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{r.score}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{r.rank ?? "-"}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
