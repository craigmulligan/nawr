const envfile = require('envfile')
const fs = require('fs').promises
const { createDB, waitOnAvailable } = require('./aws')
const path = require('path')
const nanoid = require('./id')

const CONNECTION_TYPES = Object.freeze({
  postgres: 'postgres',
  mysql: 'postgres'
})
const DIR = '.sql'

const getConnectionValues = async buildId => {
  if (process.env.NAWR_SQL_CONNECTION) {
    console.log('connection details exist ignoring')
    return JSON.parse(process.env.NAWR_SQL_CONNECTION)
  }

  const connectionValues = await createDB(buildId)
  await waitOnAvailable(connectionValues.resourceArn)
  return connectionValues
}

const getEnv = async envFilePath => {
  // always use an .env file if available
  try {
    await fs.access(envFilePath)
    return envfile.parseFileSync(envFilePath)
  } catch (err) {
    // todo specifically handle err code
    // doesnt exist
    return {}
  }
}

const setEnv = async (envFilePath, env) => {
  try {
    const envStr = envfile.stringifySync(env)

    await fs.writeFile(envFilePath, envStr)
  } catch (err) {
    console.log('couldnt write .env', err)
  }
}

const init = async () => {
  const buildId = process.env.NAWR_SQL_IS_PROD ? 'prod' : nanoid()

  // creates db and wait for it to be available
  const connectionValues = await getConnectionValues(buildId)

  const CWD = process.cwd()
  const envFilePath = path.join(CWD, '.env')

  // gets .env contents
  const env = await getEnv(envFilePath)

  // set .env contents with connectionValues
  await setEnv(envFilePath, {
    ...env,
    NAWR_SQL_CONNECTION: JSON.stringify(connectionValues)
  })

  return env
}

module.exports = init
