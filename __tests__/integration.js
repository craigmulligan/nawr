const execa = require('execa')
const { getEnv } = require('../init')
const compose = require('docker-compose')
const version = require('../package.json').version
const path = require('path')
const aws = require('aws-sdk')
const { applyAuth } = require('../utils')
const fs = require('fs')

const TIMEOUT = 600000

beforeEach(() => {
  try {
    fs.unlinkSync('./.env')
  } catch (err) {}
})

describe('migrate', () => {
  describe('local', () => {
    it(
      'up/down works',
      async () => {
        // set up db
        await execa('node', ['./bin/index.js', 'init', '--local'])

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
})

describe('init', () => {
  describe('local', () => {
    it(
      'should work without any .env',
      async () => {
        await execa('node', ['./bin/index.js', 'init', '--local'])

        const env = await getEnv('./.env')
        expect(JSON.parse(env.NAWR_SQL_CONNECTION)).toEqual({
          resourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:dummy',
          secretArn:
            'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy',
          database: 'master',
          isLocal: true,
          options: { endpoint: 'http://127.0.0.7:8080' },
          version: version
        })

        const { out } = await compose.ps({
          cwd: path.join(__dirname, '/../init'),
          config: `aurora-postgresql.yml`
        })

        // check containers are running
        expect(out).toContain('nawr-db')
        expect(out).toContain('nawr-proxy')
      },
      TIMEOUT
    )
  })

  describe('remote', () => {
    it(
      'Should create an aws db',
      async () => {
        // 10 minute timeout to ensure waitOnAvailable completes.
        await execa('node', ['./bin/index.js', 'init'])

        // check env
        const env = await getEnv('./.env')
        const connectionValues = JSON.parse(env.NAWR_SQL_CONNECTION)
        expect(connectionValues.isLocal).toBeFalsy()
        expect(connectionValues.version).toBe(version)

        // check aws it was created correctly
        require('dotenv').config()
        applyAuth()
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
      },
      TIMEOUT
    )
  })
})
