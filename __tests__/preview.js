const execa = require('execa')
const { getEnv } = require('../init')
const version = require('../package.json').version
const aws = require('aws-sdk')
const stages = require('../init/stage')
const { delEnv, TIMEOUT } = require('./utils')

module.exports = () => {
  beforeAll(() => {
    delEnv()
    jest.resetModules()
  })

  describe('init', () => {
    it(
      'should create an aws db',
      async () => {
        // 10 minute timeout to ensure waitOnAvailable completes.
        await execa('node', [
          './bin/index.js',
          'init',
          '--stage',
          'preview',
          '--id',
          'nawr-test'
        ])

        // check env
        const env = await getEnv('./.env')
        const connectionValues = JSON.parse(env.NAWR_SQL_CONNECTION)
        expect(connectionValues.stage).toBe('preview')
        expect(connectionValues.version).toBe(version)

        // check aws it was created correctly
        require('dotenv').config()
        stages.preview.setCredentials()

        const rds = new aws.RDS()

        const { DBClusters } = await rds
          .describeDBClusters({
            DBClusterIdentifier: connectionValues.resourceArn
          })
          .promise()

        const [db] = DBClusters

        expect(db.Status).toBe('available')
        expect(db.Engine).toBe('aurora-postgresql')
        expect(db.EngineMode).toBe('serverless')
        expect(db.DeletionProtection).toBe(false)
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
