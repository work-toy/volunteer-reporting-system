/**
 * 技巧管理页面 (SkillManagePage)
 *
 * 页面用途：
 *   提供高考填报技巧文章的增删改查（CRUD）功能。管理员可以：
 *   1. 查看所有已发布的技巧列表
 *   2. 发布新技巧（填写标题和内容）
 *   3. 编辑已有技巧
 *   4. 删除技巧（需二次确认）
 *
 * 数据模型（Skill）字段：
 *   id         - 唯一标识
 *   title      - 技巧标题
 *   content    - 技巧正文内容
 *   publisher  - 发布人（由服务端自动记录）
 *   created_at - 发布时间（由服务端自动记录）
 */

"use client";

import { useEffect, useState } from "react";
import Input, { TextArea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { api, type Skill } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function SkillManagePage() {
  // 技巧列表数据
  const [list, setList] = useState<Skill[]>([]);
  // 对话框是否打开
  const [dialog, setDialog] = useState(false);
  // 正在编辑的技巧ID（null 表示新增模式）
  const [editId, setEditId] = useState<number | null>(null);
  // 表单数据：只包含标题和内容，发布时间等由服务端处理
  const [form, setForm] = useState({ title: "", content: "" });

  /**
   * 打开添加/编辑对话框
   * @param s - 可选，传入已有技巧对象时为编辑模式，否则为发布模式
   */
  const open = (s?: Skill) => {
    setEditId(s?.id ?? null);
    setForm({
      title: s?.title ?? "",
      content: s?.content ?? ""
    });
    setDialog(true);
  };

  /**
   * 保存技巧数据（新增或更新）
   * 校验：标题和内容均为必填项
   */
  const save = async () => {
    if (!form.title || !form.content) return;
    try {
      if (editId) await api.skill.update(editId, form);
      else await api.skill.create(form);
      setDialog(false);
      // 保存成功后重新拉取技巧列表
      setList(await api.skill.list());
    } catch (e: any) { alert(e.message); }
  };

  /**
   * 删除技巧
   * 使用浏览器原生 confirm 弹窗进行二次确认
   */
  const del = async (id: number) => {
    if (!confirm("确认删除？")) return;
    try { await api.skill.delete(id); setList(await api.skill.list()); }
    catch (e: any) { alert(e.message); }
  };

  // 页面初始化时加载技巧列表
  useEffect(() => { api.skill.list().then(setList).catch(() => {}); }, []);

  return (
    <div>
      {/* 页面标题栏：标题 + 发布按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">💡 技巧管理</h1>
        <Button variant="primary" onClick={() => open()}><Plus size={14} /> 发布技巧</Button>
      </div>

      {/* 添加/编辑技巧对话框 */}
      <Dialog open={dialog} onClose={() => setDialog(false)} title={editId ? "编辑技巧" : "发布技巧"}>
        <div className="flex flex-col gap-3">
          {/* 标题输入框（必填） */}
          <Input label="标题" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          {/* 内容文本域（必填），用于填写技巧的具体内容 */}
          <TextArea label="内容" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          {/* 对话框底部操作按钮 */}
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setDialog(false)}>取消</Button>
            <Button variant="primary" onClick={save}>保存</Button>
          </div>
        </div>
      </Dialog>

      {/* 技巧列表渲染 */}
      {list.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50">
          <table className="w-full text-sm">
            {/* 表头：标题、发布人、发布时间、操作 */}
            <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">标题</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">发布人</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">发布时间</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500">操作</th>
            </tr></thead>
            {/* 表格数据行 */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {list.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{s.title}</td>
                  {/* 发布人：服务端返回的数据，可能为空 */}
                  <td className="px-4 py-2.5 text-slate-500">{s.publisher ?? "-"}</td>
                  {/* 发布时间：格式化为中文日期格式（YYYY/M/D） */}
                  <td className="px-4 py-2.5 text-slate-500">{s.created_at ? new Date(s.created_at).toLocaleDateString("zh-CN") : "-"}</td>
                  {/* 操作按钮：编辑和删除 */}
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => open(s)} className="glass-btn !p-1.5 rounded-lg mr-1"><Pencil size={13} /></button>
                    <button onClick={() => del(s.id)} className="glass-btn !p-1.5 rounded-lg hover:!text-rose-500"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-12 text-sm text-slate-400">暂无技巧数据</div>}
    </div>
  );
}
