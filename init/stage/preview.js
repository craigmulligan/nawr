const Stage = require('./base')
const RDS = require('./RDS')
const Lambda = require('./lambda')
const pkg = require('../../package.json')
const log = require('../../log')
const { promisify } = require('util')
const readdir = promisify(require('fs').readdir)
const path = require('path')
const nanoId = require('../id')
const compile = require('../../build/webpack')

class PreviewStage extends Stage {
  constructor(id, engine) {
    super(id, engine)

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

  async _waitDB() {
    await this.rds.waitOnAvailable(this.connectionValues.resourceArn)
    return this.connectionValues
  }

  async _createWorkers(id, env) {
    await compile(this.dir, 'workers')
    // All lambdas should have a unique name
    // even if an id is provided we suffix with a unique id
    const uuid = nanoId()
    const workersDir = this.dir + '/.nawr/workers'
    const files = await readdir(workersDir)

    const fns = files.map(p => {
      const name = path.parse(p).name
      return [name, `workers-${name}-${id}-${uuid}`, `${workersDir}/${p}`]
    })

    const fnMap = fns.reduce((acc, [key, value]) => {
      return {
        ...acc,
        [key]: value
      }
    }, {})

    const workersConnectionValues = {
      stage: 'preview',
      id,
      functions: fnMap
    }

    log.wait('creating functions')
    await Promise.all(
      fns.map(([name, lambdaName, p]) => {
        return this.lambda.createFunction(name, lambdaName, p, {
          ...env,
          NAWR_WORKER_CONNECTION: JSON.stringify(workersConnectionValues)
        })
      })
    )

    log.event('functions created')
    return workersConnectionValues
  }
}

module.exports = PreviewStage
