import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/message/list', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, user_id, content, created_at FROM message ORDER BY created_at DESC'
  ).all()
  return c.json(results)
})

app.post('/api/message/create', requireAuth, async (c) => {
  const { content } = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO message (user_id, content) VALUES (?, ?)'
  ).bind(c.var.auth.username, content).run()
  return c.json({ message: '留言成功' })
})

app.delete('/api/message/:msg_id', requireAuth, async (c) => {
  const msg_id = +c.req.param('msg_id')
  const row: any = await c.env.DB.prepare('SELECT user_id FROM message WHERE id = ?').bind(msg_id).first()
  if (!row) return c.json({ detail: '留言不存在' }, 404)
  if (row.user_id !== c.var.auth.username && c.var.auth.role !== 'admin') return c.json({ detail: '无权删除此留言' }, 403)
  await c.env.DB.prepare('DELETE FROM message WHERE id = ?').bind(msg_id).run()
  return c.json({ message: '删除成功' })
})

export { app as messageRouter }
