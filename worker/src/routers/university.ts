import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth, requireAdmin } from '../middleware'

const app = new Hono<{ Bindings: Bindings }>()

// 高校列表
app.get('/api/university/list', async (c) => {
  const province = c.req.query('province')
  const keyword = c.req.query('keyword')
  let sql = 'SELECT id, name, ranking, description, min_score, province, created_at FROM university WHERE 1=1'
  const params: any[] = []
  if (province) { sql += ' AND province = ?'; params.push(province) }
  if (keyword) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY ranking ASC'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

// 高校详情
app.get('/api/university/:uni_id', async (c) => {
  const uni_id = +c.req.param('uni_id')
  const row: any = await c.env.DB.prepare(
    'SELECT id, name, ranking, description, min_score, province, created_at FROM university WHERE id = ?'
  ).bind(uni_id).first()
  if (!row) return c.json({ detail: '高校不存在' }, 404)
  return c.json(row)
})

// 创建高校（管理员）
app.post('/api/university/create', requireAdmin, async (c) => {
  const data = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO university (name, ranking, description, min_score, province, admin_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(data.name, data.ranking, data.description, data.min_score, data.province, c.var.auth.username).run()
  return c.json({ message: '添加成功' })
})

// 更新高校（管理员）
app.put('/api/university/:uni_id', requireAdmin, async (c) => {
  const uni_id = +c.req.param('uni_id')
  const data = await c.req.json()
  const sets: string[] = []; const params: any[] = []
  if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name) }
  if (data.ranking !== undefined) { sets.push('ranking = ?'); params.push(data.ranking) }
  if (data.description !== undefined) { sets.push('description = ?'); params.push(data.description) }
  if (data.min_score !== undefined) { sets.push('min_score = ?'); params.push(data.min_score) }
  if (data.province !== undefined) { sets.push('province = ?'); params.push(data.province) }
  if (sets.length === 0) return c.json({ detail: '没有需要更新的字段' }, 400)
  sets.push('admin_id = ?'); params.push(c.var.auth.username)
  params.push(uni_id)
  await c.env.DB.prepare(`UPDATE university SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run()
  return c.json({ message: '更新成功' })
})

// 删除高校（管理员）
app.delete('/api/university/:uni_id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM university WHERE id = ?').bind(+c.req.param('uni_id')).run()
  return c.json({ message: '删除成功' })
})

// 估分推荐
app.post('/api/university/recommend', async (c) => {
  const { score } = await c.req.json()
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, ranking, description, min_score, province FROM university WHERE min_score IS NOT NULL ORDER BY min_score'
  ).all()
  const list = (results as any[]).map((r: any) => {
    const diff = score - (r.min_score || 0)
    return { ...r, match_degree: diff >= 30 ? '保底' : diff >= 0 ? '稳妥' : '冲刺' }
  })
  return c.json(list)
})

// 省份列表
app.get('/api/university/provinces/list', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT DISTINCT province FROM university WHERE province IS NOT NULL ORDER BY province'
  ).all()
  return c.json({ provinces: results.map((r: any) => r.province) })
})

// 历年录取数据
app.get('/api/university/:uni_id/admission', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, university_id, year, min_score, min_rank, avg_score, enrollment_num, batch FROM admission_data WHERE university_id = ? ORDER BY year DESC'
  ).bind(+c.req.param('uni_id')).all()
  return c.json(results)
})

export { app as universityRouter }
