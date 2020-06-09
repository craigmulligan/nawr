require('dotenv').config()
const Storage = require('./storage')
const Umzug = require('umzug')
const { api } = require('./api')

const middleware = argv => {
  // because the client relies on `process.env.NAWR_SQL_CONNECTION`
  // you have to lazy load it so that users can run nawr init first (which populates ^)
  const client = require('../client')
  // init a transaction
  const transaction = client.transaction()

  const migrator = new Umzug({
    storage: new Storage({ client, transaction }),
    migrations: {
      params: [transaction],
      path: process.cwd() + '/migrations'
    },
    logging: false
  })

  return { migrator, transaction }
}

// cli module
exports.command = 'migrate <command>'
exports.describe = 'run migration tasks'
exports.builder = yargs => {
  // register subcomands
  for (key in api) {
    yargs.command(api[key])
  }

  yargs.middleware(middleware)
}
exports.middleware = middleware
