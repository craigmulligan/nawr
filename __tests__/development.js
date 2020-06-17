const execa = require('execa')
const { getEnv } = require('../init')
const compose = require('docker-compose')
const version = require('../package.json').version
const path = require('path')
const { delEnv, TIMEOUT } = require('./utils')

module.exports = () => {
  beforeAll(() => {
    delEnv()
    jest.resetModules()
  })

  describe('init', () => {
    it(
      'spin up a local db',
      async () => {
        await execa('node', ['./bin/index.js', 'init'])
        const env = await getEnv('./.env')

        expect(JSON.parse(env.NAWR_SQL_CONNECTION)).toEqual({
          resourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:dummy',
          secretArn:
            'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy',
          database: 'master',
          stage: 'development',
          options: { endpoint: 'http://127.0.0.7:8080' },
          version: version
        })

        const { out } = await compose.ps({
          cwd: path.join(__dirname, '/../init/stage/docker'),
          config: `aurora-postgresql.yml`
        })

        // check containers are running
        expect(out).toContain('nawr-db')
        expect(out).toContain('nawr-proxy')
      },
      TIMEOUT
    )
  })

  describe('migrate', () => {
    it(
      'up/down works',
      async () => {
        // migrate up
        await execa('node', ['./bin/index.js', 'migrate', 'up'])

        require('dotenv').config()
        const client = require('../client')

        const { records } = await client.query(`select * from users;`)
        expect(records.length).toBe(5)

        // migrate down
        await execa('node', ['./bin/index.js', 'migrate', 'down'])

        try {
          await client.query(`select * from users;`)
        } catch (err) {
          expect(err.message).toContain(
            'ERROR: relation "users" does not exist'
          )
        }
      },
      TIMEOUT
    )
  })
}
