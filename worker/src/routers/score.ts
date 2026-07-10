import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware'

const app = new Hono<{ Bindings: Bindings }>()

async function listScores(db: D1Database, username: string, year?: string) {
  let sql = 'SELECT id, score, "rank", year, created_at FROM score WHERE user_id = ?'
  const params: any[] = [username]
  if (year) { sql += ' AND year = ?'; params.push(+year) }
  sql += ' ORDER BY year DESC'
  return (await db.prepare(sql).bind(...params).all()).results
}

// 前端: GET /api/score/history
app.get('/api/score/history', requireAuth, async (c) => {
  const results = await listScores(c.env.DB, c.var.auth.username, c.req.query('year'))
  return c.json(results)
})

// 前端: GET /api/score/latest
app.get('/api/score/latest', requireAuth, async (c) => {
  const row: any = await c.env.DB.prepare(
    'SELECT id, score, "rank", year, created_at FROM score WHERE user_id = ? ORDER BY year DESC LIMIT 1'
  ).bind(c.var.auth.username).first()
  if (!row) return c.json({ detail: '暂无成绩数据' }, 404)
  return c.json({ id: row.id, score: row.score, rank: row.rank, year: row.year, created_at: row.created_at })
})

// 前端: POST /api/score/entry  (与 /api/score/add 相同)
app.post('/api/score/entry', requireAuth, async (c) => {
  const { score, rank, year } = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO score (user_id, score, "rank", year) VALUES (?, ?, ?, ?)'
  ).bind(c.var.auth.username, score, rank || null, year).run()
  return c.json({ message: '成绩录入成功' })
})

// 内部: GET /api/score/list
app.get('/api/score/list', requireAuth, async (c) => {
  const results = await listScores(c.env.DB, c.var.auth.username, c.req.query('year'))
  return c.json(results)
})

// 内部: POST /api/score/add
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
