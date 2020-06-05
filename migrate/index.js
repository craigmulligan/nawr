require('dotenv').config()
const Storage = require('./storage')
const cli = require('./cli')
const Umzug = require('umzug')
const ora = require('ora')
const spinner = ora()

const migrate = argv => {
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

  return cli(migrator, argv)
}

migrate.help = cli.help
module.exports = migrate
