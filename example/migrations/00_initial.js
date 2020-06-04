module.exports = {
  async up(client) {
    return client.query(`create table if not exists users (
      name text primary key,
      date timestamptz not null default now()
    )`)
  },
  async down(client) {
    return client.query(`drop table if exists users`)
  }
}
