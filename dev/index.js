// cli module
const server = require('./server')
exports.command = 'dev'
exports.describe = 'run next.js dev server'

exports.handler = () => {
  return server()
}
