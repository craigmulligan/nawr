const AWS = require('aws-sdk')
const { applyAuth } = require('../utils')
const nanoid = require('./id')

module.exports = () => {
  // ensures envars are loaded into aws-sdk
  applyAuth()
  const rds = new AWS.RDS()
  const secretsmanager = new AWS.SecretsManager()

  async function getDBByName(name) {
    const { DBClusters } = await rds.describeDBClusters({
      Filters: [
        {
          Name: 'db-cluster-id' /* required */,
          Values: [
            /* required */
            name
            /* more items */
          ]
        }
      ]
    })

    const [db] = DBClusters
    if (!db) {
      throw new Error('Database does not exist')
    }
    return db
  }

  async function getDBStatus(dbArn) {
    const { DBClusters } = await rds
      .describeDBClusters({
        DBClusterIdentifier: dbArn
      })
      .promise()

    const [db] = DBClusters
    if (!db) {
      throw new Error('Database does not exist')
    }
    return db.Status
  }

  async function sleep(timeout) {
    return new Promise(res => {
      setTimeout(() => {
        res()
      }, timeout)
    })
  }

  async function waitOnAvailable({ resourceArn }) {
    let status = null

    while (status !== 'available') {
      status = await getDBStatus(resourceArn)
      await sleep(5000)
    }

    return status
  }

  // Creates a serverless postgres db + sercret for acess via the data-api
  async function createDB(identifier, { opts }) {
    // ensures the aws-sdk has the correct keys loaded

    const username = 'master'
    const dbName = 'master'
    const password = nanoid()

    let db
    let secret

    try {
      // TODO add tags
      db = await rds
        .createDBCluster({
          DatabaseName: dbName,
          EngineMode: 'serverless',
          Engine: 'aurora-postgresql',
          EnableHttpEndpoint: true,
          DBClusterIdentifier: identifier,
          MasterUsername: username,
          MasterUserPassword: password,
          ScalingConfiguration: {
            AutoPause: true,
            MaxCapacity: 4,
            MinCapacity: 2,
            SecondsUntilAutoPause: 300
          },
          ...opts
        })
        .promise()
        .then(data => data.DBCluster)
    } catch (err) {
      if (err.code === 'DBClusterAlreadyExistsFault') {
        db = await getDBByName(identifier)
      } else {
        throw new Error(`[Could not create DBCluster]: ${err.message}`)
      }
    }

    try {
      secret = await secretsmanager
        .createSecret({
          ClientRequestToken: nanoid(),
          Description: 'next-sql-db-password',
          Name: identifier,
          SecretString: JSON.stringify({
            username: username,
            password: password,
            engine: 'postgres',
            host: db.Endpoint,
            port: 5432,
            dbClusterIdentifier: identifier
          })
        })
        .promise()
    } catch (err) {
      if (err.code === 'ResourceExistsException') {
        try {
          secret = await secretsmanager
            .describeSecret({
              SecretId: identifier
            })
            .promise()
        } catch (err) {
          if (!sercret) {
            throw new Error(`[Could not find DBCluster secret]: ${err.message}`)
          }
        }
      } else {
        throw new Error(`[Could not create DBCluster secret]: ${err.message}`)
      }
    }

    return {
      resourceArn: db.DBClusterArn,
      secretArn: secret.ARN,
      database: dbName,
      isLocal: false
    }
  }

  return {
    createDB,
    waitOnAvailable
  }
}
