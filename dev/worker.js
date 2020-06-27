const webpack = require('webpack')
const { promisify } = require('util')
const compile = promisify(webpack)
const dockerLambda = require('docker-lambda')
const id = require('../init/id')
const { getEnv } = require('../init')
const getPort = require('get-port')
const execa = require('execa')
const log = require('../log')

const run = async (fileName, event) => {
  const spinner = ora()
  const sourceDir = process.cwd()
  const taskDir = sourceDir + '/.nawr/workers'
  const env = await getEnv(sourceDir + '/.env')

  const config = {
    target: 'node',
    entry: {
      [fileName]: sourceDir + '/workers/' + fileName + '.js'
    },
    mode: 'production',
    output: {
      filename: '[name].js',
      path: sourceDir + '/.nawr/workers',
      libraryTarget: 'commonjs'
    },
    resolve: {
      modules: [
        sourceDir + '/node_modules',
        __dirname + '/node_modules',
        'node_modules'
      ],
      symlinks: true
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: [
            'cache-loader',
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          ]
        }
      ]
    }
  }

  log.wait(`Compiling worker: ${fileName}`)
  const stats = await compile(config)
  const info = stats.toJson()

  if (stats.hasErrors()) {
    log.error(info.errors)
  }

  if (stats.hasWarnings()) {
    log.warn(info.warnings)
  }
  log.event(`Compiled worker: ${fileName}`)

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
      `${fileName}.default`,
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
    log.event(`Ran worker: ${fileName}`)
  })

  return name
}

module.exports = run
