const Stage = require('./base')
const RDS = require('./RDS')
const pkg = require('../../package.json')

class PreviewStage extends Stage {
  constructor(id, engine) {
    super(id, engine)

    this.constructor.setCredentials()
    this.rds = new RDS()
  }

  _create() {
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
    // createDB
  }

  _wait() {
    return this.rds.waitOnAvailable(this.connectionValues.resourceArn)
  }
}

module.exports = PreviewStage
