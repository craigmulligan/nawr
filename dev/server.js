// server.js
const { createServer } = require('http')
const { parse } = require('url')
const resolveCwd = require('resolve-cwd')
const next = require(resolveCwd('next'))
const worker = require('./worker')

const dev = process.env.NODE_ENV !== 'production'
const sourceDir = process.cwd()

module.exports = () => {
  const app = next({ dev, dir: sourceDir })
  const handle = app.getRequestHandler()

  return app.prepare().then(() => {
    createServer((req, res) => {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl
      if (pathname === '/__nawr__/workers' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        req.on('end', async () => {
          const evt = JSON.parse(body)
          try {
            await worker(query.name, evt).then(console.log)
          } catch (err) {
            res.writeHead(500, {
              'Content-Type': 'application/json',
              'X-Powered-By': 'nawr + next.js'
            })
            res.write(JSON.stringify({ error: err.message }))
            return res.end()
          }

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Powered-By': 'nawr + next.js'
          })

          res.write(JSON.stringify({ message: 'OK' }))
          return res.end()
        })
      } else {
        return handle(req, res, parsedUrl)
      }
    }).listen(3000, err => {
      if (err) throw err
      console.log('> Ready on http://localhost:3000')
    })
  })
}
