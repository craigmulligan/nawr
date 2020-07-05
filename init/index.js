const envfile = require('envfile')
const fs = require('fs').promises
const path = require('path')
const log = require('../log')
const pkg = require('../package.json')
const stages = require('./stage')
const { getCredentials, setCredentials } = require('./credentials')

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

const init = async ({ engine, stage, id }) => {
  setCredentials(stage)
  const infra = new stages[stage](id, 'aurora-' + engine)
  const connectionValues = await infra.createDB()
  // // wait on available
  await infra.waitDB()

  const CWD = process.cwd()
  const envFilePath = path.join(CWD, '.env')

  // gets .env contents
  const env = await getEnv(envFilePath)

  const workersConnectionValues = await infra.createWorkers({
    ...env,
    NAWR_SQL_CONNECTION: JSON.stringify(connectionValues)
  })

  // set .env contents with connectionValues
  try {
    await setEnv(envFilePath, {
      ...env,
      NAWR_WORKER_CONNECTION: JSON.stringify(workersConnectionValues),
      NAWR_SQL_CONNECTION: JSON.stringify({
        ...connectionValues,
        version: pkg.version,
        stage,
        id
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
  id: {
    description: 'set database id',
    type: 'string'
  },
  stage: {
    description: 'which stage to provision the database for',
    default: 'development',
    choices: ['development', 'preview', 'production']
  }
}
exports.handler = init
exports.getEnv = getEnv
