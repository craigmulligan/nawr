const Stage = require('./base')
const RDS = require('./RDS')
const Lambda = require('./lambda')
const pkg = require('../../package.json')
const log = require('../../log')

class PreviewStage extends Stage {
  constructor(id, engine) {
    super(id, engine)

    this.constructor.setCredentials()
    this.rds = new RDS()
    this.lambda = new Lambda()
  }

  async _create() {
    const opts = {
      ScalingConfiguration: {
        AutoPause: true,
        MaxCapacity: 4,
        MinCapacity: 2,
        SecondsUntilAutoPause: 300
      },
      Tags: [
        {
          Key: 'nawr-version',
          Value: pkg.version
        }
      ],
      Engine: this.engine
    }
    return this.rds.createDB(this.id, opts)
  }

  async _wait() {
    // await this.rds.waitOnAvailable(this.connectionValues.resourceArn)
    return this.connectionValues
  }

  async createWorkers(env) {
    const path = process.cwd() + '/.nawr/workers/index.js'
    log.wait('creating function')
    const fnName = await this.lambda.createFunction(this.id, path, env)

    return {
      index: fnName
    }
    log.event('function created')
  }
}

module.exports = PreviewStage
