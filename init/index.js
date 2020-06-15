const envfile = require('envfile')
const fs = require('fs').promises
const path = require('path')
const ora = require('ora')
const log = require('loglevel')
const remote = require('./remote')
const local = require('./local')
const nanoid = require('./id')
const pkg = require('../package.json')

const getConnectionValues = provider => async (buildId, opts) => {
  const spinner = ora('Creating Database').start()
  let connectionValues

  try {
    connectionValues = await provider.createDB(buildId, opts)
    spinner.succeed(`Database created: ${connectionValues.resourceArn}`)
  } catch (err) {
    spinner.fail(`Failed to create database: ${err.message}`)
    throw err
  }

  spinner.start('Waiting on database to be available')
  try {
    await provider.waitOnAvailable(connectionValues)
    spinner.succeed(`Database is available`)
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

const init = async ({ engine, local: isLocal, id, mode, protect }) => {
  const buildId = id ? id : nanoid()
  const provider = isLocal ? local : remote

  // creates db and wait for it to be available
  const connectionValues = await getConnectionValues(provider())(buildId, {
    EngineMode: mode,
    Engine: `aurora-${engine}`,
    DeletionProtection: !!protect
  })

  const CWD = process.cwd()
  const envFilePath = path.join(CWD, '.env')

  // gets .env contents
  const env = await getEnv(envFilePath)

  // set .env contents with connectionValues
  try {
    await setEnv(envFilePath, {
      ...env,
      NAWR_SQL_CONNECTION: JSON.stringify({
        ...connectionValues,
        version: pkg.version
      })
    })
    log.info('Connection values saved to .env')
  } catch (err) {
    throw new Error('Could not save connection details in .env')
  }

  return env
}

// cli module
exports.command = 'init'
exports.describe = 'initialize sql db'
exports.builder = {
  engine: {
    alias: 'e',
    description: 'set storage engine',
    default: 'postgresql',
    choices: ['postgresql', 'mysql']
  },
  mode: {
    alias: 'm',
    description: 'set engine mode',
    default: 'serverless',
    choices: ['serverless', 'provisioned']
  },
  id: {
    description: 'set database id',
    type: 'string'
  },
  local: {
    description: 'Run a local db instance',
    type: 'boolean'
  },
  protect: {
    description: 'Never delete this db instance',
    type: 'number',
    default: 0
  }
}
exports.handler = init
exports.getEnv = getEnv
