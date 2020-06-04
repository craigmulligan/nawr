const { once } = require('lodash')

const createMigrationTable = once(async client => {
  return client.query(`
      create table if not exists migration (
        name text primary key,
        date timestamptz not null default now()
      )
    `)
})

class Storage {
  constructor(client) {
    this.client = client
  }
  async logMigration(name) {
    try {
      await createMigrationTable(this.client)
      return this.client.query('INSERT INTO migration (name) VALUES(:name);', {
        name
      })
    } catch (err) {
      throw err
    }
  }
  async unlogMigration(name) {
    return this.client.query('DELETE FROM migration WHERE name = :name;', {
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
