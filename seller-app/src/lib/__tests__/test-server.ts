/**
 * test-server.ts — Helper para levantar servidores HTTP echo en tests de integración.
 *
 * Uso:
 *   const { server, port, requests, stop } = await createEchoServer()
 *   // ... test que hace fetch a http://localhost:${port}/api/....
 *   expect(requests[0]).toMatchObject({ method: 'PUT', url: '/api/...' })
 *   await stop()
 *
 * Cada request entrante se captura en el array `requests`.
 * El servidor responde 200 OK a todo.
 */

import http from 'http'

export type CapturedRequest = {
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
}

export async function createEchoServer(): Promise<{
  server: http.Server
  port: number
  requests: CapturedRequest[]
  stop: () => Promise<void>
}> {
  const requests: CapturedRequest[] = []

  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      requests.push({
        method: req.method ?? '',
        url: req.url ?? '',
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: body ? JSON.parse(body) : null,
      })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })
  })

  await new Promise<void>((resolve) => server.listen(0, resolve))

  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No se pudo obtener el puerto del servidor')

  const port = address.port

  const stop = () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })

  return { server, port, requests, stop }
}
