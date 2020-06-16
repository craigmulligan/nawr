// This is required so config.update takes place.
// It must be required before the data-api-client
const dataApi = require('data-api-client')
const { Agent } = require('http')
const { URL } = require('url')
const stages = require('./init/stage')

const isHttp = options => {
  if (options && options.endpoint) {
    const url = new URL(options.endpoint)

    if (url.protocol === 'http') {
      return true
    }

    return false
  }

  return false
}

if (!process.env.NAWR_SQL_CONNECTION) {
  throw new Error(
    `NAWR_SQL_CONNECTION is not set: You may need to run: $ nawr init`
  )
}

const connectionValue = JSON.parse(process.env.NAWR_SQL_CONNECTION)
const { secretArn, resourceArn, database, options, stage } = connectionValue
// ensures the aws-sdk is setup properly
stages[stage].setCredentials()

const client = dataApi({
  resourceArn,
  secretArn,
  database,
  options: {
    ...options,
    httpOptions: {
      agent: isHttp(options) && new Agent()
    }
  }
})
module.exports = client
