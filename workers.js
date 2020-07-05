const fetch = require('node-fetch').default
const AWS = require('aws-sdk')
const { getCredentials, setCredentials } = require('./init/credentials')

if (!process.env.NAWR_WORKER_CONNECTION) {
  throw new Error(
    `NAWR_WORKER_CONNECTION is not set: You may need to run: $ nawr init`
  )
}

const connectionValue = JSON.parse(process.env.NAWR_WORKER_CONNECTION)
const { functions, stage, options } = connectionValue
setCredentials(stage)

const lambda = new AWS.Lambda()

const run = async (name, event) => {
  const data = await fetch(`${options.endpoint}?name=${name}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(event)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(res.statusText)
      }
      return res
    })
    .then(res => {
      return res.json()
    })

  return data
}

const invoke = async (name, event) => {
  var params = {
    FunctionName: functions[name],
    InvokeArgs: JSON.stringify(event)
  }

  await lambda.invokeAsync(params).promise()
}

module.exports = {
  run: stage === 'development' ? run : invoke
}
