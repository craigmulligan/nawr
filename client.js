// This is required so config.update takes place.
// It must be required before the data-api-client
const http = require('http')
const dataApi = require('data-api-client')

if (!process.env.NAWR_SQL_CONNECTION) {
  throw new Error(
    `NAWR_SQL_CONNECTION is not set: You may need to run: $ nawr init`
  )
}
const connectionValue = JSON.parse(process.env.NAWR_SQL_CONNECTION)
const { secretArn, resourceArn, database, options } = connectionValue
const isLocal = options && options.isLocal
const {
  NAWR_AWS_KEY_ID: accessKeyId,
  NAWR_AWS_SECRET: secretAccessKey,
  NAWR_AWS_REGION: region
} = process.env

const client = dataApi({
  resourceArn,
  secretArn,
  database,
  sslEnabled: false,
  keepAlive: false,
  debug: true,
  region: region || 'us-east-1',
  options: {
    ...options,
    httpOptions: {
      agent: isLocal && new Agent()
    },
    accessKeyId,
    secretAccessKey
  }
})
module.exports = client
