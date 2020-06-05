require('dotenv').config()
const Storage = require('./storage')
const Umzug = require('umzug')
const ora = require('ora')
const spinner = ora()
const { api } = require('./cli')

const middleware = argv => {
  // because the client relies on `process.env.NAWR_SQL_CONNECTION`
  // you have to lazy load it so that users can run nawr init first (which populates ^)
  const client = require('../client')
  const migrator = new Umzug({
    storage: new Storage(client),
    migrations: {
      params: [client],
      path: process.cwd() + '/migrations'
    },
    logging: message => {
      if (spinner.isSpinning) {
        spinner.stopAndPersist({ text: message, symbol: '✔' })
      } else {
        spinner.start(message)
      }
    }
  })

  return { migrator }
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
