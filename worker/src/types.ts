export type Bindings = {
  DB: D1Database
}

export type AuthUser = {
  username: string
  role: 'user' | 'admin'
}
