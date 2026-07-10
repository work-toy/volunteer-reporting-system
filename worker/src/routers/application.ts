import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware'

const app = new Hono<{ Bindings: Bindings }>()

// 志愿列表
app.get('/api/application/list', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.user_id, a.university_id, a.major_id, a.priority, a.status,
            a.created_at, a.updated_at, u.name AS university_name, m.name AS major_name
     FROM application a
     LEFT JOIN university u ON a.university_id = u.id
     LEFT JOIN major m ON a.major_id = m.id
     WHERE a.user_id = ? ORDER BY a.priority ASC`
  ).bind(c.var.auth.username).all()
  return c.json(results)
})

// 添加志愿
app.post('/api/application/add', requireAuth, async (c) => {
  const { university_id, major_id, priority } = await c.req.json()
  const info = await c.env.DB.prepare(
    'INSERT INTO application (user_id, university_id, major_id, priority) VALUES (?, ?, ?, ?)'
  ).bind(c.var.auth.username, university_id, major_id || null, priority).run()
  return c.json({ message: '添加成功', id: info.meta.last_row_id })
})

// 更新志愿
app.put('/api/application/:app_id', requireAuth, async (c) => {
  const app_id = +c.req.param('app_id')
  const data = await c.req.json()
  const sets: string[] = []; const params: any[] = []
  if (data.major_id !== undefined) { sets.push('major_id = ?'); params.push(data.major_id) }
  if (data.priority !== undefined) { sets.push('priority = ?'); params.push(data.priority) }
  if (sets.length === 0) return c.json({ detail: '没有需要更新的字段' }, 400)
  params.push(c.var.auth.username, app_id)
  await c.env.DB.prepare(`UPDATE application SET ${sets.join(', ')} WHERE user_id = ? AND id = ?`).bind(...params).run()
  return c.json({ message: '更新成功' })
})

// 删除志愿
app.delete('/api/application/:app_id', requireAuth, async (c) => {
  await c.env.DB.prepare('DELETE FROM application WHERE id = ? AND user_id = ?')
    .bind(+c.req.param('app_id'), c.var.auth.username).run()
  return c.json({ message: '删除成功' })
})

// 重排志愿顺序
app.post('/api/application/reorder', requireAuth, async (c) => {
  const { ids } = await c.req.json() as { ids: number[] }
  const stmts = ids.map((id, idx) =>
    c.env.DB.prepare('UPDATE application SET priority = ? WHERE id = ? AND user_id = ?')
      .bind(idx + 1, id, c.var.auth.username)
  )
  await c.env.DB.batch(stmts)
  return c.json({ message: '排序更新成功' })
})

// 提交志愿
app.post('/api/application/submit', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id FROM application a
     WHERE a.user_id = ? AND a.status = 'draft'`
  ).bind(c.var.auth.username).all()
  if (results.length === 0) return c.json({ detail: '没有草稿志愿可提交' }, 400)
  await c.env.DB.prepare(
    "UPDATE application SET status = 'submitted' WHERE user_id = ? AND status = 'draft'"
  ).bind(c.var.auth.username).run()
  return c.json({ message: `已提交 ${results.length} 个志愿` })
})

// 前端: POST /api/application/withdraw — 撤回所有已提交的志愿
app.post('/api/application/withdraw', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id FROM application a
     WHERE a.user_id = ? AND a.status = 'submitted'`
  ).bind(c.var.auth.username).all()
  if (results.length === 0) return c.json({ detail: '没有已提交的志愿可撤回' }, 400)
  await c.env.DB.prepare(
    "UPDATE application SET status = 'draft' WHERE user_id = ? AND status = 'submitted'"
  ).bind(c.var.auth.username).run()
  return c.json({ message: `已撤回 ${results.length} 个志愿` })
})

// 前端: GET /api/application/check-risk
app.get('/api/application/check-risk', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.university_id, a.major_id, a.priority,
            u.name AS university_name, u.min_score,
            COALESCE((SELECT MAX(score) FROM score WHERE user_id = ?), 0) AS user_score
     FROM application a
     LEFT JOIN university u ON a.university_id = u.id
     WHERE a.user_id = ? AND a.status = 'draft' ORDER BY a.priority`
  ).bind(c.var.auth.username, c.var.auth.username).all()

  return c.json(calcRisk(results as any[], c.var.auth.username))
})

// 内部: GET /api/application/risk-warning
app.get('/api/application/risk-warning', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.university_id, a.major_id, a.priority,
            u.name AS university_name, u.min_score,
            COALESCE((SELECT MAX(score) FROM score WHERE user_id = ?), 0) AS user_score
     FROM application a
     LEFT JOIN university u ON a.university_id = u.id
     WHERE a.user_id = ? AND a.status = 'draft' ORDER BY a.priority`
  ).bind(c.var.auth.username, c.var.auth.username).all()

  return c.json(calcRisk(results as any[], c.var.auth.username))
})

function calcRisk(rows: any[], username: string) {
  if (rows.length === 0) {
    return { total: 0, reach: 0, stable: 0, safe: 0, has_duplicate: false, has_reverse: false, warnings: [], suggestion: '暂无志愿数据' }
  }

  const userScore = rows[0].user_score
  let hasDuplicate = false, hasReverse = false
  const seenPriorities = new Set<number>()
  let prevMinScore = Infinity

  for (const r of rows) {
    if (seenPriorities.has(r.priority)) hasDuplicate = true
    seenPriorities.add(r.priority)
    if ((r.min_score || 0) > prevMinScore) hasReverse = true
    prevMinScore = r.min_score || 0
  }

  const reach = rows.filter((r: any) => userScore < (r.min_score || 0)).length
  const stable = rows.filter((r: any) => { const d = userScore - (r.min_score || 0); return d >= 0 && d < 30 }).length
  const safe = rows.filter((r: any) => userScore - (r.min_score || 0) >= 30).length

  const warnings: string[] = []
  if (hasDuplicate) warnings.push('存在重复的志愿顺序号')
  if (hasReverse) warnings.push('存在倒挂：录取分低的院校排在了录取分高的院校之后')

  let suggestion: string
  if (reach === rows.length) suggestion = '建议补充保底院校，降低滑档风险'
  else if (safe === 0) suggestion = '建议增加保底院校'
  else suggestion = '志愿梯度合理'

  return { total: rows.length, reach, stable, safe, has_duplicate: hasDuplicate, has_reverse: hasReverse, warnings, suggestion }
}

export { app as applicationRouter }
