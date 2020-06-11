module.exports = {
  async up(client) {
    client
      .query(
        `create table if not exists users (
      name text primary key,
      date timestamptz not null default now()
    )`
      )
      .query(`INSERT INTO users (name) VALUES(:name)`, [
        [{ name: 'Marcia' }],
        [{ name: 'Peter' }],
        [{ name: 'Jan' }],
        [{ name: 'Cindy' }],
        [{ name: 'Bobby' }]
      ])
  },
  async down(client) {
    client.query(`drop table if exists users`)
  }
}
