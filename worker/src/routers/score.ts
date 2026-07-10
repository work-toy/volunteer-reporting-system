import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/score/list', requireAuth, async (c) => {
  const year = c.req.query('year')
  let sql = 'SELECT id, score, "rank", year, created_at FROM score WHERE user_id = ?'
  const params: any[] = [c.var.auth.username]
  if (year) { sql += ' AND year = ?'; params.push(+year) }
  sql += ' ORDER BY year DESC'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

app.post('/api/score/add', requireAuth, async (c) => {
  const { score, rank, year } = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO score (user_id, score, "rank", year) VALUES (?, ?, ?, ?)'
  ).bind(c.var.auth.username, score, rank, year).run()
  return c.json({ message: '成绩录入成功' })
})

app.put('/api/score/:score_id', requireAuth, async (c) => {
  const { score, rank, year } = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE score SET score = ?, "rank" = ?, year = ? WHERE id = ? AND user_id = ?'
  ).bind(score, rank, year, +c.req.param('score_id'), c.var.auth.username).run()
  return c.json({ message: '成绩更新成功' })
})

app.delete('/api/score/:score_id', requireAuth, async (c) => {
  await c.env.DB.prepare(
    'DELETE FROM score WHERE id = ? AND user_id = ?'
  ).bind(+c.req.param('score_id'), c.var.auth.username).run()
  return c.json({ message: '成绩删除成功' })
})

export { app as scoreRouter }
