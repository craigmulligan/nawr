const { once } = require('lodash')

const createMigrationTable = once(async transaction => {
  return transaction.query(`
      create table if not exists migration (
        name text primary key,
        date timestamptz not null default now()
      )
    `)
})

class Storage {
  constructor({ transaction, client }) {
    this.transaction = transaction
    this.client = client
  }
  async logMigration(name) {
    try {
      await createMigrationTable(this.client)
      return this.transaction.query(
        'INSERT INTO migration (name) VALUES(:name);',
        {
          name
        }
      )
    } catch (err) {
      throw err
    }
  }
  async unlogMigration(name) {
    return this.transaction.query('DELETE FROM migration WHERE name = :name;', {
      name
    })
  }
  async executed() {
    await createMigrationTable(this.client)
    return this.client
      .query(`select name from migration order by date;`)
      .then(({ records }) => {
        return records.map(record => record.name)
      })
  }
}

module.exports = Storage
