const Preview = require('./preview')
const RDS = require('./RDS')
const pkg = require('../../package.json')

class ProductionStage extends Preview {
  constructor(id, engine, dir) {
    if (!id) {
      throw new Error('In production stage a database an --id must be provided')
    }

    super(id, engine, dir)
  }

  _createDB() {
    const opts = {
      ScalingConfiguration: {
        AutoPause: false
      },
      DeletionProtection: true,
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
}

module.exports = ProductionStage
