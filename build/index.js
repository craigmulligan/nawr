// cli module
const init = require('../init')
const { up } = require('../migrate')
const resolveCwd = require('resolve-cwd')
const build = require(resolveCwd('next/dist/build')).default
const { resolve } = require('path')
const compile = require('./webpack')

exports.command = 'build'
exports.describe = 'Creates a db runs migrations and builds server'
exports.builder = init.builder

exports.handler = async argv => {
  const dir = resolve(argv._[1] || '.')
  // compile workers
  await compile(dir, 'workers')
  // init db
  await init.handler(argv)
  // migrate
  await up()
  // next build
  await build(dir)
}