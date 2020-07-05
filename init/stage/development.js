const Stage = require('./base')
const compose = require('docker-compose')
const path = require('path')
const compile = require('../../build/webpack')

// https://github.com/koxudaxi/local-data-api
const LOCAL_CONNECTIONS = {
  resourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:dummy',
  secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy',
  database: 'master',
  options: {
    endpoint: 'http://localhost:8080'
  }
}

const NAWR_WORKER_CONNECTION = {
  options: {
    endpoint: 'http://localhost:3000/__nawr__/workers'
  },
  stage: 'development'
}

class DevelopmentState extends Stage {
  _createDB() {
    return compose
      .upAll({
        cwd: path.join(__dirname, 'docker'),
        log: true,
        config: `${this.engine}.yml`,
        commandOptions: ['--force-recreate', '--build']
      })
      .then(
        () => {
          return LOCAL_CONNECTIONS
        },
        err => {
          throw err
        }
      )
  }

  async _createWorkers() {
    await compile(process.cwd(), 'workers')
    return NAWR_WORKER_CONNECTION
  }
}

module.exports = DevelopmentState
