/**
 * 高校管理页面 (UniManagePage)
 *
 * 页面用途：
 *   提供高校信息的增删改查（CRUD）功能。管理员可以：
 *   1. 查看所有高校列表（以表格形式展示排名、名称、省份、最低分等信息）
 *   2. 添加新高校（通过对话框表单填写高校信息）
 *   3. 编辑已有高校信息
 *   4. 删除高校（需二次确认）
 *
 * 数据模型（Uni）字段：
 *   id          - 唯一标识
 *   name        - 高校名称
 *   ranking     - 排名（可选）
 *   province    - 所在省份（可选）
 *   min_score   - 历史最低录取分（可选）
 *   description - 简介（可选）
 */

"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import Input, { TextArea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { api, type Uni } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function UniManagePage() {
  // 高校列表数据
  const [list, setList] = useState<Uni[]>([]);
  // 对话框是否打开
  const [dialog, setDialog] = useState(false);
  // 正在编辑的高校ID（null 表示新增模式）
  const [editId, setEditId] = useState<number | null>(null);
  // 表单数据：使用 any 类型处理可选数字字段的空字符串状态
  const [form, setForm] = useState({ name: "", ranking: "" as any, province: "", min_score: "" as any, description: "" });

  /**
   * 打开添加/编辑对话框
   * @param u - 可选，传入已有高校对象时为编辑模式，否则为添加模式
   */
  const open = (u?: Uni) => {
    setEditId(u?.id ?? null);
    setForm({
      name: u?.name ?? "",
      ranking: u?.ranking ?? "",
      province: u?.province ?? "",
      min_score: u?.min_score ?? "",
      description: u?.description ?? ""
    });
    setDialog(true);
  };

  /**
   * 保存高校数据（新增或更新）
   * 校验：高校名称为必填项
   * 排名和最低分如果填写则转为数字类型，未填写则传 undefined
   */
  const save = async () => {
    if (!form.name) return;
    // 构造发送给 API 的数据对象，将空字符串转为 undefined
    const data = {
      name: form.name,
      ranking: form.ranking ? parseInt(form.ranking) : undefined,
      province: form.province || undefined,
      min_score: form.min_score ? parseInt(form.min_score) : undefined,
      description: form.description || undefined
    };
    try {
      if (editId) await api.uni.update(editId, data);
      else await api.uni.create(data);
      setDialog(false);
      // 保存成功后重新拉取列表，确保数据是最新的
      setList(await api.uni.list());
    } catch (e: any) { alert(e.message); }
  };

  /**
   * 删除高校
   * 使用浏览器原生 confirm 弹窗进行二次确认，防止误操作
   */
  const del = async (id: number) => {
    if (!confirm("确认删除？")) return;
    try { await api.uni.delete(id); setList(await api.uni.list()); }
    catch (e: any) { alert(e.message); }
  };

  // 页面初始化时加载高校列表
  useEffect(() => { api.uni.list().then(setList).catch(() => {}); }, []);

  return (
    <div>
      {/* 页面标题栏：标题 + 添加按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">🏛 高校管理</h1>
        <Button variant="primary" onClick={() => open()}><Plus size={14} /> 添加高校</Button>
      </div>

      {/* 添加/编辑高校对话框 */}
      <Dialog open={dialog} onClose={() => setDialog(false)} title={editId ? "编辑高校" : "添加高校"}>
        <div className="flex flex-col gap-3">
          {/* 高校名称输入框（必填） */}
          <Input label="高校名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          {/* 排名输入（数字类型，可选） */}
          <Input label="排名" type="number" value={form.ranking} onChange={e => setForm({ ...form, ranking: e.target.value })} />
          {/* 所在省份输入（可选） */}
          <Input label="所在省份" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
          {/* 历史最低录取分输入（数字类型，可选） */}
          <Input label="历史最低录取分" type="number" value={form.min_score} onChange={e => setForm({ ...form, min_score: e.target.value })} />
          {/* 简介文本域（可选） */}
          <TextArea label="简介" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          {/* 对话框底部操作按钮 */}
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setDialog(false)}>取消</Button>
            <Button variant="primary" onClick={save}>保存</Button>
          </div>
        </div>
      </Dialog>

      {/* 高校列表渲染 */}
      {list.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50">
          <table className="w-full text-sm">
            {/* 表头 */}
            <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">排名</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">高校名称</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">省份</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500">最低分</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500">操作</th>
            </tr></thead>
            {/* 表格数据行 */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {list.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  {/* 排名使用 Badge 组件显示 */}
                  <td className="px-4 py-2.5"><Badge variant="primary">{u.ranking ?? "-"}</Badge></td>
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{u.province ?? "-"}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{u.min_score ?? "-"}</td>
                  {/* 操作按钮：编辑（铅笔图标）和删除（垃圾桶图标） */}
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => open(u)} className="glass-btn !p-1.5 rounded-lg mr-1"><Pencil size={13} /></button>
                    <button onClick={() => del(u.id)} className="glass-btn !p-1.5 rounded-lg hover:!text-rose-500"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // 列表为空时的占位提示
        <div className="text-center py-12 text-sm text-slate-400">暂无高校数据</div>
      )}
    </div>
  );
}
