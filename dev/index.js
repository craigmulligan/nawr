// cli module
const server = require('./server')
const init = require('../init')
const { up } = require('../migrate')

exports.command = 'dev'
exports.describe = 'run next.js dev server'
exports.builder = init.builder

exports.handler = async argv => {
  // init db
  await init.handler(argv)
  // migrate
  await up()
  // run server
  return server(argv)
}
