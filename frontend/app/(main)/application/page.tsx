"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { api, type ApplicationItem, type Uni, type Major } from "@/lib/api";
import { Plus, Trash2, ArrowUp, ArrowDown, Send, AlertTriangle } from "lucide-react";

export default function ApplicationPage() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [unis, setUnis] = useState<Uni[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selUni, setSelUni] = useState("");
  const [selMajor, setSelMajor] = useState("");
  const [priority, setPriority] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.application.list();
      setApps(data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = async () => {
    setShowAdd(true);
    setSelUni(""); setSelMajor(""); setMajors([]);
    try {
      const data = await api.uni.list();
      setUnis(data);
      setPriority((apps.length + 1).toString());
    } catch (_) {}
  };

  const onUniChange = async (uniId: string) => {
    setSelUni(uniId);
    setSelMajor("");
    if (uniId) {
      try {
        const data = await api.major.list(parseInt(uniId));
        setMajors(data);
      } catch (_) { setMajors([]); }
    } else {
      setMajors([]);
    }
  };

  const addApp = async () => {
    if (!selUni) { alert("请选择院校"); return; }
    setMsg("");
    try {
      await api.application.add({
        university_id: parseInt(selUni),
        major_id: selMajor ? parseInt(selMajor) : null,
        priority: parseInt(priority),
      });
      setShowAdd(false);
      await load();
    } catch (e: any) {
      alert(e.message || "添加失败");
    }
  };

  const removeApp = async (id: number) => {
    try {
      await api.application.delete(id);
      await load();
    } catch (_) {}
  };

  const moveApp = async (idx: number, dir: "up" | "down") => {
    const newApps = [...apps];
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= newApps.length) return;
    [newApps[idx], newApps[target]] = [newApps[target], newApps[idx]];
    try {
      await api.application.reorder(newApps.map(a => a.id));
      await load();
    } catch (_) {}
  };

  const submitAll = async () => {
    if (apps.length === 0) { alert("请先添加志愿"); return; }
    setSubmitting(true);
    try {
      const res = await api.application.submit();
      setMsg(`✅ ${res.message}`);
      await load();
    } catch (e: any) {
      alert(e.message || "提交失败");
    } finally { setSubmitting(false); }
  };

  const withdrawAll = async () => {
    setWithdrawing(true);
    try {
      const res = await api.application.withdraw();
      setMsg(`↩️ ${res.message}`);
      await load();
    } catch (e: any) {
      alert(e.message || "撤销失败");
    } finally { setWithdrawing(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">🎯 志愿填报模拟</h1>

      {msg && (
        <GlassCard className="!p-4 mb-4 !bg-emerald-50 dark:!bg-emerald-900/20">
          <p className="text-emerald-700 dark:text-emerald-300 text-sm">{msg}</p>
        </GlassCard>
      )}

      {/* 操作栏 */}
      <div className="flex gap-3 mb-6">
        <Button variant="primary" onClick={openAdd}><Plus size={14} /> 添加志愿</Button>
        <Button variant="default" onClick={submitAll} disabled={submitting || apps.length === 0}>
          <Send size={14} /> {submitting ? "提交中..." : "提交志愿表"}
        </Button>
        <Button variant="default" onClick={withdrawAll} disabled={withdrawing || apps.length === 0}>
          ↩️ {withdrawing ? "撤销中..." : "撤销提交"}
        </Button>
      </div>

      {/* 志愿列表 */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-12">加载中...</p>
      ) : apps.length === 0 ? (
        <GlassCard className="!p-8 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-2">暂无志愿</p>
          <p className="text-xs text-slate-400">点击「添加志愿」开始填报</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((a, idx) => (
            <GlassCard key={a.id} className="!p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="primary">{a.priority}</Badge>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{a.university_name || `高校 #${a.university_id}`}</p>
                  <p className="text-xs text-slate-400">{a.major_name || "不限专业"}</p>
                </div>
                <Badge variant={a.status === "submitted" ? "success" : "default"}>
                  {a.status === "submitted" ? "已提交" : "草稿"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {a.status !== "submitted" && (
                  <>
                    <button className="glass-btn !p-1.5" onClick={() => moveApp(idx, "up")} disabled={idx === 0}>
                      <ArrowUp size={14} />
                    </button>
                    <button className="glass-btn !p-1.5" onClick={() => moveApp(idx, "down")} disabled={idx === apps.length - 1}>
                      <ArrowDown size={14} />
                    </button>
                    <button className="glass-btn !p-1.5 text-rose-500" onClick={() => removeApp(a.id)}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 添加志愿弹窗 */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="添加志愿">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">选择院校</label>
            <Select className="w-full" value={selUni} onChange={onUniChange} placeholder="-- 请选择 --" options={unis.map(u => ({value: String(u.id), label: u.name + "（" + (u.min_score || "—") + "分）"}))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">选择专业（可选）</label>
            <Select className="w-full" value={selMajor} onChange={setSelMajor} placeholder="-- 不限专业 --" options={majors.map(m => ({value: String(m.id), label: m.name}))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">志愿顺序</label>
            <input className="glass-input w-full" type="number" min={1} value={priority}
              onChange={e => setPriority(e.target.value)} />
          </div>
          <Button variant="primary" onClick={addApp}>确认添加</Button>
        </div>
      </Dialog>
    </div>
  );
}
