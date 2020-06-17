const Stage = require('./base')
const RDS = require('./RDS')
const pkg = require('../../package.json')

class ProductionStage extends Stage {
  constructor(id, engine) {
    if (!id) {
      throw new Error('In production stage a database an --id must be provided')
    }

    super(id, engine)

    this.constructor.setCredentials()
    this.rds = new RDS()
  }

  _create() {
    const opts = {
      ScalingConfiguration: {
        AutoPause: false
      },
      Tags: [
        {
          Key: 'nawr-version',
          Value: pkg.version
        },
        {
          Key: 'nawr-production',
          Value: 'true'
        }
      ],
      Engine: this.engine
    }

    return this.rds.createDB(this.id, opts)
  }

  async _wait() {
    await this.rds.waitOnAvailable(this.connectionValues.resourceArn)
    return this.connectionValues
  }
}

module.exports = ProductionStage
