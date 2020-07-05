// cli module
const init = require('../init')
const { up } = require('../migrate')
const resolveCwd = require('resolve-cwd')
const dotenv = require('dotenv')
const build = require(resolveCwd('next/dist/build')).default
const { resolve } = require('path')

exports.command = 'build'
exports.describe = 'Creates a db runs migrations and builds server'
exports.builder = init.builder

exports.handler = async argv => {
  const dir = resolve(argv._[1] || '.')
  // init db
  await init.handler(argv)
  // load env + migrate
  dotenv.config()
  await up()
  // next build
  await build(dir)
}
