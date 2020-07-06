const id = require('../init/id')
const { getEnv } = require('../init')
const getPort = require('get-port')
const execa = require('execa')
const log = require('../log')
const compile = require('../build/webpack')
const path = require('path')

const run = async (fileName, event) => {
  const sourceDir = process.cwd()
  const taskDir = sourceDir + '/.nawr/workers'
  const env = await getEnv(sourceDir + '/.env')

  log.wait(`Compiling worker: ${fileName}`)
  const [handlerName] = await compile(sourceDir, 'workers', `${fileName}`, true)
  console.log(handlerName)

  log.wait(`Running worker: ${fileName}`)
  const name = id()
  const port = await getPort()

  // aws lambda invoke --endpoint http://localhost:9001 --no-sign-request \
  // --function-name myfunction --payload '{}' output.json
  const dockerEnv = Object.entries(env).reduce(
    (acc, [k, v]) => {
      return [...acc, '-e', `${k}=${v}`]
    },
    [
      '-e',
      'AWS_LAMBDA_FUNCTION_TIMEOUT=900',
      '-e',
      `DOCKER_LAMBDA_RUNTIME_PORT=${port}`
    ]
  )

  const args = [
    'run',
    ...['-v', taskDir + ':/var/task'],
    '--name',
    name,
    '--network',
    'host',
    ...dockerEnv,
    ...[
      'lambci/lambda:nodejs12.x',
      `${path.parse(handlerName).name}.default`,
      JSON.stringify(event)
    ]
  ]
  const ps = execa('docker', args)

  // TODO prefix the output with
  // the worker names
  ps.stderr.pipe(process.stderr)
  ps.stdout.pipe(process.stdout)

  ps.on('exit', code => {
    const method = code == 0 ? 'event' : 'error'
    log[method](`Ran worker: ${fileName}`)
  })

  return name
}

module.exports = run
