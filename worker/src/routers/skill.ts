import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAdmin } from '../middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/skill/list', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, title, content, publisher, created_at FROM skill ORDER BY created_at DESC'
  ).all()
  return c.json(results)
})

app.get('/api/skill/:skill_id', async (c) => {
  const row: any = await c.env.DB.prepare(
    'SELECT id, title, content, publisher, created_at FROM skill WHERE id = ?'
  ).bind(+c.req.param('skill_id')).first()
  if (!row) return c.json({ detail: '技巧不存在' }, 404)
  return c.json(row)
})

app.post('/api/skill/create', requireAdmin, async (c) => {
  const { title, content } = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO skill (title, content, publisher) VALUES (?, ?, ?)'
  ).bind(title, content, c.var.auth.username).run()
  return c.json({ message: '添加成功' })
})

app.put('/api/skill/:skill_id', requireAdmin, async (c) => {
  const { title, content } = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE skill SET title = ?, content = ?, publisher = ? WHERE id = ?'
  ).bind(title, content, c.var.auth.username, +c.req.param('skill_id')).run()
  return c.json({ message: '更新成功' })
})

app.delete('/api/skill/:skill_id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM skill WHERE id = ?').bind(+c.req.param('skill_id')).run()
  return c.json({ message: '删除成功' })
})

export { app as skillRouter }
