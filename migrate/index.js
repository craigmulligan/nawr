require('dotenv').config()
const Storage = require('./storage')
const Umzug = require('umzug')
const compile = require('../build/webpack')
const { api } = require('./api')

const middleware = async argv => {
  // because the client relies on `process.env.NAWR_SQL_CONNECTION`
  // you have to lazy load it so that users can run nawr init first (which populates ^)
  if (!argv) {
    argv = {}
  }
  const sourceDir = process.cwd()

  await compile(sourceDir, 'migrations')
  const client = require('../client')

  // init a transaction
  const transaction = client.transaction()

  const migrator = new Umzug({
    storage: new Storage({ client, transaction }),
    migrations: {
      params: [transaction],
      path: sourceDir + '/.nawr/migrations'
    },
    logging: false
  })

  argv.migrator = migrator
  argv.transaction = transaction

  return argv
}

// cli module
exports.command = 'migrate <command>'
exports.describe = 'run migration tasks'
exports.builder = yargs => {
  // register subcomands
  for (let key in api) {
    yargs.command(api[key])
  }

  yargs.middleware(middleware)
}
exports.middleware = middleware

// Exported for programatic usage
// Useful when using with unit tests
module.exports.up = async args => {
  const argv = await middleware(args)
  return api.up.handler(argv)
}

// Exported for programatic usage
// Useful when using with unit tests
module.exports.down = async args => {
  const argv = await middleware(args)
  return api.down.handler(argv)
}
