import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRouter } from './routers/auth'
import { universityRouter } from './routers/university'
import { majorRouter } from './routers/major'
import { skillRouter } from './routers/skill'
import { messageRouter } from './routers/message'
import { scoreRouter } from './routers/score'
import { applicationRouter } from './routers/application'
import type { Bindings, AuthUser } from './types'

const app = new Hono<{ Bindings: Bindings; Variables: { auth: AuthUser } }>()

app.use('*', cors())

app.get('/', (c) => c.json({ message: '欢迎使用高考志愿辅助填报系统 API', docs: '/docs' }))
app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.route('/', authRouter)
app.route('/', universityRouter)
app.route('/', majorRouter)
app.route('/', skillRouter)
app.route('/', messageRouter)
app.route('/', scoreRouter)
app.route('/', applicationRouter)

export default app
