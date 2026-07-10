/**
 * 专业管理页面 (MajorManagePage)
 *
 * 页面用途：
 *   提供专业信息的增删改查（CRUD）功能。管理员可以：
 *   1. 查看所有专业列表（表格形式展示专业名称及所属高校）
 *   2. 添加新专业（选择所属高校 + 填写专业信息）
 *   3. 编辑已有专业信息
 *   4. 删除专业（需二次确认）
 *
 * 关键逻辑：
 *   - 需要同时加载高校列表，以便在表单中以下拉框形式选择所属高校
 *   - 专业与高校通过 university_id 字段关联
 *   - 列表显示高校名称时，通过 unis 数组查找对应的 university_id
 */

"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Input, { TextArea } from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { api, type Major, type Uni } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function MajorManagePage() {
  // 专业列表数据
  const [list, setList] = useState<Major[]>([]);
  // 高校列表数据（用于下拉选择框）
  const [unis, setUnis] = useState<Uni[]>([]);
  // 对话框是否打开
  const [dialog, setDialog] = useState(false);
  // 正在编辑的专业ID（null 表示新增模式）
  const [editId, setEditId] = useState<number | null>(null);
  // 表单数据：university_id 为字符串类型以支持 select 组件的 value
  const [form, setForm] = useState({ university_id: "" as any, name: "", description: "" });

  /**
   * 根据高校ID查询高校名称，用于在列表中显示
   * @param id - 高校ID（可能为 null 或 undefined）
   * @returns 高校名称，未找到则返回 "-"
   */
  const toUniName = (id: number | null | undefined) => unis.find(u => u.id === id)?.name ?? "-";

  /**
   * 打开添加/编辑对话框
   * @param m - 可选，传入已有专业对象时为编辑模式，否则为添加模式
   */
  const open = (m?: Major) => {
    setEditId(m?.id ?? null);
    setForm({
      university_id: m?.university_id ?? "",
      name: m?.name ?? "",
      description: m?.description ?? ""
    });
    setDialog(true);
  };

  /**
   * 保存专业数据（新增或更新）
   * 校验：专业名称为必填项
   * university_id 如果填写则转为数字类型
   */
  const save = async () => {
    if (!form.name) return;
    // 构造发送给 API 的数据对象
    const data = {
      name: form.name,
      description: form.description || undefined,
      university_id: form.university_id ? parseInt(form.university_id) : undefined
    };
    try {
      if (editId) await api.major.update(editId, data);
      else await api.major.create(data);
      setDialog(false);
      // 保存成功后重新拉取专业列表
      setList(await api.major.list());
    } catch (e: any) { alert(e.message); }
  };

  /**
   * 删除专业
   * 使用浏览器原生 confirm 弹窗进行二次确认
   */
  const del = async (id: number) => {
    if (!confirm("确认删除？")) return;
    try { await api.major.delete(id); setList(await api.major.list()); }
    catch (e: any) { alert(e.message); }
  };

  // 页面初始化时同时加载高校列表和专业列表
  useEffect(() => {
    api.uni.list().then(setUnis).catch(() => {});
    api.major.list().then(setList).catch(() => {});
  }, []);

  return (
    <div>
      {/* 页面标题栏：标题 + 添加按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">📚 专业管理</h1>
        <Button variant="primary" onClick={() => open()}><Plus size={14} /> 添加专业</Button>
      </div>

      {/* 添加/编辑专业对话框 */}
      <Dialog open={dialog} onClose={() => setDialog(false)} title={editId ? "编辑专业" : "添加专业"}>
        <div className="flex flex-col gap-3">
          {/* 所属高校下拉选择框（从已加载的高校列表中选取） */}
          <Select label="所属高校" value={form.university_id} onChange={v => setForm({ ...form, university_id: v })} placeholder="请选择高校" options={[{"value": "", "label": "请选择高校"}, ...unis.map(u => ({"value": String(u.id), "label": u.name}))]} />
          {/* 专业名称输入框（必填） */}
          <Input label="专业名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          {/* 专业简介文本域（可选） */}
          <TextArea label="专业简介" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          {/* 对话框底部操作按钮 */}
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setDialog(false)}>取消</Button>
            <Button variant="primary" onClick={save}>保存</Button>
          </div>
        </div>
      </Dialog>

      {/* 专业列表渲染 */}
      {list.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50">
          <table className="w-full text-sm">
            {/* 表头 */}
            <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">专业名称</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">所属高校</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500">操作</th>
            </tr></thead>
            {/* 表格数据行 */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {list.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{m.name}</td>
                  {/* 通过 toUniName 函数将 university_id 转换为高校名称 */}
                  <td className="px-4 py-2.5 text-slate-500">{toUniName(m.university_id)}</td>
                  {/* 操作按钮：编辑和删除 */}
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => open(m)} className="glass-btn !p-1.5 rounded-lg mr-1"><Pencil size={13} /></button>
                    <button onClick={() => del(m.id)} className="glass-btn !p-1.5 rounded-lg hover:!text-rose-500"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-12 text-sm text-slate-400">暂无专业数据</div>}
    </div>
  );
}
