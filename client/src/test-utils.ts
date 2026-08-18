export function criarTokenFake(payload: {
  sub?: number
  email?: string
  roles?: string[]
  exp?: number
}): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(
    JSON.stringify({
      sub: payload.sub ?? 1,
      email: payload.email ?? 'test@test.com',
      roles: payload.roles ?? ['CLIENT'],
      exp: payload.exp ?? Math.floor(Date.now() / 1000) + 3600,
    }),
  )
  return `${header}.${body}.fakesignature`
}
