import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAdmin } from '../middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/major/list', async (c) => {
  const university_id = c.req.query('university_id')
  const keyword = c.req.query('keyword')
  let sql = 'SELECT id, name, description, university_id, created_at FROM major WHERE 1=1'
  const params: any[] = []
  if (university_id) { sql += ' AND university_id = ?'; params.push(+university_id) }
  if (keyword) { sql += ' AND name LIKE ?'; params.push(`%${keyword}%`) }
  sql += ' ORDER BY id ASC'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

app.get('/api/major/:major_id', async (c) => {
  const row: any = await c.env.DB.prepare(
    'SELECT id, name, description, university_id, created_at FROM major WHERE id = ?'
  ).bind(+c.req.param('major_id')).first()
  if (!row) return c.json({ detail: '专业不存在' }, 404)
  return c.json(row)
})

app.post('/api/major/create', requireAdmin, async (c) => {
  const data = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO major (name, description, university_id, admin_id) VALUES (?, ?, ?, ?)'
  ).bind(data.name, data.description, data.university_id, c.var.auth.username).run()
  return c.json({ message: '添加成功' })
})

app.put('/api/major/:major_id', requireAdmin, async (c) => {
  const data = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE major SET name = ?, description = ?, university_id = ?, admin_id = ? WHERE id = ?'
  ).bind(data.name, data.description, data.university_id, c.var.auth.username, +c.req.param('major_id')).run()
  return c.json({ message: '更新成功' })
})

app.delete('/api/major/:major_id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM major WHERE id = ?').bind(+c.req.param('major_id')).run()
  return c.json({ message: '删除成功' })
})

export { app as majorRouter }
