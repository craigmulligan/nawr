const compose = require('docker-compose')
const path = require('path')

// https://github.com/koxudaxi/local-data-api
const LOCAL_CONNECTIONS = {
  resourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:dummy',
  secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy',
  database: 'master',
  isLocal: true,
  options: {
    endpoint: 'http://127.0.0.7:8080'
  }
}

const createDB = async (buildId, { engine }) => {
  return compose
    .upAll({
      cwd: path.join(__dirname),
      log: true,
      config: `${engine}.yml`
    })
    .then(
      data => {
        return LOCAL_CONNECTIONS
      },
      err => {
        throw err
      }
    )
}

const waitOnAvailable = () => {
  // todo wait for proxy to be up.
  // Seemes to be working for now
  return Promise.resolve()
}

module.exports = {
  createDB,
  waitOnAvailable
}
