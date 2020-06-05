const envfile = require('envfile')
const fs = require('fs').promises
const { createDB, waitOnAvailable } = require('../aws')
const path = require('path')
const nanoid = require('./id')
const ora = require('ora')

const getConnectionValues = async (buildId, opts) => {
  if (process.env.NAWR_SQL_CONNECTION) {
    console.warn('connection details exist ignoring')
    return JSON.parse(process.env.NAWR_SQL_CONNECTION)
  }

  const spinner = ora('Creating Database').start()
  try {
    const connectionValues = await createDB(buildId, opts)
    spinner.succeed(`Database created: ${connectionValues.resourceArn}`)
  } catch (err) {
    ora.fail(`Failed to create database: ${err.message}`)
    throw err
  }

  spinner.start('Waiting on database to be availablility')
  try {
    await waitOnAvailable(connectionValues.resourceArn)
    spinner.succeed(`Database is available: ${err.message}`)
  } catch (err) {
    spinner.fail(
      `Failed while waiting for database to be available: ${err.message}`
    )
    throw err
  }

  spinner.clear()
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
  const envStr = envfile.stringifySync(env)
  await fs.writeFile(envFilePath, envStr)
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
  try {
    await setEnv(envFilePath, {
      ...env,
      NAWR_SQL_CONNECTION: JSON.stringify(connectionValues)
    })
  } catch (err) {
    throw new Error('Could not save connection details in .env')
  }

  return env
}

init.help = `
  nawr init 

  Options:
    --engine (postgresql|mysql) [default:postgresql] 
`

module.exports = init
