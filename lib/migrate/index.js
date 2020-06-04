require('dotenv').config()
const Storage = require('./storage')
const cli = require('./cli')
const Umzug = require('umzug')

module.exports = argv => {
  // because the client relies on `process.env.DOLOS_SQL_CONNECTION`
  // you have to lazy load it so that users can run dolos init first (which populates ^)
  const client = require('../client')
  const migrator = new Umzug({
    storage: new Storage(client),
    migrations: {
      params: [client],
      path: process.cwd() + '/migrations'
    }
  })

  return cli(migrator, argv)
}
