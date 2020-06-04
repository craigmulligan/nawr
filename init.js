const envfile = require('envfile')
const fs = require('fs').promises
const { createDB, waitOnAvailable } = require('./aws')
const path = require('path')
const nanoid = require('./id')

const getConnectionValues = async (buildId, opts) => {
  if (process.env.NAWR_SQL_CONNECTION) {
    console.log('connection details exist ignoring')
    return JSON.parse(process.env.NAWR_SQL_CONNECTION)
  }

  const connectionValues = await createDB(buildId, opts)
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

const init = async ({ engine }) => {
  if (!engine) {
    engine = 'postgresql'
  }

  const isProd = process.env.NAWR_SQL_IS_PROD
  const buildId = isProd ? 'prod' : nanoid()
  const engineMode = isProd ? 'provisioned' : 'serverless'

  // creates db and wait for it to be available
  const connectionValues = await getConnectionValues(buildId, {
    engineMode,
    engine: `aurora-${engine}`
  })

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

init.help = `
  nawr init 

  Options:
    --engine (postgresql|mysql) [default:postgresql] 
`

module.exports = init
