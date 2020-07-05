const nanoid = require('../id')
const log = require('../../log')

class Stage {
  // base class
  constructor(id, engine) {
    this.id = id ? id : nanoid()
    this.engine = engine
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
