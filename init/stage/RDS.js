const AWS = require('aws-sdk')
const nanoid = require('../id')

function pick(obj, props) {
  const newObj = {}
  for (let key of props) {
    if (obj[key]) {
      newObj[key] = obj[key]
    }
  }

  return newObj
}

class RDS {
  constructor() {
    this.rds = new AWS.RDS()
    this.secretsmanager = new AWS.SecretsManager()
  }

  async del(DBClusterIdentifier) {
    // NB always try del db first
    // as it has delete protection.
    await this.rds
      .deleteDBCluster({
        DBClusterIdentifier,
        SkipFinalSnapshot: true
      })
      .promise()

    return this.secretsmanager
      .deleteSecret({
        ForceDeleteWithoutRecovery: true,
        SecretId: DBClusterIdentifier
      })
      .promise()
  }

  async getDBAll() {
    const { DBClusters } = await this.rds
      .describeDBClusters({
        MaxRecords: 40
      })
      .promise()

    return DBClusters
  }

  async cleanup(DBClusters) {
    // Deletes the oldest non-protected database
    const clusters = DBClusters.sort((a, b) => {
      return new Date(a.ClusterCreateTime) - new Date(b.ClusterCreateTime)
    })

    try {
      // mutates
      const oldest = clusters.shift()
      await this.del(oldest.DBClusterIdentifier)
    } catch (err) {
      if (
        err.code === 'InvalidParameterCombination' &&
        err.message.includes('Cannot delete protected Cluster')
      ) {
        return this.cleanup(clusters)
      } else {
        throw err
      }
    }
  }

  async getDBByName(name) {
    const { DBClusters } = await this.rds
      .describeDBClusters({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [name]
          }
        ]
      })
      .promise()

    const [db] = DBClusters
    if (!db) {
      throw new Error('Database does not exist')
    }
    return db
  }

  async getDBStatus(dbArn) {
    const { DBClusters } = await this.rds
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

  async sleep(timeout) {
    return new Promise(res => {
      setTimeout(() => {
        res()
      }, timeout)
    })
  }

  async modifyDB(id, opts) {
    const modifyOpts = pick(opts, [
      'ScalingConfiguration',
      'DeletionProtection'
    ])

    return this.rds
      .modifyDBCluster({
        ApplyImmediately: true,
        DBClusterIdentifier: id,
        ...modifyOpts
      })
      .promise()
  }

  async waitOnAvailable(resourceArn) {
    let status = null

    while (status !== 'available') {
      status = await this.getDBStatus(resourceArn)
      await this.sleep(5000)
    }

    return status
  }

  async createDB(identifier, opts) {
    const username = 'master'
    const dbName = 'master'
    const password = nanoid()
    let db
    let secret

    try {
      db = await this.rds
        .createDBCluster({
          DatabaseName: dbName,
          EnableHttpEndpoint: true,
          DBClusterIdentifier: identifier,
          MasterUsername: username,
          MasterUserPassword: password,
          EngineMode: 'serverless',
          ...opts
        })
        .promise()
        .then(data => data.DBCluster)
    } catch (err) {
      if (err.code === 'DBClusterAlreadyExistsFault') {
        db = await this.getDBByName(identifier)
        // ensure the db has the expected name
        await this.modifyDB(identifier, opts)
      } else if (err.code == 'DBClusterQuotaExceededFault') {
        const dbs = await this.getDBAll()
        await this.cleanup(dbs)
        // start again
        return this.createDB(identifier, opts)
      } else {
        throw new Error(`[Could not create DBCluster]: ${err.message}`)
      }
    }

    try {
      secret = await this.secretsmanager
        .createSecret({
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
          secret = await this.secretsmanager
            .describeSecret({
              SecretId: identifier
            })
            .promise()
        } catch (err) {
          throw new Error(`[Could not find DBCluster secret]: ${err.message}`)
        }
      } else {
        throw new Error(`[Could not create DBCluster secret]: ${err.message}`)
      }
    }

    return {
      resourceArn: db.DBClusterArn,
      secretArn: secret.ARN,
      database: dbName
    }
  }
}

module.exports = RDS
