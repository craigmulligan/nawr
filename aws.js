const AWS = require('aws-sdk')
const log = require('log-level')

const ensureEnv = (required, optional) => {
  for (key of required) {
    if (!process.env[key]) {
      throw new Error(`${key} is not set`)
    }
  }

  for (key of optional) {
    if (!process.env[key]) {
      log.warn(`${key} is not set`)
    }
  }
}

ensureEnv(['NAWR_AWS_KEY_ID', 'NAWR_AWS_SECRET'], ['NAWR_AWS_REGION'])

const {
  NAWR_AWS_KEY_ID: accessKeyId,
  NAWR_AWS_SECRET: secretAccessKey,
  NAWR_AWS_REGION: region
} = process.env

const credentials = new AWS.Credentials({
  accessKeyId,
  secretAccessKey
})

AWS.config.update({
  credentials,
  region: region || process.env.AWS_REGION || 'us-east-1'
})

module.exports = AWS
