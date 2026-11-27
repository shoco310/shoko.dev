import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { writePages } from './scripts/pageHtml'

/**
 * Dev only: serve the Vercel Functions in api/ from the Vite dev server so
 * `npm run dev` works without the Vercel CLI. Each api/<name>.ts module's
 * exported POST/GET handler receives a Web Request, exactly as on Vercel.
 */
function devApi(): Plugin {
  return {
    name: 'dev-vercel-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/([a-z0-9-]+)(?:\?.*)?$/)
        if (!match) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers.set(k, v)
          }
          headers.set('x-forwarded-for', req.socket.remoteAddress ?? '127.0.0.1')
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          })
          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          server.config.logger.error(`[dev-api] ${(e as Error).message}`)
          res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

/** Build only: per-page HTML (title, description, OGP), sitemap.xml, robots.txt. */
function pageFiles(): Plugin {
  return {
    name: 'page-files',
    apply: 'build',
    writeBundle(options) {
      const on = (key: string) => process.env[key] === 'true'
      writePages(options.dir ?? resolve(__dirname, 'dist'), {
        voice: on('VITE_VOICE_ENABLED'),
        volunteer: on('VITE_VOLUNTEER_ENABLED'),
        issues: on('VITE_ISSUES_ENABLED'),
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose server-only variables (no VITE_ prefix) to the dev API handlers.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), devApi(), pageFiles()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        },
      },
    },
  }
})
