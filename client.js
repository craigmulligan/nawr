// This is required so config.update takes place.
// It must be required before the data-api-client
const dataApi = require('data-api-client')
const { Agent } = require('http')
const { URL } = require('url')

const isLocal = options => {
  if (options.endpoint) {
    const url = new URL(options.endpoint)

    if (url.protocol === 'http') {
      return true
    }
  }

  return false
}

if (!process.env.NAWR_SQL_CONNECTION) {
  throw new Error(
    `NAWR_SQL_CONNECTION is not set: You may need to run: $ nawr init`
  )
}
const connectionValue = JSON.parse(process.env.NAWR_SQL_CONNECTION)
const { secretArn, resourceArn, database, version, options } = connectionValue

const local = isLocal(options)

const {
  NAWR_AWS_KEY_ID: accessKeyId,
  NAWR_AWS_SECRET: secretAccessKey,
  NAWR_AWS_REGION: region
} = process.env

const client = dataApi({
  resourceArn,
  secretArn,
  database,
  region: region || 'us-east-1',
  options: {
    ...options,
    httpOptions: {
      agent: isLocal(options) && new Agent()
    },
    accessKeyId: accessKeyId || 'local-dummy-accesskey',
    secretAccessKey: secretAccessKey || 'local-dummy-secret'
  }
})
module.exports = client
