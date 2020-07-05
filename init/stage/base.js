const nanoid = require('../id')
const AWS = require('aws-sdk')
const log = require('../../log')

const ensureEnv = (required = [], optional = []) => {
  for (let key of required) {
    if (!process.env[key]) {
      throw new Error(`${key} is not set`)
    }
  }

  for (let key of optional) {
    if (!process.env[key]) {
      log.warn(`${key} is not set`)
    }
  }
}

class Stage {
  // base class
  constructor(id, engine) {
    this.id = id ? id : nanoid()
    this.engine = engine
  }

  static setCredentials() {
    const { accessKeyId, secretAccessKey, region } = this.getCredentials()

    const credentials = new AWS.Credentials({
      accessKeyId,
      secretAccessKey
    })

    AWS.config.update({
      credentials,
      region: region || 'us-east-1'
    })
  }

  static getCredentials() {
    ensureEnv(['NAWR_AWS_KEY_ID', 'NAWR_AWS_SECRET'], ['NAWR_AWS_REGION'])
    const {
      NAWR_AWS_KEY_ID: accessKeyId,
      NAWR_AWS_SECRET: secretAccessKey,
      NAWR_AWS_REGION: region
    } = process.env

    return {
      accessKeyId,
      secretAccessKey,
      region
    }
  }

  _createDB() {
    // subclasses override this
    return Promise.resolve()
  }

  _waitDB() {
    // subclasses override this
    return Promise.resolve()
  }

  async createDB() {
    log.wait('Creating Database')
    try {
      this.connectionValues = await this._createDB(this.id)
      log.ready(`Database created: ${this.connectionValues.resourceArn}`)
      return this.connectionValues
    } catch (err) {
      log.error(`Failed to create database: ${err.message}`)
      throw err
    }
  }

  async waitDB() {
    try {
      log.wait(`Waiting on database to be available`)
      await this._waitDB()
      log.ready(`Database is available`)
    } catch (err) {
      log.error(`Database is not available`)
      throw err
    }

    return this.connectionValues
  }

  async createWorkers(env) {
    log.wait('Creating Workers')
    try {
      this.workersConnectionValues = await this._createWorkers(this.id, env)
      return this.workersConnectionValues
    } catch (err) {
      log.error(`Failed to create workers: ${err.message}`)
      throw err
    }
  }
}

module.exports = Stage
