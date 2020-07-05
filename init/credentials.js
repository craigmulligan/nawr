const AWS = require('aws-sdk')
const log = require('../log')
const ensureEnv = (required = [], optional = []) => {
  for (let key of required) {
    if (!process.env[key]) {
      throw new Error(`${key} is not set`)
    }
  }

  for (let key of optional) {
    if (!process.env[key]) {
      log.warn(`${key} is not set`)
    }
  }
}

function getCredentials(stage) {
  if (stage === 'development') {
    return {
      accessKeyId: 'local-dummy-accesskey',
      secretAccessKey: 'local-dummy-accesskey'
    }
  }

  ensureEnv(['NAWR_AWS_KEY_ID', 'NAWR_AWS_SECRET'], ['NAWR_AWS_REGION'])
  const {
    NAWR_AWS_KEY_ID: accessKeyId,
    NAWR_AWS_SECRET: secretAccessKey,
    NAWR_AWS_REGION: region
  } = process.env

  return {
    accessKeyId,
    secretAccessKey,
    region
  }
}

function setCredentials(stage) {
  const { accessKeyId, secretAccessKey, region } = getCredentials(stage)

  const credentials = new AWS.Credentials({
    accessKeyId,
    secretAccessKey
  })

  AWS.config.update({
    credentials,
    region: region || 'us-east-1'
  })
}

module.exports = {
  getCredentials,
  setCredentials
}
