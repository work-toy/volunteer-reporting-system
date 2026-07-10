import { verify } from 'hono/jwt'
import { SECRET_KEY } from './config'
import type { AuthUser } from './types'

/** 要求登录 — 从 Authorization header 解析 JWT 并注入 c.var.auth */
export const requireAuth = async (c: any, next: any) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    c.status(401)
    return c.json({ detail: '未登录或Token无效' })
  }
  try {
    const payload = await verify(header.slice(7), SECRET_KEY, 'HS256') as any
    c.set('auth', { username: payload.sub || '', role: payload.role || 'user' } satisfies AuthUser)
    await next()
  } catch {
    c.status(401)
    return c.json({ detail: 'Token已过期或无效' })
  }
}

/** 要求管理员 */
export const requireAdmin = async (c: any, next: any) => {
  await requireAuth(c, next)
  if (c.res.status >= 400) return
  if (c.var.auth?.role !== 'admin') {
    c.status(403)
    return c.json({ detail: '需要管理员权限' })
  }
}
