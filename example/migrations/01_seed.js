module.exports = {
  async up(client) {
    return client.query(`INSERT INTO users (name) ('hobochild')`)
  },
  async down(client) {
    return this.client.query('DELETE FROM users WHERE name = hobochild;')
  }
}
