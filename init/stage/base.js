const ora = require('ora')
const nanoid = require('../id')
const AWS = require('aws-sdk')
const log = require('loglevel')

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
    this.spinner = ora()
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

  _create() {
    // subclasses override this
    return Promise.resolve()
  }

  _wait() {
    // subclasses override this
    return Promise.resolve()
  }

  async create() {
    this.spinner.start('Creating Database')
    try {
      this.connectionValues = await this._create(this.id)
      this.spinner.succeed(
        `Database created: ${this.connectionValues.resourceArn}`
      )
      return this.connectionValues
    } catch (err) {
      this.spinner.fail(`Failed to create database: ${err.message}`)
      throw err
    }
  }

  async wait() {
    try {
      this.spinner.start(`Waiting on database to be available`)
      await this._wait()
      this.spinner.succeed(`Database is available`)
    } catch (err) {
      this.spinner.fail(`Database is not available`)
      throw err
    }

    return this.connectionValues
  }
}

module.exports = Stage
