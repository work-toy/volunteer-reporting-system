import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES } from '../config'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

function createToken(payload: Record<string, unknown>) {
  const exp = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRE_MINUTES * 60
  return sign({ ...payload, exp }, SECRET_KEY, 'HS256')
}

// 用户登录
app.post('/api/auth/user/login', async (c) => {
  const { user_id, password } = await c.req.json()
  const row: any = await c.env.DB.prepare(
    'SELECT user_id, password FROM users WHERE user_id = ?'
  ).bind(user_id).first()
  if (!row) return c.json({ detail: '账号不存在' }, 401)
  if (row.password !== password) return c.json({ detail: '密码错误' }, 401)
  const token = await createToken({ sub: user_id, role: 'user' })
  return c.json({ access_token: token, token_type: 'bearer', role: 'user', username: user_id })
})

// 用户注册
app.post('/api/auth/user/register', async (c) => {
  const { user_id, password } = await c.req.json()
  const exists: any = await c.env.DB.prepare(
    'SELECT user_id FROM users WHERE user_id = ?'
  ).bind(user_id).first()
  if (exists) return c.json({ detail: '账号已存在' }, 400)
  await c.env.DB.prepare(
    'INSERT INTO users (user_id, password) VALUES (?, ?)'
  ).bind(user_id, password).run()
  return c.json({ message: '注册成功', user_id })
})

// 管理员登录
app.post('/api/auth/admin/login', async (c) => {
  const { admin_id, password } = await c.req.json()
  const row: any = await c.env.DB.prepare(
    'SELECT admin_id, password FROM admin WHERE admin_id = ?'
  ).bind(admin_id).first()
  if (!row || row.password !== password) return c.json({ detail: '管理员账号或密码错误' }, 401)
  const token = await createToken({ sub: admin_id, role: 'admin' })
  return c.json({ access_token: token, token_type: 'bearer', role: 'admin', username: admin_id })
})

export { app as authRouter }
