"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import { api, type Uni, type Major, type AdmissionYear } from "@/lib/api";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function UniDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [uni, setUni] = useState<Uni | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [err, setErr] = useState("");
  const [admission, setAdmission] = useState<AdmissionYear[]>([]);

  useEffect(() => {
    const uid = Number(id);
    if (!uid) { setErr("参数错误"); return; }
    api.uni.get(uid).then(setUni).catch(e => setErr(e.message));
    api.major.list(uid).then(setMajors).catch(() => {});
    api.uni.admission(uid).then(setAdmission).catch(() => {});
  }, [id]);

  if (err) return <div className="text-rose-500">{err}</div>;
  if (!uni) return <div className="text-slate-400 text-center py-12">加载中...</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-4 transition-colors">
        <ArrowLeft size={14} /> 返回上一页
      </button>

      <GlassCard className="!p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge variant="primary" className="!text-sm mb-2">排名 #{uni.ranking}</Badge>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">{uni.name}</h1>
          </div>
          <Badge variant="success" className="!text-base !px-4 !py-1.5">{uni.min_score ?? "-"} 分</Badge>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4" />

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div><span className="text-slate-400 dark:text-slate-500">所在省份：</span><span className="text-slate-700 dark:text-slate-300 font-medium">{uni.province ?? "-"}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500">历史最低录取分：</span><span className="text-slate-700 dark:text-slate-300 font-bold">{uni.min_score ?? "-"}</span></div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{uni.description || "暂无简介"}</p>
      </GlassCard>

      <div className="mt-6">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-500" /> 开设专业
        </h2>
        {majors.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {majors.map(m => (
              <GlassCard key={m.id} className="!p-4">
                <div className="font-semibold text-slate-800 dark:text-white">{m.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{m.description || "暂无简介"}</div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 dark:text-slate-500">暂无专业数据</div>
        )}
      </div>

      {admission.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">📊 历年录取分数线</h2>
          <GlassCard className="!p-4 mb-4">
            {(() => {
              const data = [...admission].reverse();
              const w = 280, h = 140, pad = { top: 10, right: 10, bottom: 20, left: 35 };
              const cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom;
              const scores = data.map(d => d.min_score ?? 0);
              const avgs = data.map(d => d.avg_score ?? 0);
              const all = [...scores, ...avgs];
              const minY = Math.min(...all) - 5, maxY = Math.max(...all) + 5;
              const scaleY = (v: number) => pad.top + ch - ((v - minY) / (maxY - minY)) * ch;
              const scaleX = (i: number) => pad.left + (i / (data.length - 1 || 1)) * cw;

              const line = (vals: number[], color: string) => {
                const pts = vals.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ');
                return <polyline key={color} points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />;
              };
              const dots = (vals: number[], color: string) =>
                vals.map((v, i) => <circle key={color+i} cx={scaleX(i)} cy={scaleY(v)} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />);

              return (
                <svg viewBox={'0 0 ' + w + ' ' + h} className="w-full max-w-sm mx-auto">
                  {[0, 0.25, 0.5, 0.75, 1].map(t => {
                    const y = pad.top + ch * (1 - t);
                    const val = Math.round(minY + (maxY - minY) * t);
                    return <g key={t}>
                      <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                      <text x={pad.left - 4} y={y + 3} textAnchor="end" className="fill-slate-400" fontSize="9">{val}</text>
                    </g>;
                  })}
                  {data.map((d, i) =>
                    <text key={d.year} x={scaleX(i)} y={h - 4} textAnchor="middle" className="fill-slate-500" fontSize="10">{d.year}</text>
                  )}
                  {line(scores, '#6366f1')}
                  {line(avgs, '#34d399')}
                  {dots(scores, '#6366f1')}
                  {dots(avgs, '#34d399')}
                  <rect x={pad.left + 5} y={pad.top + 3} width="8" height="2" rx="1" fill="#6366f1" />
                  <text x={pad.left + 16} y={pad.top + 7} className="fill-slate-500" fontSize="9">最低分</text>
                  <rect x={pad.left + 55} y={pad.top + 3} width="8" height="2" rx="1" fill="#34d399" />
                  <text x={pad.left + 66} y={pad.top + 7} className="fill-slate-500" fontSize="9">平均分</text>
                </svg>
              );
            })()}
          </GlassCard>
          <GlassCard className="!p-4">
            <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-4 py-2.5 text-left font-medium text-slate-500">年份</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-500">最低分</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-500">最低位次</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-500">平均分</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-500">录取人数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                  {admission.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5"><Badge>{a.year}</Badge></td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{a.min_score ?? "-"}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{a.min_rank ?? "-"}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{a.avg_score ?? "-"}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{a.enrollment_num ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
