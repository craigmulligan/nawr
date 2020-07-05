// cli module
const server = require('./server')
const init = require('../init')
const { up } = require('../migrate')
const dotenv = require('dotenv')

exports.command = 'dev'
exports.describe = 'run next.js dev server'
exports.builder = init.builder

exports.handler = async argv => {
  const dir = process.cwd()
  // init db
  await init.handler(argv)
  // migrate
  dotenv.config()
  await up()
  // run server
  return server({ ...argv, sourceDir: dir })
}
